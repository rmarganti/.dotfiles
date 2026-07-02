#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PLUGIN_ID = 'dots.herdr-launchables';
const HERDR_BIN = process.env.HERDR_BIN_PATH || 'herdr';
const SELF_PATH = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = process.env.HERDR_PLUGIN_ROOT || path.dirname(SELF_PATH);
const OVERLAY_CLOSE_TIMEOUT_MS = 5000;
const OVERLAY_CLOSE_POLL_MS = 50;
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.config/.launchables.json');
const PROJECT_CONFIG_NAME = '.launchables.json';

type LaunchableSource = 'global' | 'project';
type SplitDirection = 'right' | 'down';

export interface BackgroundLaunchable {
    type: 'background';
    command: string;
    cwd?: string;
}

export type TabLaunchable = {
    type: 'tab';
    cwd?: string;
} & (
    | { command: string; commands?: never }
    | { command?: never; commands: string[] }
);

export interface SplitLaunchable {
    type: 'split';
    command: string;
    cwd?: string;
    direction?: SplitDirection;
}

export type Launchable = BackgroundLaunchable | TabLaunchable | SplitLaunchable;
export type LaunchablesFile = Record<string, Launchable>;

export interface ResolvedLaunchable {
    name: string;
    source: LaunchableSource;
    configPath: string;
    configDir: string;
    launchable: Launchable;
}

interface SelectionPayload {
    workspaceId: string;
    sourcePaneId: string;
    selectedAtCwd: string;
    resolved: ResolvedLaunchable;
}

interface PluginContext {
    workspaceId: string;
    paneId: string;
    cwd: string;
}

interface ValidationResult {
    launchable: Launchable | null;
    errors: string[];
}

function parseJson<T>(value: string, fallback: T): T {
    try {
        return value ? (JSON.parse(value) as T) : fallback;
    } catch {
        return fallback;
    }
}

const contextJson = parseJson<Record<string, unknown>>(
    process.env.HERDR_PLUGIN_CONTEXT_JSON || '',
    {}
);

function contextValue(...keys: string[]): string {
    for (const key of keys) {
        const envValue = process.env[key];
        if (typeof envValue === 'string' && envValue.length > 0)
            return envValue;
        const contextValue = contextJson[key];
        if (typeof contextValue === 'string' && contextValue.length > 0)
            return contextValue;
    }
    return '';
}

function stateDir(): string {
    return process.env.HERDR_PLUGIN_STATE_DIR || os.tmpdir();
}

function ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
}

function pluginLogFile(): string {
    const filePath = path.join(stateDir(), 'launchables.log');
    ensureDir(path.dirname(filePath));
    return filePath;
}

function appendLog(message: string): void {
    fs.appendFileSync(
        pluginLogFile(),
        `[${new Date().toISOString()}] ${message}\n`
    );
}

function herdr(
    args: string[],
    options: Parameters<typeof spawnSync>[2] = {}
): string {
    const result = spawnSync(HERDR_BIN, args, {
        encoding: 'utf8',
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
        ...options,
    });

    if (result.error) throw result.error;
    const stderr = typeof result.stderr === 'string' ? result.stderr : '';
    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    if (result.status !== 0) {
        throw new Error(
            `herdr ${args.join(' ')} failed (${result.status})\n${stderr}${stdout}`
        );
    }
    return stdout;
}

function herdrPaneRun(paneId: string, command: string): string {
    return herdr(['pane', 'run', paneId, `${command} && exit`]);
}

function herdrJson<T>(args: string[]): T {
    const output = herdr(args);
    return JSON.parse(output) as T;
}

function focusedPaneInfo(paneId?: string): {
    paneId: string;
    workspaceId: string;
    cwd: string;
} {
    const args = paneId
        ? ['pane', 'current', '--pane', paneId]
        : ['pane', 'current'];
    const data = herdrJson<{
        result?: {
            pane?: {
                pane_id?: string;
                workspace_id?: string;
                cwd?: string;
                foreground_cwd?: string;
            };
        };
    }>(args);
    const pane = data.result?.pane || {};
    return {
        paneId: pane.pane_id || '',
        workspaceId: pane.workspace_id || '',
        cwd: pane.foreground_cwd || pane.cwd || '',
    };
}

function getPluginContext(): PluginContext {
    let paneId =
        process.env.LAUNCHABLES_SOURCE_PANE_ID ||
        contextValue('HERDR_PANE_ID', 'pane_id', 'focused_pane_id');
    let workspaceId =
        process.env.LAUNCHABLES_WORKSPACE_ID ||
        contextValue('HERDR_WORKSPACE_ID', 'workspace_id');
    let cwd =
        process.env.LAUNCHABLES_CWD ||
        contextValue('focused_pane_cwd', 'pane_cwd', 'workspace_cwd');

    const fallback = focusedPaneInfo(paneId || undefined);
    if (!paneId) paneId = fallback.paneId;
    if (!workspaceId) workspaceId = fallback.workspaceId;
    if (!cwd) cwd = fallback.cwd;

    return {
        workspaceId,
        paneId,
        cwd,
    };
}

function readJsonFile<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateLaunchable(name: string, value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { launchable: null, errors: [`${name}: expected object`] };
    }

    const candidate = value as Record<string, unknown>;
    const type = candidate.type;
    const cwd = candidate.cwd;
    const normalizedCwd = isNonEmptyString(cwd) ? cwd : undefined;

    if (!isNonEmptyString(type)) errors.push(`${name}: missing string type`);
    if (cwd !== undefined && !normalizedCwd)
        errors.push(`${name}: cwd must be a non-empty string when provided`);

    if (type === 'background') {
        const command = candidate.command;
        if (!isNonEmptyString(command))
            errors.push(
                `${name}: background.command must be a non-empty string`
            );
        if (candidate.commands !== undefined)
            errors.push(`${name}: background must not define commands`);
        if (candidate.direction !== undefined)
            errors.push(`${name}: background must not define direction`);
        return errors.length === 0 && isNonEmptyString(command)
            ? {
                  launchable: {
                      type: 'background',
                      command,
                      ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                  },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (type === 'split') {
        const command = candidate.command;
        const direction = candidate.direction;
        if (!isNonEmptyString(command))
            errors.push(`${name}: split.command must be a non-empty string`);
        if (candidate.commands !== undefined)
            errors.push(`${name}: split must not define commands`);
        if (
            direction !== undefined &&
            direction !== 'right' &&
            direction !== 'down'
        ) {
            errors.push(`${name}: split.direction must be right or down`);
        }
        return errors.length === 0 && isNonEmptyString(command)
            ? {
                  launchable: {
                      type: 'split',
                      command,
                      ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                      ...(direction === 'right' || direction === 'down'
                          ? { direction }
                          : {}),
                  },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (type === 'tab') {
        const command = candidate.command;
        const commands = candidate.commands;
        const validCommand = isNonEmptyString(command) ? command : null;
        const validCommands =
            Array.isArray(commands) &&
            commands.length > 0 &&
            commands.every((item) => isNonEmptyString(item))
                ? commands
                : null;

        if (command !== undefined && commands !== undefined) {
            errors.push(
                `${name}: tab must define exactly one of command or commands`
            );
        } else if (command !== undefined) {
            if (!validCommand)
                errors.push(`${name}: tab.command must be a non-empty string`);
        } else if (commands !== undefined) {
            if (!validCommands)
                errors.push(
                    `${name}: tab.commands must be a non-empty array of non-empty strings`
                );
        } else {
            errors.push(`${name}: tab must define command or commands`);
        }

        if (candidate.direction !== undefined)
            errors.push(`${name}: tab must not define direction`);
        return errors.length === 0 && (validCommand || validCommands)
            ? {
                  launchable: validCommand
                      ? {
                            type: 'tab',
                            command: validCommand,
                            ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                        }
                      : {
                            type: 'tab',
                            commands: validCommands!,
                            ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                        },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (isNonEmptyString(type))
        errors.push(`${name}: unsupported type ${JSON.stringify(type)}`);
    return { launchable: null, errors };
}

function loadLaunchablesFile(
    filePath: string,
    source: LaunchableSource
): ResolvedLaunchable[] {
    if (!fs.existsSync(filePath)) return [];

    let parsed: unknown;
    try {
        parsed = readJsonFile<unknown>(filePath);
    } catch (error) {
        appendLog(`failed to parse ${filePath}: ${String(error)}`);
        return [];
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        appendLog(`ignored ${filePath}: expected top-level object`);
        return [];
    }

    const configDir = path.dirname(filePath);
    const entries: ResolvedLaunchable[] = [];

    for (const [name, value] of Object.entries(
        parsed as Record<string, unknown>
    )) {
        const result = validateLaunchable(name, value);
        if (!result.launchable) {
            for (const error of result.errors)
                appendLog(`invalid launchable in ${filePath}: ${error}`);
            continue;
        }

        entries.push({
            name,
            source,
            configPath: filePath,
            configDir,
            launchable: result.launchable,
        });
    }

    return entries;
}

export function findNearestProjectConfig(startCwd: string): string {
    if (!startCwd) return '';

    let current = path.resolve(startCwd);
    while (true) {
        const candidate = path.join(current, PROJECT_CONFIG_NAME);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(current);
        if (parent === current) return '';
        current = parent;
    }
}

export function discoverLaunchables(cwd: string): ResolvedLaunchable[] {
    const merged = new Map<string, ResolvedLaunchable>();

    for (const item of loadLaunchablesFile(GLOBAL_CONFIG_PATH, 'global')) {
        merged.set(item.name, item);
    }

    const projectConfigPath = findNearestProjectConfig(cwd);
    if (projectConfigPath) {
        for (const item of loadLaunchablesFile(projectConfigPath, 'project')) {
            merged.set(item.name, item);
        }
    }

    return [...merged.values()].sort((left, right) =>
        left.name.localeCompare(right.name)
    );
}

export function resolveLaunchableCwd(
    item: ResolvedLaunchable,
    currentCwd: string
): string {
    const configured = item.launchable.cwd;
    if (!configured) {
        return item.source === 'project' ? item.configDir : currentCwd;
    }

    if (path.isAbsolute(configured)) return configured;
    return path.resolve(item.configDir, configured);
}

function displayLine(item: ResolvedLaunchable, index: number): string {
    return `${index}\t${item.name} [${item.source}] [${item.launchable.type}]`;
}

function selectLaunchable(
    items: ResolvedLaunchable[]
): ResolvedLaunchable | null {
    if (items.length === 0) return null;
    if (items.length === 1) return items[0] || null;

    const input = `${items.map((item, index) => displayLine(item, index)).join('\n')}\n`;
    const fzf = spawnSync(
        'fzf',
        [
            '--delimiter',
            '\t',
            '--with-nth',
            '2..',
            '--no-sort',
            '--ansi',
            '--border-label',
            ' launchables ',
            '--prompt',
            '🚀  ',
        ],
        {
            input,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'inherit'],
        }
    );

    if (!fzf.error && fzf.status === 0) {
        const selected = (fzf.stdout || '').trim();
        const indexText = selected.split('\t', 1)[0] || '';
        const index = Number.parseInt(indexText, 10);
        return Number.isInteger(index) ? items[index] || null : null;
    }

    if (!fzf.error) return null;

    process.stderr.write('launchables:\n');
    items.forEach((item, index) =>
        process.stderr.write(
            `  ${index + 1}) ${item.name} [${item.source}] [${item.launchable.type}]\n`
        )
    );
    process.stderr.write('Choose launchable: ');
    const choice = fs.readFileSync(0, 'utf8').trim();
    const index = Number.parseInt(choice, 10) - 1;
    return Number.isInteger(index) && index >= 0 && index < items.length
        ? items[index] || null
        : null;
}

function selectionDir(): string {
    const dirPath = path.join(stateDir(), 'selections');
    ensureDir(dirPath);
    return dirPath;
}

function writeSelection(payload: SelectionPayload): string {
    const filePath = path.join(
        selectionDir(),
        `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2)}.json`
    );
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return filePath;
}

function backgroundLogFile(name: string): string {
    const safeName =
        name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') ||
        'launchable';
    const filePath = path.join(stateDir(), 'background', `${safeName}.log`);
    ensureDir(path.dirname(filePath));
    return filePath;
}

function detachApply(selectionPath: string, pickerPaneId: string): void {
    const out = fs.openSync(pluginLogFile(), 'a');
    const args = [
        path.join(PLUGIN_ROOT, 'launchables.ts'),
        'apply',
        selectionPath,
    ];
    if (pickerPaneId) args.push(pickerPaneId);

    const child = spawn(process.execPath, args, {
        detached: true,
        stdio: ['ignore', out, out],
        env: process.env,
    });
    child.unref();
}

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPaneGone(
    paneId: string,
    timeoutMs = OVERLAY_CLOSE_TIMEOUT_MS
): Promise<void> {
    if (!paneId) return;

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const result = spawnSync(HERDR_BIN, ['pane', 'get', paneId], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        if (result.error || result.status !== 0) return;
        await sleep(OVERLAY_CLOSE_POLL_MS);
    }
}

function executeBackground(name: string, command: string, cwd: string): void {
    const logPath = backgroundLogFile(name);
    const out = fs.openSync(logPath, 'a');
    const child = spawn(command, {
        cwd,
        shell: true,
        detached: true,
        stdio: ['ignore', out, out],
        env: process.env,
    });
    child.unref();
}

function tabCommands(launchable: TabLaunchable): string[] {
    return typeof launchable.command === 'string'
        ? [launchable.command]
        : launchable.commands;
}

function executeTab(payload: SelectionPayload, cwd: string): void {
    const { workspaceId, resolved } = payload;
    const commands =
        resolved.launchable.type === 'tab'
            ? tabCommands(resolved.launchable)
            : [];
    if (!workspaceId || commands.length === 0) return;

    const tab = herdrJson<{
        result?: {
            tab?: { tab_id?: string };
            root_pane?: { pane_id?: string };
        };
    }>([
        'tab',
        'create',
        '--workspace',
        workspaceId,
        '--cwd',
        cwd,
        '--label',
        resolved.name,
        '--focus',
    ]);
    const tabId = tab.result?.tab?.tab_id || '';
    let currentPaneId = tab.result?.root_pane?.pane_id || '';
    if (!tabId || !currentPaneId)
        throw new Error(`failed to create tab for ${resolved.name}`);

    commands.forEach((command, index) => {
        if (index === 0) {
            herdrPaneRun(currentPaneId, command);
            return;
        }

        const split = herdrJson<{ result?: { pane?: { pane_id?: string } } }>([
            'pane',
            'split',
            currentPaneId,
            '--direction',
            'right',
            '--cwd',
            cwd,
            '--no-focus',
        ]);
        currentPaneId = split.result?.pane?.pane_id || '';
        if (!currentPaneId)
            throw new Error(`failed to create split for ${resolved.name}`);
        herdrPaneRun(currentPaneId, command);
    });

    herdr(['workspace', 'focus', workspaceId]);
    herdr(['tab', 'focus', tabId]);
}

function executeSplit(payload: SelectionPayload, cwd: string): void {
    const { sourcePaneId, resolved } = payload;
    if (!sourcePaneId || resolved.launchable.type !== 'split') return;

    const direction = resolved.launchable.direction || 'right';
    const split = herdrJson<{ result?: { pane?: { pane_id?: string } } }>([
        'pane',
        'split',
        sourcePaneId,
        '--direction',
        direction,
        '--cwd',
        cwd,
        '--focus',
    ]);
    const paneId = split.result?.pane?.pane_id || '';
    if (!paneId) throw new Error(`failed to create split for ${resolved.name}`);
    herdrPaneRun(paneId, resolved.launchable.command);
}

function executeSelection(payload: SelectionPayload): void {
    const cwd = resolveLaunchableCwd(payload.resolved, payload.selectedAtCwd);
    switch (payload.resolved.launchable.type) {
        case 'background':
            executeBackground(
                payload.resolved.name,
                payload.resolved.launchable.command,
                cwd
            );
            return;
        case 'tab':
            executeTab(payload, cwd);
            return;
        case 'split':
            executeSplit(payload, cwd);
            return;
    }
}

async function cmdOpen(): Promise<void> {
    const pluginContext = getPluginContext();
    const args = [
        'plugin',
        'pane',
        'open',
        '--plugin',
        PLUGIN_ID,
        '--entrypoint',
        'picker',
        '--placement',
        'overlay',
        '--focus',
    ];

    if (pluginContext.workspaceId)
        args.push(
            '--env',
            `LAUNCHABLES_WORKSPACE_ID=${pluginContext.workspaceId}`
        );
    if (pluginContext.paneId)
        args.push(
            '--env',
            `LAUNCHABLES_SOURCE_PANE_ID=${pluginContext.paneId}`
        );
    if (pluginContext.cwd)
        args.push('--env', `LAUNCHABLES_CWD=${pluginContext.cwd}`);

    herdr(args, { stdio: 'inherit' });
}

async function cmdPicker(): Promise<void> {
    const pluginContext = getPluginContext();
    if (!pluginContext.cwd) return;

    const items = discoverLaunchables(pluginContext.cwd);
    const selected = selectLaunchable(items);
    if (!selected) return;

    const payload: SelectionPayload = {
        workspaceId: pluginContext.workspaceId,
        sourcePaneId: pluginContext.paneId,
        selectedAtCwd: pluginContext.cwd,
        resolved: selected,
    };

    const selectionPath = writeSelection(payload);
    const pickerPaneId = contextValue('HERDR_PANE_ID', 'pane_id');
    detachApply(selectionPath, pickerPaneId);
}

async function cmdApply(
    selectionPath: string,
    pickerPaneId: string
): Promise<void> {
    if (!selectionPath) {
        process.stderr.write(
            'usage: launchables.ts apply <selection-path> [picker-pane-id]\n'
        );
        process.exitCode = 2;
        return;
    }

    await waitForPaneGone(pickerPaneId);

    const payload = readJsonFile<SelectionPayload>(selectionPath);
    try {
        executeSelection(payload);
    } finally {
        fs.rmSync(selectionPath, { force: true });
    }
}

async function main(): Promise<void> {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'open') return cmdOpen();
    if (command === 'picker') return cmdPicker();
    if (command === 'apply') return cmdApply(args[0] || '', args[1] || '');

    process.stderr.write('usage: launchables.ts <open|picker|apply>\n');
    process.exitCode = 2;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    main().catch((error: unknown) => {
        process.stderr.write(
            `${error instanceof Error ? error.stack || error.message : String(error)}\n`
        );
        process.exit(1);
    });
}
