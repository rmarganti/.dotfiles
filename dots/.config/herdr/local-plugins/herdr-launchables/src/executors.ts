import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { IDLE_SHELL_NAMES } from './constants.ts';
import { resolveConfiguredCwd, resolveInheritedConfiguredCwd } from './cwd.ts';
import {
    createTab,
    createWorkspace,
    focusTab,
    focusWorkspace,
    listPanes,
    listWorkspaces,
    paneProcessInfo,
    renamePane,
    renameTab,
    runPaneCommand,
    splitPane,
    type PaneProcessInfo,
} from './herdr.ts';
import { backgroundLogFile } from './log.ts';
import type {
    PaneLaunchable,
    ResolvedLaunchable,
    SelectionPayload,
    SplitDirection,
    TabLaunchable,
} from './types.ts';

// -[ Dispatcher ]-----------------------------------------------

export function executeSelection(payload: SelectionPayload): void {
    switch (payload.resolved.launchable.type) {
        case 'background':
            executeBackgroundLaunchable(payload);
            return;
        case 'pane':
            executePaneLaunchable(payload);
            return;
        case 'tab':
            executeTabLaunchable(payload);
            return;
        case 'workspace':
            executeWorkspaceLaunchable(payload);
            return;
        case 'idle-panes':
            executeIdlePanesLaunchable(payload.resolved.launchable.command);
            return;
    }
}

// -[ Launch Handlers ]------------------------------------------

/**
 * Execute a command outside Herdr and log
 * to the plugin's background log directory.
 */
function executeBackgroundLaunchable(payload: SelectionPayload): void {
    const { resolved } = payload;
    if (resolved.launchable.type !== 'background') return;

    const logPath = backgroundLogFile(resolved.name);
    const cwd = resolveConfiguredCwd(
        resolved,
        payload.selectedAtCwd,
        resolved.launchable.cwd
    );
    const out = fs.openSync(logPath, 'a');
    const child = spawn(resolved.launchable.command, {
        cwd,
        shell: true,
        detached: true,
        stdio: ['ignore', out, out],
        env: process.env,
    });
    child.unref();
}

function executePaneLaunchable(payload: SelectionPayload): void {
    const { sourcePaneId, resolved } = payload;
    if (!sourcePaneId || resolved.launchable.type !== 'pane') return;

    const pane = resolved.launchable;
    const cwd = resolvePaneCwd(resolved, payload.selectedAtCwd, pane);
    const direction = pane.direction || 'right';
    const { paneId } = splitPane({
        paneId: sourcePaneId,
        direction,
        cwd,
        focus: true,
    });
    configurePane(paneId, pane);
}

function executeTabLaunchable(payload: SelectionPayload): void {
    const { workspaceId, resolved } = payload;
    if (!workspaceId || resolved.launchable.type !== 'tab') return;

    const created = applyTabLayout({
        workspaceId,
        resolved,
        selectedAtCwd: payload.selectedAtCwd,
        tab: resolved.launchable,
        label: resolved.launchable.name || resolved.name,
        focus: true,
    });

    focusWorkspace(workspaceId);
    focusTab(created.tabId);
}

function executeWorkspaceLaunchable(payload: SelectionPayload): void {
    const { resolved } = payload;
    if (resolved.launchable.type !== 'workspace') return;

    const workspace = resolved.launchable;
    const label = workspace.name || resolved.name;


    // Workspaces are addressed by label: selecting an existing one focuses it
    // instead of recreating the configured layout.
    const existingId = findWorkspaceIdByLabel(label);
    if (existingId) {
        focusWorkspace(existingId);
        return;
    }

    const inheritedWorkspaceCwd = resolveConfiguredCwd(
        resolved,
        payload.selectedAtCwd,
        workspace.cwd
    );
    const firstTab = workspace.tabs[0]!;
    const firstRootCwd = resolveTabRootPaneCwd(
        resolved,
        payload.selectedAtCwd,
        firstTab,
        inheritedWorkspaceCwd
    );

    const created = createWorkspace({ cwd: firstRootCwd, label, focus: true });
    const firstCreatedTab = applyTabLayout({
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
        applyTabLayout({
            workspaceId: created.workspaceId,
            resolved,
            selectedAtCwd: payload.selectedAtCwd,
            tab,
            inheritedCwd: inheritedWorkspaceCwd,
            label: tab.name,
            focus: false,
        });
    }

    focusWorkspace(created.workspaceId);
    focusTab(firstCreatedTab.tabId);
}

function executeIdlePanesLaunchable(command: string): void {
    for (const paneId of idlePaneIds()) {
        runPaneCommand(paneId, command, 'keep-shell');
    }
}

// -[ Tab / Pane Layout ]----------------------------------------

/** A tab plus its root pane, whether newly created or supplied by Herdr. */
interface TabTarget {
    tabId: string;
    rootPaneId: string;
}

interface ApplyTabLayoutOptions {
    workspaceId: string;
    resolved: ResolvedLaunchable;
    selectedAtCwd: string;
    tab: TabLaunchable;
    inheritedCwd?: string;
    label?: string;
    existing?: TabTarget;
    focus?: boolean;
}

/**
 * Materializes a tab definition into Herdr panes, optionally reusing the tab that
 * Herdr created as part of workspace creation.
 */
function applyTabLayout(options: ApplyTabLayoutOptions): TabTarget {
    const panes = panesForTab(options.tab);
    const inheritedTabCwd = resolveTabCwd(
        options.resolved,
        options.selectedAtCwd,
        options.tab,
        options.inheritedCwd
    );
    const rootCwd = resolvePaneCwd(
        options.resolved,
        options.selectedAtCwd,
        panes[0]!,
        inheritedTabCwd
    );

    const target = options.existing
        ? options.existing
        : createTab({
              workspaceId: options.workspaceId,
              cwd: rootCwd,
              label: options.label,
              focus: options.focus !== false,
          });

    if (options.existing && options.label) {
        renameTab(target.tabId, options.label);
    }

    let currentPaneId = target.rootPaneId;
    configurePane(currentPaneId, panes[0]!);

    for (const pane of panes.slice(1)) {
        const direction: SplitDirection = pane.direction || 'right';
        const cwd = resolvePaneCwd(
            options.resolved,
            options.selectedAtCwd,
            pane,
            inheritedTabCwd
        );
        currentPaneId = splitPane({
            paneId: currentPaneId,
            direction,
            cwd,
            focus: false,
        }).paneId;
        configurePane(currentPaneId, pane);
    }

    return target;
}

function configurePane(paneId: string, pane: PaneLaunchable): void {
    if (pane.name) renamePane(paneId, pane.name);
    if (pane.command) runPaneCommand(paneId, pane.command, pane.commandMode);
}

/** Treats a tab with no pane list as a single default pane. */
function panesForTab(tab: TabLaunchable): PaneLaunchable[] {
    return tab.panes && tab.panes.length > 0 ? tab.panes : [{ type: 'pane' }];
}

// -[ Workspace Commands ]---------------------------------------

function findWorkspaceIdByLabel(label: string): string {
    const match = listWorkspaces().find(
        (workspace) => (workspace.label || workspace.name || '') === label
    );
    return match?.workspaceId || '';
}

// -[ CWD Resolution ]-------------------------------------------

/**
 * Child launchables inherit cwd from their parent unless they declare their own.
 */
function resolveTabCwd(
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

function resolvePaneCwd(
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

/**
 * Determines the cwd Herdr needs when creating a tab before its full layout exists.
 */
function resolveTabRootPaneCwd(
    resolved: ResolvedLaunchable,
    selectedAtCwd: string,
    tab: TabLaunchable,
    inheritedCwd?: string
): string {
    const inheritedTabCwd = resolveTabCwd(
        resolved,
        selectedAtCwd,
        tab,
        inheritedCwd
    );
    return resolvePaneCwd(
        resolved,
        selectedAtCwd,
        panesForTab(tab)[0]!,
        inheritedTabCwd
    );
}

// -[ Idle Pane Detection ]--------------------------------------

/**
 * Finds panes that appear safe to reuse because they are sitting at a shell prompt.
 */
function idlePaneIds(): string[] {
    const ids: string[] = [];

    for (const pane of listPanes()) {
        const processInfo = paneProcessInfo(pane.paneId);
        if (isIdleShellProcessInfo(processInfo)) ids.push(pane.paneId);
    }

    return ids;
}

/**
 * A pane is considered idle when its foreground process is one of Herdr's known
 * shell names rather than an interactive program or running task.
 */
function isIdleShellProcessInfo(processInfo?: PaneProcessInfo): boolean {
    const foreground = processInfo?.foregroundProcesses?.[0];
    const candidates = [foreground?.name, foreground?.argv0].filter(
        (value): value is string =>
            typeof value === 'string' && value.trim().length > 0
    );
    return candidates.some((candidate) =>
        IDLE_SHELL_NAMES.has(normalizeProcessName(candidate))
    );
}

/**
 * Normalizes argv variants such as login shells (`-zsh`) to comparable names.
 */
function normalizeProcessName(value: string): string {
    return path.basename(value).replace(/^-+/, '');
}
