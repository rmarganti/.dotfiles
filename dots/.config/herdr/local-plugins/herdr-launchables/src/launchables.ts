#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'node:url';
import { discoverLaunchables } from './config.ts';
import { PLUGIN_ID } from './constants.ts';
import { contextValue, getPluginContext } from './context.ts';
import { executeSelection } from './executors.ts';
import { openPluginPane } from './herdr.ts';
import { selectLaunchable } from './picker.ts';
import {
    detachApply,
    readSelection,
    removeSelection,
    waitForPaneGone,
    writeSelection,
} from './selection.ts';
import type { SelectionPayload } from './types.ts';

const SELF_PATH = fileURLToPath(import.meta.url);

/**
 * Opens the launchables picker in an overlay pane.
 */
async function cmdOpen(): Promise<void> {
    const pluginContext = getPluginContext();
    openPluginPane({
        pluginId: PLUGIN_ID,
        entrypoint: 'picker',
        placement: 'overlay',
        focus: true,
        inheritStdio: true,
        env: {
            LAUNCHABLES_WORKSPACE_ID: pluginContext.workspaceId,
            LAUNCHABLES_SOURCE_PANE_ID: pluginContext.paneId,
            LAUNCHABLES_CWD: pluginContext.cwd,
        },
    });
}

/**
 * Launchables picker entrypoint. This is invoked by the overlay pane opened by `cmdOpen()`.
 */
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
    detachApply(SELF_PATH, selectionPath, pickerPaneId);
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

    const payload = readSelection(selectionPath);
    try {
        executeSelection(payload);
    } finally {
        removeSelection(selectionPath);
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
