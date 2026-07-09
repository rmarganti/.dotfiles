import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { IDLE_SHELL_NAMES } from './constants.ts';
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
    CreateTabAction,
    EnsureWorkspaceLayoutAction,
    LaunchAction,
    PanePlan,
    RunBackgroundAction,
    SplitPaneAction,
    TabPlan,
} from './types.ts';

// -[ Dispatcher ]-----------------------------------------------

export function executeLaunchAction(action: LaunchAction): void {
    switch (action.type) {
        case 'split-pane':
            return executeSplitPane(action);
        case 'create-tab':
            return executeCreateTab(action);
        case 'ensure-workspace-layout':
            return executeEnsureWorkspaceLayout(action);
        case 'focus-workspace':
            return focusWorkspace(action.workspaceId);
        case 'run-background':
            return executeRunBackground(action);
        case 'run-in-idle-panes':
            return executeRunInIdlePanes(action.command);
    }
}

// -[ Launch Handlers ]------------------------------------------

function executeRunBackground(action: RunBackgroundAction): void {
    const logPath = backgroundLogFile(action.logName);
    const out = fs.openSync(logPath, 'a');
    const child = spawn(action.command, {
        cwd: action.cwd,
        shell: true,
        detached: true,
        stdio: ['ignore', out, out],
        env: process.env,
    });
    child.unref();
}

function executeSplitPane(action: SplitPaneAction): void {
    if (!action.fromPaneId) return;

    const { paneId } = splitPane({
        paneId: action.fromPaneId,
        direction: action.pane.direction || 'right',
        cwd: action.pane.cwd,
        focus: true,
    });
    configurePane(paneId, action.pane);
}

function executeCreateTab(action: CreateTabAction): void {
    if (!action.workspaceId) return;

    const created = applyTabLayout({
        workspaceId: action.workspaceId,
        tab: action.tab,
        focus: action.focus !== false,
    });

    focusWorkspace(action.workspaceId);
    focusTab(created.tabId);
}

function executeEnsureWorkspaceLayout(action: EnsureWorkspaceLayoutAction): void {
    const existingId = findWorkspaceIdByLabel(action.label);
    if (existingId) {
        focusWorkspace(existingId);
        return;
    }

    const firstTab = action.tabs[0];
    if (!firstTab) return;

    const created = createWorkspace({
        cwd: firstTab.panes[0]?.cwd || firstTab.cwd || action.cwd,
        label: action.label,
        focus: action.focus !== false,
    });

    const firstCreatedTab = applyTabLayout({
        workspaceId: created.workspaceId,
        tab: firstTab,
        existing: { tabId: created.tabId, rootPaneId: created.rootPaneId },
        focus: true,
    });

    for (const tab of action.tabs.slice(1)) {
        applyTabLayout({
            workspaceId: created.workspaceId,
            tab,
            focus: false,
        });
    }

    focusWorkspace(created.workspaceId);
    focusTab(firstCreatedTab.tabId);
}

function executeRunInIdlePanes(command: string): void {
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
    tab: TabPlan;
    existing?: TabTarget;
    focus?: boolean;
}

/**
 * Materializes a tab plan into Herdr panes, optionally reusing the tab that
 * Herdr created as part of workspace creation.
 */
function applyTabLayout(options: ApplyTabLayoutOptions): TabTarget {
    const rootPane = options.tab.panes[0] || { cwd: options.tab.cwd };

    const target = options.existing
        ? options.existing
        : createTab({
              workspaceId: options.workspaceId,
              cwd: rootPane.cwd,
              label: options.tab.label,
              focus: options.focus !== false,
          });

    if (options.existing && options.tab.label) {
        renameTab(target.tabId, options.tab.label);
    }

    let currentPaneId = target.rootPaneId;
    configurePane(currentPaneId, rootPane);

    for (const pane of options.tab.panes.slice(1)) {
        currentPaneId = splitPane({
            paneId: currentPaneId,
            direction: pane.direction || 'right',
            cwd: pane.cwd,
            focus: false,
        }).paneId;
        configurePane(currentPaneId, pane);
    }

    return target;
}

function configurePane(paneId: string, pane: PanePlan): void {
    if (pane.label) renamePane(paneId, pane.label);
    if (pane.command) runPaneCommand(paneId, pane.command, pane.commandMode);
}

// -[ Workspace Commands ]---------------------------------------

function findWorkspaceIdByLabel(label: string): string {
    const match = listWorkspaces().find((workspace) => workspace.label === label);
    return match?.workspaceId || '';
}

// -[ Idle Pane Detection ]--------------------------------------

/** Finds panes that appear safe to reuse because they are sitting at a shell prompt. */
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

/** Normalizes argv variants such as login shells (`-zsh`) to comparable names. */
function normalizeProcessName(value: string): string {
    return path.basename(value).replace(/^-+/, '');
}
