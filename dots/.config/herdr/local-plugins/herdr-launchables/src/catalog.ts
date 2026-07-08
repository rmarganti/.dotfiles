import { discoverConfiguredLaunchables } from './config.ts';
import { listWorkspaces } from './herdr.ts';
import type {
    ResolvedConfiguredLaunchable,
    ResolvedLaunchable,
    ResolvedOpenWorkspace,
} from './types.ts';

/**
 * Builds the picker catalog from explicit JSON launchables plus implicit,
 * currently-open workspaces that are not already represented by configuration.
 */
export function discoverPickerLaunchables(cwd: string): ResolvedLaunchable[] {
    const configured = discoverConfiguredLaunchables(cwd);
    const open = discoverUnconfiguredOpenWorkspaces(configured);
    return sortPickerLaunchables([...configured, ...open]);
}

function discoverUnconfiguredOpenWorkspaces(
    configured: ResolvedConfiguredLaunchable[]
): ResolvedOpenWorkspace[] {
    const configuredLabels = configuredWorkspaceLabels(configured);

    return listWorkspaces()
        .filter((workspace) => !configuredLabels.has(workspace.label))
        .map((workspace) => ({
            name: workspace.label,
            source: 'open',
            launchable: {
                type: 'open-workspace',
                workspaceId: workspace.workspaceId,
                label: workspace.label,
                ...(workspace.number !== undefined
                    ? { number: workspace.number }
                    : {}),
                ...(workspace.focused !== undefined
                    ? { focused: workspace.focused }
                    : {}),
            },
        }));
}

function configuredWorkspaceLabels(
    items: ResolvedConfiguredLaunchable[]
): Set<string> {
    const labels = new Set<string>();

    for (const item of items) {
        if (item.launchable.type !== 'workspace') continue;
        labels.add(item.launchable.name || item.name);
    }

    return labels;
}

function sortPickerLaunchables(
    items: ResolvedLaunchable[]
): ResolvedLaunchable[] {
    const sourceRank: Record<ResolvedLaunchable['source'], number> = {
        project: 0,
        global: 1,
        open: 2,
    };

    return [...items].sort((left, right) => {
        const bySource = sourceRank[left.source] - sourceRank[right.source];
        if (bySource !== 0) return bySource;
        return left.name.localeCompare(right.name);
    });
}
