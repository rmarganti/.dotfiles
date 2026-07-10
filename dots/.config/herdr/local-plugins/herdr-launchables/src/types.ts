/*
 * Domain model for herdr-launchables.
 *
 * The core model is:
 *
 *   Launchable -> LaunchAction
 *
 * A Launchable is what the picker shows. A LaunchAction is what the executor
 * performs. Inputs such as config files and Herdr runtime state compile into
 * this model.
 */

// ----------------------------------------------------------------
// Core Domain Model
// ----------------------------------------------------------------

/**
 * The final picker/execution domain object.
 *
 * This is intentionally broader than configured `.launchables.json` entries:
 * config and Herdr runtime state both become Launchables before they reach the
 * picker.
 */
export interface Launchable {
    id: string;
    title: string;

    /** Provenance only. Used for display/filtering, never execution. */
    source: LaunchableSource;

    /** Presentation/grouping only. Used for picker display, never execution. */
    kind: LaunchableKind;

    /** The provenance-free behavior selected by the user. */
    action: LaunchAction;
}

export type LaunchableSource =
    | 'global-config'
    | 'project-config'
    | 'running-workspace'
    | 'zoxide';

export type LaunchableKind =
    | 'workspace'
    | 'tab'
    | 'pane'
    | 'background'
    | 'idle-panes';

// ----------------------------------------------------------------
// Execution Actions
// ----------------------------------------------------------------

/**
 * The executor seam.
 *
 * Actions describe what to do, not where the request came from. Keeping actions
 * provenance-free lets new discovery sources plug in without changing executor
 * behavior unless they introduce a genuinely new kind of operation.
 */
export type LaunchAction =
    | SplitPaneAction
    | CreateTabAction
    | EnsureWorkspaceLayoutAction
    | FocusWorkspaceAction
    | RunBackgroundAction
    | RunInIdlePanesAction;

/** Split from an existing pane and optionally configure the new pane. */
export interface SplitPaneAction {
    type: 'split-pane';
    fromPaneId: string;
    pane: PanePlan;
}

/** Create a tab in an existing workspace and materialize its pane layout. */
export interface CreateTabAction {
    type: 'create-tab';
    workspaceId: string;
    tab: TabPlan;
    focus?: boolean;
}

/**
 * Ensure a desired workspace layout exists.
 *
 * Configured workspaces currently use this, but the action is not config-specific:
 * any future source that can describe a desired layout could produce it.
 *
 * The action is idempotent by label. If a workspace with the requested label
 * exists, focus it. Otherwise, create the workspace and materialize `tabs`.
 */
export interface EnsureWorkspaceLayoutAction {
    type: 'ensure-workspace-layout';
    label: string;
    cwd: string;
    tabs: TabPlan[];
    focus?: boolean;
}

/**
 * Focus an exact existing workspace.
 *
 * Runtime-discovered workspaces use this because there is no desired layout to
 * replay; the workspace already exists and should be addressed by Herdr id.
 */
export interface FocusWorkspaceAction {
    type: 'focus-workspace';
    workspaceId: string;
}

/** Run a detached shell command and write output to a plugin log. */
export interface RunBackgroundAction {
    type: 'run-background';
    command: string;
    cwd: string;
    logName: string;
}

/** Run a command in every pane that appears to be sitting at an idle shell. */
export interface RunInIdlePanesAction {
    type: 'run-in-idle-panes';
    command: string;
}

// ----------------------------------------------------------------
// Execution Plans
// ----------------------------------------------------------------

/**
 * Compiled tab layout data used by actions.
 *
 * Unlike config objects, plans have already resolved cwd inheritance and naming
 * rules. Executors should not need to know whether a plan came from config or
 * Herdr runtime state.
 */
export interface TabPlan {
    label?: string;
    cwd: string;
    panes: PanePlan[];
}

/** Compiled pane data used by split/create-tab/workspace-layout actions. */
export interface PanePlan {
    label?: string;
    cwd: string;
    command?: string;
    commandMode?: PaneCommandMode;
    direction?: SplitDirection;
}

// ----------------------------------------------------------------
// Config Input Model
// ----------------------------------------------------------------

/** Validated launchable object read from `.launchables.json`. */
export type ConfigLaunchable =
    | BackgroundConfigLaunchable
    | PaneConfigLaunchable
    | TabConfigLaunchable
    | WorkspaceConfigLaunchable
    | IdlePanesConfigLaunchable;

export type ConfigLaunchableType = ConfigLaunchable['type'];

/** A validated `.launchables.json`, keyed by display name. */
export type ConfigLaunchablesFile = Record<string, ConfigLaunchable>;

/**
 * Config input plus file metadata needed for precedence and cwd resolution.
 *
 * This is still a precursor model. Discovery compiles it into a final Launchable
 * before picker display or execution handoff.
 */
export interface ResolvedConfigLaunchable {
    name: string;
    source: ConfigLaunchableSource;
    configPath: string;
    configDir: string;
    launchable: ConfigLaunchable;
}

/** Whether a configured launchable was read from global or project config. */
export type ConfigLaunchableSource = 'global' | 'project';

/** Runs a shell command detached from Herdr and writes output to a plugin log. */
export interface BackgroundConfigLaunchable {
    type: 'background';
    command: string;
    cwd?: string;
}

/** Creates or configures a Herdr pane. */
export interface PaneConfigLaunchable {
    type: 'pane';
    name?: string;
    command?: string;
    commandMode?: PaneCommandMode;
    cwd?: string;
    direction?: SplitDirection;
}

/** Creates a new tab and configures one or more panes. */
export interface TabConfigLaunchable {
    type: 'tab';
    name?: string;
    cwd?: string;
    panes?: PaneConfigLaunchable[];
}

/** Creates a full Herdr workspace with one or more tabs. */
export interface WorkspaceConfigLaunchable {
    type: 'workspace';
    name?: string;
    cwd?: string;
    tabs: TabConfigLaunchable[];
}

/** Runs a command in every pane that appears to be sitting at an idle shell. */
export interface IdlePanesConfigLaunchable {
    type: 'idle-panes';
    command: string;
}

// ----------------------------------------------------------------
// Plugin Invocation / Handoff
// ----------------------------------------------------------------

/** Invocation context captured from Herdr env/context, with CLI fallback. */
export interface PluginContext {
    workspaceId: string;
    paneId: string;
    cwd: string;
}

/**
 * Serialized between the picker overlay and detached apply process.
 *
 * Stores the already-compiled Launchable so apply does not rediscover inputs
 * after the overlay pane closes.
 */
export interface SelectionPayload {
    context: PluginContext;
    selected: Launchable;
}

// ----------------------------------------------------------------
// Shared
// ----------------------------------------------------------------

export type SplitDirection = 'right' | 'down';

export type PaneCommandMode =
    | 'exit-on-success'
    | 'keep-shell'
    | 'exit-always'
    | 'loop';
