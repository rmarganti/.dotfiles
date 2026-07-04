import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { IDLE_SHELL_NAMES } from './constants.ts';
import { resolveConfiguredCwd, resolveLaunchableCwd } from './cwd.ts';
import { herdr, herdrJson, herdrPaneRunThenExit } from './herdr.ts';
import { backgroundLogFile } from './log.ts';
import type {
    ResolvedTabCommand,
    SelectionPayload,
    ResolvedLaunchable,
} from './types.ts';

// -[ Dispatcher ]-----------------------------------------------

export function executeSelection(payload: SelectionPayload): void {
    switch (payload.resolved.launchable.type) {
        case 'background':
            executeBackground(
                payload.resolved.name,
                payload.resolved.launchable.command,
                resolveLaunchableCwd(payload.resolved, payload.selectedAtCwd)
            );
            return;
        case 'tab':
            executeTab(payload);
            return;
        case 'split':
            executeSplit(
                payload,
                resolveLaunchableCwd(payload.resolved, payload.selectedAtCwd)
            );
            return;
        case 'idle-panes':
            executeIdlePanes(payload.resolved.launchable.command);
            return;
    }
}

// -[ Background ]-----------------------------------------------

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

// -[ Tabs ]-----------------------------------------------------

function tabCommands(
    item: ResolvedLaunchable,
    currentCwd: string
): ResolvedTabCommand[] {
    if (item.launchable.type !== 'tab') return [];

    const launchableCwd = item.launchable.cwd;
    if (typeof item.launchable.command === 'string') {
        return [
            {
                command: item.launchable.command,
                cwd: resolveConfiguredCwd(item, currentCwd, launchableCwd),
            },
        ];
    }

    return item.launchable.commands.map((entry) => {
        const normalized =
            typeof entry === 'string' ? { command: entry } : entry;
        return {
            command: normalized.command,
            cwd: resolveConfiguredCwd(
                item,
                currentCwd,
                normalized.cwd || launchableCwd
            ),
        };
    });
}

function executeTab(payload: SelectionPayload): void {
    const { workspaceId, resolved } = payload;
    const commands = tabCommands(resolved, payload.selectedAtCwd);
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
        commands[0]!.cwd,
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
            herdrPaneRunThenExit(currentPaneId, command.command);
            return;
        }

        const split = herdrJson<{ result?: { pane?: { pane_id?: string } } }>([
            'pane',
            'split',
            currentPaneId,
            '--direction',
            'right',
            '--cwd',
            command.cwd,
            '--no-focus',
        ]);
        currentPaneId = split.result?.pane?.pane_id || '';
        if (!currentPaneId)
            throw new Error(`failed to create split for ${resolved.name}`);
        herdrPaneRunThenExit(currentPaneId, command.command);
    });

    herdr(['workspace', 'focus', workspaceId]);
    herdr(['tab', 'focus', tabId]);
}

// -[ Splits ]---------------------------------------------------

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
    herdrPaneRunThenExit(paneId, resolved.launchable.command);
}

// -[ Idle Panes ]-----------------------------------------------

interface PaneListResponse {
    result?: {
        panes?: Array<{ pane_id?: string }>;
    };
}

interface PaneProcessInfo {
    foreground_processes?: Array<{
        name?: string;
        argv0?: string;
    }>;
}

interface PaneProcessInfoResponse {
    result?: {
        process_info?: PaneProcessInfo;
    };
}

function normalizeProcessName(value: string): string {
    return path.basename(value).replace(/^-+/, '');
}

function isIdleShellProcessInfo(processInfo?: PaneProcessInfo): boolean {
    const foreground = processInfo?.foreground_processes?.[0];
    const candidates = [foreground?.name, foreground?.argv0].filter(
        isNonEmptyString
    );
    return candidates.some((candidate) =>
        IDLE_SHELL_NAMES.has(normalizeProcessName(candidate))
    );
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function idlePaneIds(): string[] {
    const panes =
        herdrJson<PaneListResponse>(['pane', 'list']).result?.panes || [];
    const ids: string[] = [];

    for (const pane of panes) {
        if (!pane.pane_id) continue;
        const processInfo = herdrJson<PaneProcessInfoResponse>([
            'pane',
            'process-info',
            '--pane',
            pane.pane_id,
        ]).result?.process_info;
        if (isIdleShellProcessInfo(processInfo)) ids.push(pane.pane_id);
    }

    return ids;
}

function executeIdlePanes(command: string): void {
    for (const paneId of idlePaneIds()) {
        herdr(['pane', 'run', paneId, command]);
    }
}
