/** Whether a picker item came from config or Herdr's currently open workspaces. */
export type LaunchableSource = 'global' | 'project' | 'open';

export type ConfiguredLaunchableSource = Exclude<LaunchableSource, 'open'>;

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

/** Synthetic picker entry for an already-open Herdr workspace. */
export interface OpenWorkspaceLaunchable {
    type: 'open-workspace';
    workspaceId: string;
    label: string;
    number?: number;
    focused?: boolean;
}

export type ConfiguredLaunchable =
    | BackgroundLaunchable
    | PaneLaunchable
    | TabLaunchable
    | WorkspaceLaunchable
    | IdlePanesLaunchable;

export type Launchable = ConfiguredLaunchable | OpenWorkspaceLaunchable;

/** A validated `.launchables.json`, keyed by display name. */
export type LaunchablesFile = Record<string, ConfiguredLaunchable>;

/**
 * A configured launchable plus the file metadata needed for display,
 * precedence, and cwd resolution. Project entries replace global entries with
 * the same name.
 */
export interface ResolvedConfiguredLaunchable {
    name: string;
    source: ConfiguredLaunchableSource;
    configPath: string;
    configDir: string;
    launchable: ConfiguredLaunchable;
}

/** A synthetic picker item for an already-open workspace. */
export interface ResolvedOpenWorkspace {
    name: string;
    source: 'open';
    launchable: OpenWorkspaceLaunchable;
}

export type ResolvedLaunchable =
    | ResolvedConfiguredLaunchable
    | ResolvedOpenWorkspace;

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
