import fs from 'node:fs';
import path from 'node:path';

import { GLOBAL_CONFIG_PATH, PROJECT_CONFIG_NAME } from './constants.ts';
import { appendLog } from './log.ts';
import type {
    Launchable,
    LaunchableSource,
    PaneLaunchable,
    ResolvedLaunchable,
    SplitDirection,
    TabLaunchable,
    WorkspaceLaunchable,
} from './types.ts';

/**
 * Finds the nearest project configuration file by traversing up the directory
 * tree from the given starting directory.
 */
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

/**
 * Discovers launchable configurations from both global
 * and project-specific configuration files.
 */
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

function readJsonFile<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

interface ValidationResult<T = Launchable> {
    launchable: T | null;
    errors: string[];
}

function validateOptionalName(
    pathName: string,
    candidate: Record<string, unknown>,
    errors: string[]
): string | undefined {
    if (candidate.name === undefined) return undefined;
    if (!isNonEmptyString(candidate.name)) {
        errors.push(`${pathName}: name must be a non-empty string when provided`);
        return undefined;
    }
    return candidate.name;
}

function validateOptionalCwd(
    pathName: string,
    candidate: Record<string, unknown>,
    errors: string[]
): string | undefined {
    if (candidate.cwd === undefined) return undefined;
    if (!isNonEmptyString(candidate.cwd)) {
        errors.push(`${pathName}: cwd must be a non-empty string when provided`);
        return undefined;
    }
    return candidate.cwd;
}

function validateDirection(
    pathName: string,
    value: unknown,
    errors: string[]
): SplitDirection | undefined {
    if (value === undefined) return undefined;
    if (value === 'right' || value === 'down') return value;
    errors.push(`${pathName}: pane.direction must be right or down`);
    return undefined;
}

function validatePaneLaunchable(
    pathName: string,
    value: unknown,
    options: { rootInTab?: boolean } = {}
): ValidationResult<PaneLaunchable> {
    const errors: string[] = [];
    if (!isObject(value)) return { launchable: null, errors: [`${pathName}: expected pane object`] };

    const candidate = value;
    if (candidate.type !== 'pane') errors.push(`${pathName}: type must be "pane"`);
    const name = validateOptionalName(pathName, candidate, errors);
    const cwd = validateOptionalCwd(pathName, candidate, errors);
    const direction = validateDirection(pathName, candidate.direction, errors);

    if (candidate.command !== undefined && !isNonEmptyString(candidate.command)) {
        errors.push(`${pathName}: pane.command must be a non-empty string when provided`);
    }
    if (options.rootInTab && candidate.direction !== undefined) {
        errors.push(`${pathName}: first/root pane in a tab must not define direction`);
    }
    if (candidate.commands !== undefined) errors.push(`${pathName}: pane must not define commands`);
    if (candidate.tabs !== undefined) errors.push(`${pathName}: pane must not define tabs`);

    return errors.length === 0
        ? {
              launchable: {
                  type: 'pane',
                  ...(name ? { name } : {}),
                  ...(isNonEmptyString(candidate.command) ? { command: candidate.command } : {}),
                  ...(cwd ? { cwd } : {}),
                  ...(direction ? { direction } : {}),
              },
              errors,
          }
        : { launchable: null, errors };
}

function validateTabLaunchable(pathName: string, value: unknown): ValidationResult<TabLaunchable> {
    const errors: string[] = [];
    if (!isObject(value)) return { launchable: null, errors: [`${pathName}: expected tab object`] };

    const candidate = value;
    if (candidate.type !== 'tab') errors.push(`${pathName}: type must be "tab"`);
    const name = validateOptionalName(pathName, candidate, errors);
    const cwd = validateOptionalCwd(pathName, candidate, errors);

    if (candidate.command !== undefined) errors.push(`${pathName}: tab.command is no longer supported; use tab.panes`);
    if (candidate.commands !== undefined) errors.push(`${pathName}: tab.commands is no longer supported; use tab.panes`);
    if (candidate.direction !== undefined) errors.push(`${pathName}: tab must not define direction`);

    let panes: PaneLaunchable[] | undefined;
    if (candidate.panes !== undefined) {
        if (!Array.isArray(candidate.panes) || candidate.panes.length === 0) {
            errors.push(`${pathName}: tab.panes must be a non-empty array when provided`);
        } else {
            panes = [];
            candidate.panes.forEach((pane, index) => {
                const result = validatePaneLaunchable(`${pathName}.panes[${index}]`, pane, {
                    rootInTab: index === 0,
                });
                if (result.launchable) panes!.push(result.launchable);
                errors.push(...result.errors);
            });
        }
    }

    return errors.length === 0
        ? {
              launchable: {
                  type: 'tab',
                  ...(name ? { name } : {}),
                  ...(cwd ? { cwd } : {}),
                  ...(panes ? { panes } : {}),
              },
              errors,
          }
        : { launchable: null, errors };
}

function validateWorkspaceLaunchable(pathName: string, value: unknown): ValidationResult<WorkspaceLaunchable> {
    const errors: string[] = [];
    if (!isObject(value)) return { launchable: null, errors: [`${pathName}: expected workspace object`] };

    const candidate = value;
    if (candidate.type !== 'workspace') errors.push(`${pathName}: type must be "workspace"`);
    const name = validateOptionalName(pathName, candidate, errors);
    const cwd = validateOptionalCwd(pathName, candidate, errors);

    if (candidate.command !== undefined) errors.push(`${pathName}: workspace must not define command`);
    if (candidate.commands !== undefined) errors.push(`${pathName}: workspace must not define commands`);
    if (candidate.direction !== undefined) errors.push(`${pathName}: workspace must not define direction`);

    const tabs: TabLaunchable[] = [];
    if (!Array.isArray(candidate.tabs) || candidate.tabs.length === 0) {
        errors.push(`${pathName}: workspace.tabs must be a non-empty array`);
    } else {
        candidate.tabs.forEach((tab, index) => {
            const result = validateTabLaunchable(`${pathName}.tabs[${index}]`, tab);
            if (result.launchable) tabs.push(result.launchable);
            errors.push(...result.errors);
        });
    }

    return errors.length === 0
        ? {
              launchable: {
                  type: 'workspace',
                  ...(name ? { name } : {}),
                  ...(cwd ? { cwd } : {}),
                  tabs,
              },
              errors,
          }
        : { launchable: null, errors };
}

function validateLaunchable(name: string, value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isObject(value)) {
        return { launchable: null, errors: [`${name}: expected object`] };
    }

    const candidate = value;
    const type = candidate.type;

    if (!isNonEmptyString(type)) errors.push(`${name}: missing string type`);

    if (type === 'background') {
        const cwd = validateOptionalCwd(name, candidate, errors);
        const command = candidate.command;
        if (!isNonEmptyString(command)) errors.push(`${name}: background.command must be a non-empty string`);
        if (candidate.name !== undefined) errors.push(`${name}: background must not define name`);
        if (candidate.commands !== undefined) errors.push(`${name}: background must not define commands`);
        if (candidate.direction !== undefined) errors.push(`${name}: background must not define direction`);
        if (candidate.panes !== undefined) errors.push(`${name}: background must not define panes`);
        if (candidate.tabs !== undefined) errors.push(`${name}: background must not define tabs`);
        return errors.length === 0 && isNonEmptyString(command)
            ? { launchable: { type: 'background', command, ...(cwd ? { cwd } : {}) }, errors }
            : { launchable: null, errors };
    }

    if (type === 'idle-panes') {
        const command = candidate.command;
        if (!isNonEmptyString(command)) errors.push(`${name}: idle-panes.command must be a non-empty string`);
        if (candidate.name !== undefined) errors.push(`${name}: idle-panes must not define name`);
        if (candidate.cwd !== undefined) errors.push(`${name}: idle-panes must not define cwd`);
        if (candidate.commands !== undefined) errors.push(`${name}: idle-panes must not define commands`);
        if (candidate.direction !== undefined) errors.push(`${name}: idle-panes must not define direction`);
        if (candidate.panes !== undefined) errors.push(`${name}: idle-panes must not define panes`);
        if (candidate.tabs !== undefined) errors.push(`${name}: idle-panes must not define tabs`);
        return errors.length === 0 && isNonEmptyString(command)
            ? { launchable: { type: 'idle-panes', command }, errors }
            : { launchable: null, errors };
    }

    if (type === 'split') {
        return {
            launchable: null,
            errors: [`${name}: type "split" is unsupported; use type "pane"`],
        };
    }

    if (type === 'pane') return validatePaneLaunchable(name, value);
    if (type === 'tab') return validateTabLaunchable(name, value);
    if (type === 'workspace') return validateWorkspaceLaunchable(name, value);

    if (isNonEmptyString(type)) errors.push(`${name}: unsupported type ${JSON.stringify(type)}`);
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

    if (!isObject(parsed)) {
        appendLog(`ignored ${filePath}: expected top-level object`);
        return [];
    }

    const configDir = path.dirname(filePath);
    const entries: ResolvedLaunchable[] = [];

    for (const [name, value] of Object.entries(parsed)) {
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
