import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT_CONFIG_NAME } from './constants.ts';

interface WorktreeEvent {
    data?: {
        worktree?: { path?: unknown };
        workspace?: { worktree?: { checkout_path?: unknown } };
    };
    worktree?: { path?: unknown; checkout_path?: unknown };
}

interface PluginContext {
    workspace_cwd?: unknown;
    worktree?: { checkout_path?: unknown };
}

export type CopyWorktreeConfigResult =
    | { status: 'copied'; source: string; destination: string }
    | { status: 'source-missing'; source: string }
    | { status: 'same-worktree'; path: string };

/** Resolve the new checkout from the event, with context fallbacks for older Herdr versions. */
export function worktreePathFromEnvironment(
    env: NodeJS.ProcessEnv
): string | undefined {
    const event = JSON.parse(
        env.HERDR_PLUGIN_EVENT_JSON || '{}'
    ) as WorktreeEvent;
    const context = JSON.parse(
        env.HERDR_PLUGIN_CONTEXT_JSON || '{}'
    ) as PluginContext;

    return [
        event.data?.worktree?.path,
        event.worktree?.path,
        event.data?.workspace?.worktree?.checkout_path,
        event.worktree?.checkout_path,
        context.worktree?.checkout_path,
        context.workspace_cwd,
    ].find(
        (value): value is string =>
            typeof value === 'string' && value.length > 0
    );
}

/** Git lists the primary worktree first in porcelain output. */
export function primaryWorktreeFromPorcelain(
    output: string
): string | undefined {
    const firstField = output.split('\0', 1)[0] || output.split('\n', 1)[0];
    return firstField.startsWith('worktree ')
        ? firstField.slice('worktree '.length)
        : undefined;
}

export function findPrimaryWorktree(worktreePath: string): string {
    const result = spawnSync(
        'git',
        ['-C', worktreePath, 'worktree', 'list', '--porcelain', '-z'],
        { encoding: 'utf8' }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(
            `git worktree list failed (${result.status}): ${result.stderr.trim()}`
        );
    }

    const primary = primaryWorktreeFromPorcelain(result.stdout);
    if (!primary) throw new Error('git did not report a primary worktree');
    return primary;
}

/** Copy the primary checkout's project config into a newly created worktree. */
export function copyPrimaryWorktreeConfig(
    worktreePath: string,
    resolvePrimary: (worktreePath: string) => string = findPrimaryWorktree
): CopyWorktreeConfigResult {
    const primaryWorktree = resolvePrimary(worktreePath);
    const source = path.join(primaryWorktree, PROJECT_CONFIG_NAME);
    const destination = path.join(worktreePath, PROJECT_CONFIG_NAME);

    if (path.resolve(primaryWorktree) === path.resolve(worktreePath)) {
        return { status: 'same-worktree', path: worktreePath };
    }
    if (!fs.existsSync(source)) return { status: 'source-missing', source };

    fs.copyFileSync(source, destination);
    return { status: 'copied', source, destination };
}
