/**
 * Bridges the picker overlay to the real launcher.
 *
 * The picker runs inside an overlay pane that is about to disappear. Instead of
 * launching from that pane, it writes the selected launchable to plugin state and
 * starts a detached `apply` process. The detached process waits for the overlay
 * pane to close, reads the payload, and launches from the original pane context.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
    HERDR_BIN,
    OVERLAY_CLOSE_POLL_MS,
    OVERLAY_CLOSE_TIMEOUT_MS,
} from './constants.ts';
import { ensureDir, pluginLogFile, stateDir } from './log.ts';
import type { SelectionPayload } from './types.ts';

function selectionDir(): string {
    const dirPath = path.join(stateDir(), 'selections');
    ensureDir(dirPath);
    return dirPath;
}

/** Persists the chosen launchable so a detached process can apply it later. */
export function writeSelection(payload: SelectionPayload): string {
    const filePath = path.join(
        selectionDir(),
        `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2)}.json`
    );
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    return filePath;
}

/** Reads the handoff payload written by the picker process. */
export function readSelection(selectionPath: string): SelectionPayload {
    return JSON.parse(fs.readFileSync(selectionPath, 'utf8')) as SelectionPayload;
}

/** Removes the handoff file after launch, successful or not. */
export function removeSelection(selectionPath: string): void {
    fs.rmSync(selectionPath, { force: true });
}

/**
 * Starts `launchables.ts apply` outside the overlay pane lifecycle.
 *
 * Output goes to the plugin log because the original terminal will close before
 * the apply process does useful work.
 */
export function detachApply(
    selfPath: string,
    selectionPath: string,
    pickerPaneId: string
): void {
    const out = fs.openSync(pluginLogFile(), 'a');
    const args = [selfPath, 'apply', selectionPath];
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

/** Waits until Herdr reports the picker pane is gone, or until timeout. */
export async function waitForPaneGone(
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
