import { discoverConfigLaunchables } from './config.ts';
import { resolveConfiguredCwd, resolveInheritedConfiguredCwd } from './cwd.ts';
import { listWorkspaces } from './herdr.ts';
import type {
    LaunchAction,
    Launchable,
    PaneConfigLaunchable,
    PanePlan,
    PluginContext,
    ResolvedConfigLaunchable,
    TabConfigLaunchable,
    TabPlan,
} from './types.ts';

export function discoverLaunchables(context: PluginContext): Launchable[] {
    const workspaces = listWorkspaces();

    // All configured launchables, excluding any that are focused workspace
    // launchables. We don't want to show focused workspace launchables in the
    // picker, since they are already running and focused.
    const focusedWorkspaceLabels = new Set(
        workspaces
            .filter((workspace) => workspace.focused)
            .map((workspace) => workspace.label)
    );
    const configured = discoverConfiguredLaunchables(context).filter(
        (launchable) =>
            !isFocusedWorkspaceLaunchable(launchable, focusedWorkspaceLabels)
    );

    // Used to exclude configured workspace launchables from the running
    // workspace launchables, so that we don't show duplicates in the picker.
    const configuredWorkspaceLabels = new Set(
        configured
            .map((launchable) => launchable.action)
            .filter(
                (
                    action
                ): action is Extract<
                    LaunchAction,
                    { type: 'ensure-workspace-layout' }
                > => action.type === 'ensure-workspace-layout'
            )
            .map((action) => action.label)
    );

    return [
        ...configured,
        ...discoverRunningWorkspaceLaunchables({
            workspaces,
            excludeLabels: configuredWorkspaceLabels,
        }),
    ];
}

function isFocusedWorkspaceLaunchable(
    launchable: Launchable,
    focusedWorkspaceLabels: Set<string>
): boolean {
    return (
        launchable.action.type === 'ensure-workspace-layout' &&
        focusedWorkspaceLabels.has(launchable.action.label)
    );
}

function discoverConfiguredLaunchables(context: PluginContext): Launchable[] {
    return discoverConfigLaunchables(context.cwd).map((resolved) =>
        configLaunchableToLaunchable(context, resolved)
    );
}

function discoverRunningWorkspaceLaunchables(options: {
    workspaces: ReturnType<typeof listWorkspaces>;
    excludeLabels: Set<string>;
}): Launchable[] {
    return options.workspaces
        .filter((workspace) => !workspace.focused)
        .filter((workspace) => !options.excludeLabels.has(workspace.label))
        .map((workspace) => ({
            id: `running-workspace:${workspace.workspaceId}`,
            title: workspace.label,
            source: 'running-workspace',
            kind: 'workspace',
            action: {
                type: 'focus-workspace',
                workspaceId: workspace.workspaceId,
            },
        }));
}

/**
 * The picker and the launcher do not care about the source of a launchable,
 * so we convert all launchables to a common format.
 */
function configLaunchableToLaunchable(
    context: PluginContext,
    resolved: ResolvedConfigLaunchable
): Launchable {
    return {
        id: configLaunchableId(resolved),
        title: resolved.name,
        source:
            resolved.source === 'project' ? 'project-config' : 'global-config',
        kind: resolved.launchable.type,
        action: compileConfigLaunchable(context, resolved),
    };
}

function configLaunchableId(resolved: ResolvedConfigLaunchable): string {
    return `config:${resolved.source}:${resolved.configPath}:${resolved.name}`;
}

function compileConfigLaunchable(
    context: PluginContext,
    resolved: ResolvedConfigLaunchable
): LaunchAction {
    const launchable = resolved.launchable;

    switch (launchable.type) {
        case 'background':
            return {
                type: 'run-background',
                command: launchable.command,
                cwd: resolveConfiguredCwd(
                    resolved,
                    context.cwd,
                    launchable.cwd
                ),
                logName: resolved.name,
            };
        case 'pane':
            return {
                type: 'split-pane',
                fromPaneId: context.paneId,
                pane: paneConfigToPlan(
                    resolved,
                    context.cwd,
                    launchable,
                    undefined,
                    true
                ),
            };
        case 'tab':
            return {
                type: 'create-tab',
                workspaceId: context.workspaceId,
                tab: tabConfigToPlan(
                    resolved,
                    context.cwd,
                    launchable,
                    undefined,
                    launchable.name || resolved.name
                ),
                focus: true,
            };
        case 'workspace': {
            const label = launchable.name || resolved.name;
            const inheritedWorkspaceCwd = resolveConfiguredCwd(
                resolved,
                context.cwd,
                launchable.cwd
            );
            return {
                type: 'ensure-workspace-layout',
                label,
                cwd: inheritedWorkspaceCwd,
                tabs: launchable.tabs.map((tab) =>
                    tabConfigToPlan(
                        resolved,
                        context.cwd,
                        tab,
                        inheritedWorkspaceCwd,
                        tab.name
                    )
                ),
                focus: true,
            };
        }
        case 'idle-panes':
            return {
                type: 'run-in-idle-panes',
                command: launchable.command,
            };
    }
}

function tabConfigToPlan(
    resolved: ResolvedConfigLaunchable,
    selectedAtCwd: string,
    tab: TabConfigLaunchable,
    inheritedCwd: string | undefined,
    label: string | undefined
): TabPlan {
    const tabCwd = resolveInheritedConfiguredCwd(
        resolved,
        selectedAtCwd,
        inheritedCwd,
        tab.cwd
    );
    const panes = panesForTab(tab).map((pane, index) =>
        paneConfigToPlan(resolved, selectedAtCwd, pane, tabCwd, index > 0)
    );
    return {
        ...(label ? { label } : {}),
        cwd: panes[0]?.cwd || tabCwd,
        panes,
    };
}

function paneConfigToPlan(
    resolved: ResolvedConfigLaunchable,
    selectedAtCwd: string,
    pane: PaneConfigLaunchable,
    inheritedCwd: string | undefined,
    includeDirection: boolean
): PanePlan {
    const cwd = resolveInheritedConfiguredCwd(
        resolved,
        selectedAtCwd,
        inheritedCwd,
        pane.cwd
    );
    return {
        ...(pane.name ? { label: pane.name } : {}),
        cwd,
        ...(pane.command ? { command: pane.command } : {}),
        ...(pane.commandMode ? { commandMode: pane.commandMode } : {}),
        ...(includeDirection ? { direction: pane.direction || 'right' } : {}),
    };
}

function panesForTab(tab: TabConfigLaunchable): PaneConfigLaunchable[] {
    return tab.panes && tab.panes.length > 0 ? tab.panes : [{ type: 'pane' }];
}
