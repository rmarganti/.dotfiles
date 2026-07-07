/** Whether the the launchable was read from a global or project-specific .launchables.json */
export type LaunchableSource = 'global' | 'project';

export type LaunchableType = Launchable['type'];

export type SplitDirection = 'right' | 'down';

export type PaneCommandMode =
    | 'exit-on-success'
    | 'keep-shell'
    | 'exit-always'
    | 'loop';

/**
 * Runs a shell command detached from Herdr and writes output to a plugin log.
 */
export interface BackgroundLaunchable {
    type: 'background';
    command: string;
    cwd?: string;
}

/** Creates or configures a Herdr pane. */
export interface PaneLaunchable {
    type: 'pane';
    name?: string;
    command?: string;
    commandMode?: PaneCommandMode;
    cwd?: string;
    direction?: SplitDirection;
}

/** Creates a new tab and configures one or more panes. */
export interface TabLaunchable {
    type: 'tab';
    name?: string;
    cwd?: string;
    panes?: PaneLaunchable[];
}

/** Creates a full Herdr workspace with one or more tabs. */
export interface WorkspaceLaunchable {
    type: 'workspace';
    name?: string;
    cwd?: string;
    tabs: TabLaunchable[];
}

/** Runs a command in every pane that appears to be sitting at an idle shell. */
export interface IdlePanesLaunchable {
    type: 'idle-panes';
    command: string;
}

export type Launchable =
    | BackgroundLaunchable
    | PaneLaunchable
    | TabLaunchable
    | WorkspaceLaunchable
    | IdlePanesLaunchable;

/** A validated `.launchables.json`, keyed by display name. */
export type LaunchablesFile = Record<string, Launchable>;

/**
 * A launchable plus the file metadata needed for display, precedence, and cwd
 * resolution. Project entries replace global entries with the same name.
 */
export interface ResolvedLaunchable {
    name: string;
    source: LaunchableSource;
    configPath: string;
    configDir: string;
    launchable: Launchable;
}

/**
 * The picker writes this payload before exiting; the detached apply process reads
 * it after the overlay pane closes and performs the selected launch.
 */
export interface SelectionPayload {
    workspaceId: string;
    sourcePaneId: string;
    selectedAtCwd: string;
    resolved: ResolvedLaunchable;
}

/** Invocation context captured from Herdr env/context, with CLI fallback. */
export interface PluginContext {
    workspaceId: string;
    paneId: string;
    cwd: string;
}
