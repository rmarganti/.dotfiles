// Turns what discovery found (config entries, Herdr's live spaces and tabs,
// zoxide folders) into picker rows. Each row carries a provenance-free
// `action` that lib/launch.js performs. Pure: no Herdr or machine access.
//
// Actions:
//   split-pane      { fromPane, pane }             a pane beside the source pane
//   create-tab      { space, tab }                 a tab in the source space
//   ensure-space    { name, matchName, cwd, machine, tabs }
//                                                  focus a matching space, else build it
//   focus-space     { space }
//   focus-tab       { space, tab }
//   new-tab         { space }      new-space { machine }
//   run-background  { command, cwd, machine, logName }
//   run-in-idle-panes { command }
//
// Plans: TabPlan { label?, cwd, panes: PanePlan[] }
//        PanePlan { cwd, command?, commandMode?, direction? }

import { basename, normalize, resolve, shortenHome } from "./path.js";

// ----------------------------------------------------------------
// cwd: pane.cwd > tab.cwd > workspace.cwd > source default
// ----------------------------------------------------------------

/** Project entries default to their config's folder; global ones to the source pane's. */
function sourceDefaultCwd(entry, currentCwd) {
  return entry.source === "project" ? entry.configDir : currentCwd;
}

function resolveCwd(entry, currentCwd, inherited, configured) {
  return resolve(inherited || sourceDefaultCwd(entry, currentCwd), configured);
}

function panePlan(entry, currentCwd, pane, inherited, includeDirection) {
  return {
    cwd: resolveCwd(entry, currentCwd, inherited, pane.cwd),
    ...(pane.command ? { command: pane.command } : {}),
    ...(pane.commandMode ? { commandMode: pane.commandMode } : {}),
    ...(includeDirection ? { direction: pane.direction || "right" } : {}),
  };
}

function tabPlan(entry, currentCwd, tab, inherited, label) {
  const tabCwd = resolveCwd(entry, currentCwd, inherited, tab.cwd);
  const panes = (tab.panes?.length ? tab.panes : [{ type: "pane" }]).map((pane, index) =>
    panePlan(entry, currentCwd, pane, tabCwd, index > 0),
  );
  return { ...(label ? { label } : {}), cwd: panes[0]?.cwd || tabCwd, panes };
}

/** Compiles one config entry into its action, in the picker's context. */
export function compileConfigEntry(entry, ctx) {
  const l = entry.launchable;
  switch (l.type) {
    case "background":
      return {
        type: "run-background",
        command: l.command,
        cwd: resolveCwd(entry, ctx.cwd, undefined, l.cwd),
        machine: ctx.machine,
        logName: entry.name,
      };
    case "pane":
      return { type: "split-pane", fromPane: ctx.pane, pane: panePlan(entry, ctx.cwd, l, undefined, true) };
    case "tab":
      return { type: "create-tab", space: ctx.space, tab: tabPlan(entry, ctx.cwd, l, undefined, l.name || entry.name) };
    case "workspace": {
      const name = l.name || entry.name;
      const cwd = resolveCwd(entry, ctx.cwd, undefined, l.cwd);
      return {
        type: "ensure-space",
        name,
        matchName: name,
        cwd,
        machine: ctx.machine,
        tabs: l.tabs.map((tab) => tabPlan(entry, ctx.cwd, tab, cwd, tab.name)),
      };
    }
    case "idle-panes":
      return { type: "run-in-idle-panes", command: l.command };
  }
  throw new Error(`unknown launchable type ${l.type}`);
}

/** A zoxide folder: a space there, left unnamed so Herdr names it after its repo or folder. */
export function zoxideAction(folder, machine) {
  return {
    type: "ensure-space",
    name: null,
    matchName: basename(folder) || folder,
    cwd: folder,
    machine,
    tabs: [{ cwd: folder, panes: [{ cwd: folder }] }],
  };
}

// ----------------------------------------------------------------
// Matching an ensure-space action to a running space
// ----------------------------------------------------------------

/** Where a space is now: its `location` (first terminal's live folder) when known, else its `folder`. */
function whereIs(space) {
  return space.location || space.folder || null;
}

/**
 * The running space an ensure-space action means, on its machine: one named
 * that, else one Herdr calls that (unnamed, after its repo or folder), else
 * one that is in the action's folder. Returns the space or undefined.
 */
export function findMatchingSpace(spaces, { matchName, cwd, machine }) {
  const here = spaces.filter((s) => (s.machine ?? null) === (machine ?? null));
  const folder = cwd ? normalize(cwd) : null;
  return (
    here.find((s) => s.named && s.name === matchName) ??
    here.find((s) => !s.named && s.name === matchName) ??
    (folder ? here.find((s) => whereIs(s) && normalize(whereIs(s)) === folder) : undefined)
  );
}

// ----------------------------------------------------------------
// Rows
// ----------------------------------------------------------------

const ATTENTION = { blocked: 0, done: 1 };

function commandOf(launchable) {
  if (launchable.command) return launchable.command;
  if (launchable.type === "tab") return launchable.panes?.[0]?.command;
  return undefined;
}

/**
 * Builds the picker's rows in display order (the order an empty query shows):
 *
 *   1. tabs that need you (blocked, then finished)
 *   2. configured launchables (project, then global), minus a workspace that
 *      is the focused space
 *   3. the other open tabs
 *   4. running spaces not already represented by a configured workspace
 *   5. new tab, new space here, new space on each connected machine
 *   6. zoxide folders not already a configured workspace's folder
 *
 * Rows: { id, kind, source, title, search, detail, command?, status?, program?, space?, action }
 * Zoxide rows carry `folder` and a null action: zoxideAction(row.folder, machine) when picked.
 */
export function buildRows({ ctx, configEntries = [], spaces = [], agents = [], machines = [], zoxide = [], home = "" }) {
  const focusedSpace = spaces.find((s) => s.id === ctx.space);
  const currentTab = ctx.tab;
  const machineLabel = (m) => (m ? `${m}: ` : "");

  // Configured
  const configured = [];
  const representedSpaces = new Set();
  const configuredFolders = new Set();
  for (const entry of configEntries) {
    const action = compileConfigEntry(entry, ctx);
    if (action.type === "ensure-space") {
      const match = findMatchingSpace(spaces, action);
      if (match) {
        if (match.id === ctx.space) continue; // selecting it would do nothing
        representedSpaces.add(match.id);
      }
      configuredFolders.add(normalize(action.cwd));
    }
    configured.push({
      id: `config:${entry.source}:${entry.name}`,
      kind: entry.launchable.type,
      source: entry.source === "project" ? "project-config" : "global-config",
      title: entry.name,
      search: entry.name,
      detail: entry.source === "project" ? "project" : "global",
      command: commandOf(entry.launchable),
      action,
    });
  }

  // Open tabs
  const attention = [];
  const tabs = [];
  for (const space of spaces) {
    for (const tab of space.tabs ?? []) {
      if (tab.id === currentTab) continue;
      const mine = agents.filter((a) => a.tab === tab.id);
      const who = mine.map((a) => a.program?.name ?? "agent");
      const title = `${machineLabel(space.machine)}${space.name} / ${tab.name}`;
      const row = {
        id: `tab:${tab.id}`,
        kind: "open-tab",
        source: "running",
        title,
        search: who.length ? `${title} ${who.join(" ")}` : title,
        detail: who.join(" · "),
        status: tab.status,
        program: mine[0]?.program ?? null,
        space,
        action: { type: "focus-tab", space: space.id, tab: tab.id },
      };
      (tab.status in ATTENTION ? attention : tabs).push(row);
    }
  }
  attention.sort((a, b) => ATTENTION[a.status] - ATTENTION[b.status]);

  // Running spaces
  const running = spaces
    .filter((s) => s.id !== ctx.space && !representedSpaces.has(s.id))
    .map((space) => {
      const title = `${machineLabel(space.machine)}${space.name}`;
      return {
        id: `space:${space.id}`,
        kind: "open-space",
        source: "running",
        title,
        search: title,
        detail: whereIs(space) ? shortenHome(whereIs(space), space.machine ? "" : home) : "",
        status: space.status,
        space,
        action: { type: "focus-space", space: space.id },
      };
    });

  // New work
  const fresh = [
    { id: "new:tab", kind: "new", source: "new", title: "New tab", search: "New tab", detail: focusedSpace?.name ?? "", action: { type: "new-tab", space: ctx.space } },
    { id: "new:space", kind: "new", source: "new", title: "New space", search: "New space", detail: "this computer", action: { type: "new-space", machine: null } },
    ...machines.map((m) => ({
      id: `new:space:${m}`,
      kind: "new",
      source: "new",
      title: `New space on ${m}`,
      search: `New space on ${m}`,
      detail: m,
      action: { type: "new-space", machine: m },
    })),
  ];

  // Zoxide: the long tail, so kept light; its action is made when picked (zoxideAction).
  const folders = [];
  for (const raw of zoxide) {
    const folder = raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
    if (configuredFolders.has(folder)) continue;
    const title = shortenHome(folder, ctx.home);
    folders.push({ id: `zoxide:${folder}`, kind: "folder", source: "zoxide", title, search: title, detail: ctx.machine ?? "", folder, action: null });
  }

  return [...attention, ...configured, ...tabs, ...running, ...fresh, ...folders];
}
