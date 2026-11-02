// Performs a row's action against Herdr. Everything goes through an injected
// `api`, so the mod (herdr's exec/hc) and the integration test (node's
// child_process) drive the same code:
//
//   api.do(name, args)    `herdr-app do`: resolves with its JSON, rejects on { error }
//   api.hc(args)          `hc`: resolves with { code, stdout, stderr }
//   api.ls()              `herdr-app ls`: { spaces: [{ tabs: [{ terminals: [{ terminal, pane }] }] }] }
//   api.spaces()          SpaceInfo[] (name, named, folder, location?, machine), or a promise of it
//   api.idleTerminals()   addresses of terminals sitting at a shell prompt
//
// Commands: a tab's first pane is a shell Herdr starts, so its command is
// typed in (`hc send`) as the TUI plugin did. Every other pane is split with
// an argv that runs the command through the person's shell and keeps
// `commandMode`. Herdr has no split ratios, so a run of panes in one
// direction is split as a balanced tree: 2 and 4 panes come out even.

import { findMatchingSpace } from "./plan.js";

export const BACKGROUND_LABEL = "launchables.background";

const SHELL = '"${SHELL:-/bin/sh}"';

/** What a tab's root shell gets typed into it for each commandMode. */
export function typedCommand(command, mode = "exit-on-success") {
  switch (mode) {
    case "exit-on-success":
      return `${command} && exit`;
    case "keep-shell":
      return command;
    case "exit-always":
      return `${command}; exit`;
    case "loop":
      return `while true; do ${command}; rc=$?; printf '\\n[launchables] command exited with status %s; restarting in 1s...\\n' "$rc"; sleep 1; done`;
  }
  throw new Error(`unknown commandMode ${mode}`);
}

/**
 * The argv for a split pane: cd to its folder (pane.split has no folder),
 * then the person's login shell, running the command (as $1, so it is never
 * re-quoted) in the way commandMode says. POSIX shells only (bash, zsh, sh).
 *
 * `gated`: wait for Enter before starting (see layoutTab), so a pane whose
 * command ends at once is still there to be split from.
 */
export function splitArgv(cwd, command, mode = "exit-on-success", gated = false) {
  const enter = `cd -- "$1" 2>/dev/null; shift; ${gated ? "read -r _; " : ""}exec ${SHELL} "$@"`;
  if (!command) return ["/bin/sh", "-c", enter, "launchables", cwd, "-li"];
  const body = {
    "exit-on-success": `eval "$1" || exec ${SHELL} -li`,
    "keep-shell": `eval "$1"; exec ${SHELL} -li`,
    "exit-always": `eval "$1"`,
    loop: `while true; do eval "$1"; rc=$?; printf '\\n[launchables] command exited with status %s; restarting in 1s...\\n' "$rc"; sleep 1; done`,
  }[mode];
  if (!body) throw new Error(`unknown commandMode ${mode}`);
  return ["/bin/sh", "-c", enter, "launchables", cwd, "-lic", body, "launchables", command];
}

async function paneOf(api, terminal) {
  // A just-made terminal can take a moment to show up in the window's model.
  for (let attempt = 0; attempt < 20; attempt++) {
    const { spaces = [] } = await api.ls();
    for (const space of spaces) {
      for (const tab of space.tabs ?? []) {
        const hit = (tab.terminals ?? []).find((t) => t.terminal === terminal);
        if (hit?.pane) return hit.pane;
      }
    }
    await api.sleep?.(50);
  }
  throw new Error(`no pane found for terminal ${terminal}`);
}

async function send(api, terminal, text) {
  const r = await api.hc(["send", terminal, text]);
  if (r.code !== 0) throw new Error(`hc send ${terminal}: ${r.stderr || r.stdout}`);
}

async function split(api, fromPane, plan, gated = false) {
  return api.do("pane.split", {
    direction: plan.direction || "right",
    pane: fromPane,
    argv: splitArgv(plan.cwd, plan.command, plan.commandMode, gated),
  });
}

/** Splits `paneId` (which already shows plans[0]) so plans run side by side as evenly as halving allows. */
async function splitBalanced(api, paneId, plans, made) {
  if (plans.length <= 1) return;
  const mid = Math.floor(plans.length / 2);
  const right = await split(api, paneId, plans[mid], true);
  made.push(right);
  await splitBalanced(api, paneId, plans.slice(0, mid), made);
  await splitBalanced(api, right.pane, plans.slice(mid), made);
}

/**
 * Fills a fresh tab whose root shell is `root` ({ pane, terminal }) with the
 * plan's panes. Nothing runs until every pane exists: a command that ends at
 * once (exit-on-success) would close a pane that's still to be split from.
 * So split panes start gated and are let go together, and the root's
 * command is typed last.
 */
async function layoutTab(api, root, tab) {
  const [first, ...rest] = tab.panes;
  const made = [];
  if (rest.length && rest.every((p) => (p.direction || "right") === (rest[0].direction || "right"))) {
    await splitBalanced(api, root.pane, tab.panes, made);
  } else {
    let from = root.pane;
    for (const plan of rest) {
      const pane = await split(api, from, plan, true);
      made.push(pane);
      from = pane.pane;
    }
  }
  await Promise.all(made.map((pane) => send(api, pane.terminal, "")));
  if (first?.command) await send(api, root.terminal, typedCommand(first.command, first.commandMode));
  if (rest.length) await api.do("pane.focus", { pane: root.pane });
}

async function newTab(api, space, tab) {
  const made = await api.do("tab.new", { space, name: tab.label, folder: tab.cwd });
  await layoutTab(api, { pane: await paneOf(api, made.terminal), terminal: made.terminal }, tab);
  return made;
}

async function ensureSpace(api, action) {
  const existing = findMatchingSpace(await api.spaces(), action);
  if (existing) {
    await api.do("space.select", { id: existing.id });
    return { space: existing.id, existed: true };
  }

  const [first, ...others] = action.tabs;
  const made = await api.do("space.new", {
    name: action.name || undefined,
    folder: first.cwd || action.cwd,
    tab: first.label,
    machine: action.machine || undefined,
  });
  await layoutTab(api, { pane: await paneOf(api, made.terminal), terminal: made.terminal }, first);
  for (const tab of others) await newTab(api, made.space, tab);
  if (others.length) await api.do("tab.select", { id: made.tab });
  return { space: made.space, existed: false };
}

async function runBackground(api, action) {
  const args = ["run", "--bg", "--json", "--no-parent", "--cwd", action.cwd, "--label", `${BACKGROUND_LABEL}=${action.logName}`];
  if (action.machine) args.push("--on", action.machine);
  args.push("--", "/bin/sh", "-c", `exec ${SHELL} -lc "$1"`, "launchables", action.command);
  const r = await api.hc(args);
  if (r.code !== 0) throw new Error(`hc run: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout || "{}");
}

/** Runs one action. Resolves with what it made (ids), for tests and logs. */
export async function execute(api, action) {
  switch (action.type) {
    case "split-pane": {
      if (!action.fromPane) throw new Error("no focused pane to split from");
      const made = await split(api, action.fromPane, action.pane);
      await api.do("pane.focus", { pane: made.pane });
      return made;
    }
    case "create-tab": {
      const made = await newTab(api, action.space, action.tab);
      await api.do("tab.select", { id: made.tab });
      return made;
    }
    case "ensure-space":
      return ensureSpace(api, action);
    case "focus-space":
      return api.do("space.select", { id: action.space });
    case "focus-tab":
      await api.do("space.select", { id: action.space });
      return api.do("tab.select", { id: action.tab });
    case "new-tab":
      return api.do("tab.new", { space: action.space || undefined });
    case "new-space":
      return api.do("space.new", { machine: action.machine || undefined });
    case "run-background":
      return runBackground(api, action);
    case "run-in-idle-panes": {
      const terminals = await api.idleTerminals();
      for (const terminal of terminals) await send(api, terminal, action.command);
      return { terminals };
    }
  }
  throw new Error(`unknown action ${action.type}`);
}
