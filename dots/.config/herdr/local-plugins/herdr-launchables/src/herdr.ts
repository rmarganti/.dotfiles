import { spawnSync } from 'node:child_process';

import { HERDR_BIN } from './constants.ts';
import type { PaneCommandMode } from './types.ts';

export interface HerdrWorkspace {
    workspaceId: string;
    label: string;
    number?: number;
    focused?: boolean;
}

export function herdr(
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

export function herdrPaneRun(
    paneId: string,
    command: string,
    mode: PaneCommandMode = 'exit-on-success'
): string {
    return herdr(['pane', 'run', paneId, commandForMode(command, mode)]);
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

export function herdrJson<T>(args: string[]): T {
    const output = herdr(args);
    return JSON.parse(output) as T;
}

export function listWorkspaces(): HerdrWorkspace[] {
    const data = herdrJson<WorkspaceListResponse>(['workspace', 'list']);
    return (data.result?.workspaces || [])
        .map((workspace) => ({
            workspaceId: workspace.workspace_id || '',
            label: workspace.label || workspace.name || '',
            number: workspace.number,
            focused: workspace.focused,
        }))
        .filter((workspace) => workspace.workspaceId && workspace.label);
}

export function focusWorkspace(workspaceId: string): void {
    herdr(['workspace', 'focus', workspaceId]);
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

interface WorkspaceListResponse {
    result?: {
        workspaces?: Array<{
            workspace_id?: string;
            label?: string;
            name?: string;
            number?: number;
            focused?: boolean;
        }>;
    };
}
