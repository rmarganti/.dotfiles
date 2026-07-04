import { spawnSync } from 'node:child_process';

import { HERDR_BIN } from './constants.ts';

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

export function herdrPaneRunThenExit(paneId: string, command: string): string {
    return herdr(['pane', 'run', paneId, `${command} && exit`]);
}

export function herdrJson<T>(args: string[]): T {
    const output = herdr(args);
    return JSON.parse(output) as T;
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
