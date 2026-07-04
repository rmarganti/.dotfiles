import type { PluginContext } from './types.ts';
import { focusedPaneInfo } from './herdr.ts';

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

export function contextValue(...keys: string[]): string {
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

export function getPluginContext(): PluginContext {
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
