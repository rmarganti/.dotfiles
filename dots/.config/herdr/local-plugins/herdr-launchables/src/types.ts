/** Whether the the launchable was read from a global or project-specific .launchables.json */
export type LaunchableSource = 'global' | 'project';

export type SplitDirection = 'right' | 'down';

/**
 * Runs a shell command detached from Herdr and writes output to a plugin log.
 */
export interface BackgroundLaunchable {
    type: 'background';
    command: string;
    cwd?: string;
}

/** A command inside a tab launchable; object form can override cwd per pane. */
export type TabCommand =
    | string
    | {
          command: string;
          cwd?: string;
      };

/** Creates a new tab and runs either one command or one command per split pane. */
export type TabLaunchable = {
    type: 'tab';
    cwd?: string;
} & (
    | { command: string; commands?: never }
    | { command?: never; commands: TabCommand[] }
);

/** Creates a split beside the source pane and runs a command there. */
export interface SplitLaunchable {
    type: 'split';
    command: string;
    cwd?: string;
    direction?: SplitDirection;
}

/** Runs a command in every pane that appears to be sitting at an idle shell. */
export interface IdlePanesLaunchable {
    type: 'idle-panes';
    command: string;
}

export type Launchable =
    | BackgroundLaunchable
    | TabLaunchable
    | SplitLaunchable
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

/** Internal validated form for tab command entries before cwd defaults apply. */
export interface NormalizedTabCommand {
    command: string;
    cwd?: string;
}

/** Internal execution form for tab commands after cwd resolution. */
export interface ResolvedTabCommand {
    command: string;
    cwd: string;
}
