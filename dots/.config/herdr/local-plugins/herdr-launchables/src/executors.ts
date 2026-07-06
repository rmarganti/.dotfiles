import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { IDLE_SHELL_NAMES } from './constants.ts';
import { resolveConfiguredCwd, resolveInheritedConfiguredCwd } from './cwd.ts';
import { herdr, herdrJson, herdrPaneRunThenExit } from './herdr.ts';
import { backgroundLogFile } from './log.ts';
import type {
    PaneLaunchable,
    ResolvedLaunchable,
    SelectionPayload,
    SplitDirection,
    TabLaunchable,
    WorkspaceLaunchable,
} from './types.ts';

// -[ Dispatcher ]-----------------------------------------------

export function executeSelection(payload: SelectionPayload): void {
    switch (payload.resolved.launchable.type) {
        case 'background':
            executeBackground(
                payload.resolved.name,
                payload.resolved.launchable.command,
                resolveConfiguredCwd(
                    payload.resolved,
                    payload.selectedAtCwd,
                    payload.resolved.launchable.cwd
                )
            );
            return;
        case 'pane':
            executeTopLevelPane(payload);
            return;
        case 'tab':
            executeTopLevelTab(payload);
            return;
        case 'workspace':
            executeWorkspace(payload);
            return;
        case 'idle-panes':
            executeIdlePanes(payload.resolved.launchable.command);
            return;
    }
}

// -[ Background ]-----------------------------------------------

function executeBackground(name: string, command: string, cwd: string): void {
    const logPath = backgroundLogFile(name);
    const out = fs.openSync(logPath, 'a');
    const child = spawn(command, {
        cwd,
        shell: true,
        detached: true,
        stdio: ['ignore', out, out],
        env: process.env,
    });
    child.unref();
}

// -[ Panes / Tabs / Workspaces ]--------------------------------

interface ExistingTabTarget {
    tabId: string;
    rootPaneId: string;
}

interface ExecuteTabOptions {
    workspaceId: string;
    resolved: ResolvedLaunchable;
    selectedAtCwd: string;
    tab: TabLaunchable;
    inheritedCwd?: string;
    label?: string;
    existing?: ExistingTabTarget;
    focus?: boolean;
}

interface CreatedTab {
    tabId: string;
    rootPaneId: string;
}

function normalizedPanes(tab: TabLaunchable): PaneLaunchable[] {
    return tab.panes && tab.panes.length > 0 ? tab.panes : [{ type: 'pane' }];
}

function tabCwd(
    resolved: ResolvedLaunchable,
    selectedAtCwd: string,
    tab: TabLaunchable,
    inheritedCwd?: string
): string {
    return resolveInheritedConfiguredCwd(
        resolved,
        selectedAtCwd,
        inheritedCwd,
        tab.cwd
    );
}

function paneCwd(
    resolved: ResolvedLaunchable,
    selectedAtCwd: string,
    pane: PaneLaunchable,
    inheritedCwd?: string
): string {
    return resolveInheritedConfiguredCwd(
        resolved,
        selectedAtCwd,
        inheritedCwd,
        pane.cwd
    );
}

function configurePane(paneId: string, pane: PaneLaunchable): void {
    if (pane.name) herdr(['pane', 'rename', paneId, pane.name]);
    if (pane.command) herdrPaneRunThenExit(paneId, pane.command);
}

function createTab(
    workspaceId: string,
    cwd: string,
    label: string | undefined,
    focus: boolean
): CreatedTab {
    const args = [
        'tab',
        'create',
        '--workspace',
        workspaceId,
        '--cwd',
        cwd,
    ];
    if (label) args.push('--label', label);
    args.push(focus ? '--focus' : '--no-focus');

    const tab = herdrJson<{
        result?: {
            tab?: { tab_id?: string };
            root_pane?: { pane_id?: string };
        };
    }>(args);
    const tabId = tab.result?.tab?.tab_id || '';
    const rootPaneId = tab.result?.root_pane?.pane_id || '';
    if (!tabId || !rootPaneId) throw new Error('failed to create tab');
    return { tabId, rootPaneId };
}

function executeTabLayout(options: ExecuteTabOptions): CreatedTab {
    const panes = normalizedPanes(options.tab);
    const inheritedTabCwd = tabCwd(
        options.resolved,
        options.selectedAtCwd,
        options.tab,
        options.inheritedCwd
    );
    const rootCwd = paneCwd(
        options.resolved,
        options.selectedAtCwd,
        panes[0]!,
        inheritedTabCwd
    );

    const target = options.existing
        ? options.existing
        : createTab(
              options.workspaceId,
              rootCwd,
              options.label,
              options.focus !== false
          );

    if (options.existing && options.label) {
        herdr(['tab', 'rename', target.tabId, options.label]);
    }

    let currentPaneId = target.rootPaneId;
    configurePane(currentPaneId, panes[0]!);

    for (const pane of panes.slice(1)) {
        const direction: SplitDirection = pane.direction || 'right';
        const cwd = paneCwd(
            options.resolved,
            options.selectedAtCwd,
            pane,
            inheritedTabCwd
        );
        const split = herdrJson<{ result?: { pane?: { pane_id?: string } } }>([
            'pane',
            'split',
            currentPaneId,
            '--direction',
            direction,
            '--cwd',
            cwd,
            '--no-focus',
        ]);
        currentPaneId = split.result?.pane?.pane_id || '';
        if (!currentPaneId)
            throw new Error(`failed to create pane split for ${options.resolved.name}`);
        configurePane(currentPaneId, pane);
    }

    return target;
}

function executeTopLevelPane(payload: SelectionPayload): void {
    const { sourcePaneId, resolved } = payload;
    if (!sourcePaneId || resolved.launchable.type !== 'pane') return;

    const pane = resolved.launchable;
    const cwd = paneCwd(resolved, payload.selectedAtCwd, pane);
    const direction = pane.direction || 'right';
    const split = herdrJson<{ result?: { pane?: { pane_id?: string } } }>([
        'pane',
        'split',
        sourcePaneId,
        '--direction',
        direction,
        '--cwd',
        cwd,
        '--focus',
    ]);
    const paneId = split.result?.pane?.pane_id || '';
    if (!paneId) throw new Error(`failed to create pane for ${resolved.name}`);
    configurePane(paneId, pane);
}

function executeTopLevelTab(payload: SelectionPayload): void {
    const { workspaceId, resolved } = payload;
    if (!workspaceId || resolved.launchable.type !== 'tab') return;

    const created = executeTabLayout({
        workspaceId,
        resolved,
        selectedAtCwd: payload.selectedAtCwd,
        tab: resolved.launchable,
        label: resolved.launchable.name || resolved.name,
        focus: true,
    });

    herdr(['workspace', 'focus', workspaceId]);
    herdr(['tab', 'focus', created.tabId]);
}

interface WorkspaceListResponse {
    result?: {
        workspaces?: Array<{ workspace_id?: string; label?: string; name?: string }>;
    };
}

interface WorkspaceCreateResponse {
    result?: {
        workspace?: { workspace_id?: string; label?: string; name?: string };
        tab?: { tab_id?: string };
        root_pane?: { pane_id?: string };
    };
}

function existingWorkspaceId(label: string): string {
    const workspaces =
        herdrJson<WorkspaceListResponse>(['workspace', 'list']).result
            ?.workspaces || [];
    const match = workspaces.find(
        (workspace) => (workspace.label || workspace.name || '') === label
    );
    return match?.workspace_id || '';
}

function createWorkspace(
    cwd: string,
    label: string
): { workspaceId: string; tabId: string; rootPaneId: string } {
    const created = herdrJson<WorkspaceCreateResponse>([
        'workspace',
        'create',
        '--cwd',
        cwd,
        '--label',
        label,
        '--focus',
    ]);
    const workspaceId = created.result?.workspace?.workspace_id || '';
    const tabId = created.result?.tab?.tab_id || '';
    const rootPaneId = created.result?.root_pane?.pane_id || '';
    if (!workspaceId || !tabId || !rootPaneId) {
        throw new Error(`failed to create workspace ${label}`);
    }
    return { workspaceId, tabId, rootPaneId };
}

function workspaceCwd(
    resolved: ResolvedLaunchable,
    selectedAtCwd: string,
    workspace: WorkspaceLaunchable
): string {
    return resolveConfiguredCwd(resolved, selectedAtCwd, workspace.cwd);
}

function executeWorkspace(payload: SelectionPayload): void {
    const { resolved } = payload;
    if (resolved.launchable.type !== 'workspace') return;

    const workspace = resolved.launchable;
    const label = workspace.name || resolved.name;
    const existingId = existingWorkspaceId(label);
    if (existingId) {
        herdr(['workspace', 'focus', existingId]);
        return;
    }

    const inheritedWorkspaceCwd = workspaceCwd(
        resolved,
        payload.selectedAtCwd,
        workspace
    );
    const firstTab = workspace.tabs[0]!;
    const firstRootPane = normalizedPanes(firstTab)[0]!;
    const firstTabCwd = tabCwd(
        resolved,
        payload.selectedAtCwd,
        firstTab,
        inheritedWorkspaceCwd
    );
    const firstRootCwd = paneCwd(
        resolved,
        payload.selectedAtCwd,
        firstRootPane,
        firstTabCwd
    );

    const created = createWorkspace(firstRootCwd, label);
    const firstCreatedTab = executeTabLayout({
        workspaceId: created.workspaceId,
        resolved,
        selectedAtCwd: payload.selectedAtCwd,
        tab: firstTab,
        inheritedCwd: inheritedWorkspaceCwd,
        label: firstTab.name,
        existing: { tabId: created.tabId, rootPaneId: created.rootPaneId },
        focus: true,
    });

    for (const tab of workspace.tabs.slice(1)) {
        executeTabLayout({
            workspaceId: created.workspaceId,
            resolved,
            selectedAtCwd: payload.selectedAtCwd,
            tab,
            inheritedCwd: inheritedWorkspaceCwd,
            label: tab.name,
            focus: false,
        });
    }

    herdr(['workspace', 'focus', created.workspaceId]);
    herdr(['tab', 'focus', firstCreatedTab.tabId]);
}

// -[ Idle Panes ]-----------------------------------------------

interface PaneListResponse {
    result?: {
        panes?: Array<{ pane_id?: string }>;
    };
}

interface PaneProcessInfo {
    foreground_processes?: Array<{
        name?: string;
        argv0?: string;
    }>;
}

interface PaneProcessInfoResponse {
    result?: {
        process_info?: PaneProcessInfo;
    };
}

function normalizeProcessName(value: string): string {
    return path.basename(value).replace(/^-+/, '');
}

function isIdleShellProcessInfo(processInfo?: PaneProcessInfo): boolean {
    const foreground = processInfo?.foreground_processes?.[0];
    const candidates = [foreground?.name, foreground?.argv0].filter(
        isNonEmptyString
    );
    return candidates.some((candidate) =>
        IDLE_SHELL_NAMES.has(normalizeProcessName(candidate))
    );
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function idlePaneIds(): string[] {
    const panes =
        herdrJson<PaneListResponse>(['pane', 'list']).result?.panes || [];
    const ids: string[] = [];

    for (const pane of panes) {
        if (!pane.pane_id) continue;
        const processInfo = herdrJson<PaneProcessInfoResponse>([
            'pane',
            'process-info',
            '--pane',
            pane.pane_id,
        ]).result?.process_info;
        if (isIdleShellProcessInfo(processInfo)) ids.push(pane.pane_id);
    }

    return ids;
}

function executeIdlePanes(command: string): void {
    for (const paneId of idlePaneIds()) {
        herdr(['pane', 'run', paneId, command]);
    }
}
