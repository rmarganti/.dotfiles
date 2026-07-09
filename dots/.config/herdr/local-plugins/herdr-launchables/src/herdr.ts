import { spawnSync } from 'node:child_process';
import { HERDR_BIN } from './constants.ts';
import type { PaneCommandMode, SplitDirection } from './types.ts';

export function openPluginPane(options: {
    pluginId: string;
    entrypoint: string;
    placement?: 'overlay';
    focus?: boolean;
    env?: Record<string, string | undefined>;
    inheritStdio?: boolean;
}): void {
    const args = [
        'plugin',
        'pane',
        'open',
        '--plugin',
        options.pluginId,
        '--entrypoint',
        options.entrypoint,
        '--placement',
        options.placement || 'overlay',
    ];

    args.push(options.focus === false ? '--no-focus' : '--focus');

    for (const [key, value] of Object.entries(options.env || {})) {
        if (value) args.push('--env', `${key}=${value}`);
    }

    herdr(args, options.inheritStdio ? { stdio: 'inherit' } : {});
}

export function focusWorkspace(workspaceId: string): void {
    herdr(['workspace', 'focus', workspaceId]);
}

export function focusTab(tabId: string): void {
    herdr(['tab', 'focus', tabId]);
}

interface PaneSplitResponse {
    result?: {
        pane?: { pane_id?: string };
    };
}

export function splitPane(options: {
    paneId: string;
    direction: SplitDirection;
    cwd: string;
    focus?: boolean;
}): { paneId: string } {
    const split = herdrJson<PaneSplitResponse>([
        'pane',
        'split',
        options.paneId,
        '--direction',
        options.direction,
        '--cwd',
        options.cwd,
        options.focus === false ? '--no-focus' : '--focus',
    ]);
    const paneId = split.result?.pane?.pane_id || '';
    if (!paneId) throw new Error('failed to create pane split');
    return { paneId };
}

interface TabCreateResponse {
    result?: {
        tab?: { tab_id?: string };
        root_pane?: { pane_id?: string };
    };
}

export function createTab(options: {
    workspaceId: string;
    cwd: string;
    label?: string;
    focus?: boolean;
}): { tabId: string; rootPaneId: string } {
    const args = [
        'tab',
        'create',
        '--workspace',
        options.workspaceId,
        '--cwd',
        options.cwd,
    ];
    if (options.label) args.push('--label', options.label);
    args.push(options.focus === false ? '--no-focus' : '--focus');

    const tab = herdrJson<TabCreateResponse>(args);
    const tabId = tab.result?.tab?.tab_id || '';
    const rootPaneId = tab.result?.root_pane?.pane_id || '';
    if (!tabId || !rootPaneId) throw new Error('failed to create tab');
    return { tabId, rootPaneId };
}

export function renameTab(tabId: string, label: string): void {
    herdr(['tab', 'rename', tabId, label]);
}

export function renamePane(paneId: string, label: string): void {
    herdr(['pane', 'rename', paneId, label]);
}

export function runPaneCommand(
    paneId: string,
    command: string,
    mode: PaneCommandMode = 'exit-on-success'
): void {
    herdr(['pane', 'run', paneId, commandForMode(command, mode)]);
}

function commandForMode(command: string, mode: PaneCommandMode): string {
    switch (mode) {
        case 'exit-on-success':
            return `${command} && exit`;
        case 'keep-shell':
            return command;
        case 'exit-always':
            return `${command}; exit`;
        case 'loop':
            return `while true; do ${command}; status=$?; printf '\\n[herdr-launchables] command exited with status %s; restarting in 1s...\\n' "$status"; sleep 1; done`;
    }
}

interface WorkspaceListResponse {
    result?: {
        workspaces?: Array<{
            workspace_id?: string;
            label?: string;
            focused?: boolean;
            pane_count?: number;
            tab_count?: number;
            active_tab_id?: string;
        }>;
    };
}

export interface HerdrWorkspace {
    workspaceId: string;
    label: string;
    focused: boolean;
    paneCount: number;
    tabCount: number;
    activeTabId: string;
}

export function listWorkspaces(): HerdrWorkspace[] {
    const workspaces =
        herdrJson<WorkspaceListResponse>(['workspace', 'list']).result
            ?.workspaces || [];
    return workspaces
        .filter((workspace) => workspace.workspace_id)
        .map((workspace) => ({
            workspaceId: workspace.workspace_id!,
            label: workspace.label || workspace.workspace_id!,
            focused: workspace.focused || false,
            paneCount: workspace.pane_count || 0,
            tabCount: workspace.tab_count || 0,
            activeTabId: workspace.active_tab_id || '',
        }));
}

interface WorkspaceCreateResponse {
    result?: {
        workspace?: { workspace_id?: string; label?: string; name?: string };
        tab?: { tab_id?: string };
        root_pane?: { pane_id?: string };
    };
}

export function createWorkspace(options: {
    cwd: string;
    label: string;
    focus?: boolean;
}): { workspaceId: string; tabId: string; rootPaneId: string } {
    const created = herdrJson<WorkspaceCreateResponse>([
        'workspace',
        'create',
        '--cwd',
        options.cwd,
        '--label',
        options.label,
        options.focus === false ? '--no-focus' : '--focus',
    ]);
    const workspaceId = created.result?.workspace?.workspace_id || '';
    const tabId = created.result?.tab?.tab_id || '';
    const rootPaneId = created.result?.root_pane?.pane_id || '';
    if (!workspaceId || !tabId || !rootPaneId) {
        throw new Error(`failed to create workspace ${options.label}`);
    }
    return { workspaceId, tabId, rootPaneId };
}

interface PaneListResponse {
    result?: {
        panes?: Array<{ pane_id?: string }>;
    };
}

export function listPanes(): Array<{ paneId: string }> {
    const panes =
        herdrJson<PaneListResponse>(['pane', 'list']).result?.panes || [];
    return panes
        .filter((pane) => pane.pane_id)
        .map((pane) => ({ paneId: pane.pane_id! }));
}

export interface PaneProcessInfo {
    foregroundProcesses?: Array<{
        name?: string;
        argv0?: string;
    }>;
}

export function paneProcessInfo(paneId: string): PaneProcessInfo | undefined {
    const processInfo = herdrJson<PaneProcessInfoResponse>([
        'pane',
        'process-info',
        '--pane',
        paneId,
    ]).result?.process_info;

    if (!processInfo) return undefined;
    return {
        foregroundProcesses: processInfo.foreground_processes,
    };
}

interface PaneProcessInfoResponse {
    result?: {
        process_info?: {
            foreground_processes?: Array<{
                name?: string;
                argv0?: string;
            }>;
        };
    };
}

export function focusedPaneInfo(paneId?: string): {
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

/**
 * Runs a herdr command and returns the stdout output as a string.
 */
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

/**
 * Runs a herdr command and returns the stdout output as a parsed JSON object.
 */
function herdrJson<T>(args: string[]): T {
    const output = herdr(args);
    return JSON.parse(output) as T;
}
