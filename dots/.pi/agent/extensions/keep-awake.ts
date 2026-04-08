import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

declare global {
    // Persist across /reload within the same Pi process.
    // eslint-disable-next-line no-var
    var __piKeepAwakeProcess: ChildProcess | undefined;
    // eslint-disable-next-line no-var
    var __piKeepAwakeSupported: boolean | undefined;
    // eslint-disable-next-line no-var
    var __piKeepAwakeWarningShown: boolean | undefined;
}

/**
 * Keeps the host machine awake on macOS during agent execution using the built-in `caffeinate` utility.
 * Registers a `/keep-awake-status` command to show the current keep-awake status.
 */
export default function (pi: ExtensionAPI) {
    pi.on('session_start', async (_event, ctx) => {
        warnIfUnsupported(ctx);
        if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, '');
    });

    pi.on('agent_start', async (_event, ctx) => {
        warnIfUnsupported(ctx);
        if (!isDarwin()) return;

        try {
            const started = startKeepAwake();
            if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, started ? 'Awake' : '');
        } catch (error: any) {
            stopKeepAwake();
            if (ctx.hasUI) {
                ctx.ui.setStatus(STATUS_KEY, '');
                ctx.ui.notify(
                    `Failed to enable macOS keep-awake: ${error.message}`,
                    'error'
                );
            }
        }
    });

    pi.on('agent_end', async (_event, ctx) => {
        stopKeepAwake();
        if (ctx.hasUI) ctx.ui.setStatus(STATUS_KEY, '');
    });

    pi.on('session_shutdown', async () => {
        stopKeepAwake();
    });

    pi.registerCommand('keep-awake-status', {
        description: 'Show macOS keep-awake extension status',
        handler: async (_args, ctx) => {
            ctx.ui.notify(`Keep-awake: ${getStatusText()}`, 'info');
        },
    });
}

const STATUS_KEY = 'keep-awake';
const DEFAULT_CAFFEINATE_PATH = '/usr/bin/caffeinate';

function isDarwin() {
    return process.platform === 'darwin';
}

function getCaffeinatePath() {
    return existsSync(DEFAULT_CAFFEINATE_PATH)
        ? DEFAULT_CAFFEINATE_PATH
        : 'caffeinate';
}

function isProcessAlive(child: ChildProcess | undefined) {
    return Boolean(
        child &&
        !child.killed &&
        child.exitCode === null &&
        child.signalCode === null
    );
}

function isSupported() {
    if (!isDarwin()) return false;
    if (globalThis.__piKeepAwakeSupported !== undefined)
        return globalThis.__piKeepAwakeSupported;

    globalThis.__piKeepAwakeSupported = existsSync(DEFAULT_CAFFEINATE_PATH);
    return globalThis.__piKeepAwakeSupported;
}

function startKeepAwake() {
    if (!isSupported()) return false;
    if (isProcessAlive(globalThis.__piKeepAwakeProcess)) return true;

    const child = spawn(
        getCaffeinatePath(),
        ['-d', '-i', '-m', '-w', String(process.pid)],
        {
            detached: true,
            stdio: 'ignore',
        }
    );

    child.once('exit', () => {
        if (globalThis.__piKeepAwakeProcess === child) {
            globalThis.__piKeepAwakeProcess = undefined;
        }
    });

    child.once('error', () => {
        if (globalThis.__piKeepAwakeProcess === child) {
            globalThis.__piKeepAwakeProcess = undefined;
        }
    });

    child.unref();
    globalThis.__piKeepAwakeProcess = child;
    return true;
}

function stopKeepAwake() {
    const child = globalThis.__piKeepAwakeProcess;
    if (!child) return;

    try {
        child.kill('SIGTERM');
    } catch {
        // Ignore cleanup errors.
    }

    globalThis.__piKeepAwakeProcess = undefined;
}

function getStatusText() {
    if (!isDarwin()) return 'inactive (non-macOS)';
    if (!isSupported()) return 'unavailable (caffeinate missing)';
    return isProcessAlive(globalThis.__piKeepAwakeProcess)
        ? `active (pid ${globalThis.__piKeepAwakeProcess?.pid ?? '?'})`
        : 'idle';
}

function warnIfUnsupported(ctx: {
    hasUI: boolean;
    ui: {
        notify(
            message: string,
            level: 'info' | 'error' | 'success' | 'warning'
        ): void;
    };
}) {
    if (!isDarwin() || isSupported() || globalThis.__piKeepAwakeWarningShown)
        return;
    globalThis.__piKeepAwakeWarningShown = true;
    if (ctx.hasUI) {
        ctx.ui.notify(
            'macOS keep-awake disabled: /usr/bin/caffeinate was not found',
            'warning'
        );
    }
}
