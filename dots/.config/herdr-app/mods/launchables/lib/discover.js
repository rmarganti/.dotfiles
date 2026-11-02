// Reads what the picker offers from the focused space's machine: the global
// and nearest project `.launchables.json`, and zoxide's folders. Machine
// access goes through an injected `io` (herdr's in the mod, node's in tests):
//
//   io.readTextFile(path, { on })   text, or null when absent
//   io.exec(cmd, args, { cwd, on }) { code, stdout, stderr }; rejects if it can't start
//   io.home(machine)                that machine's home folder
//
// `on` is the machine (null: this computer). Nothing here throws for a
// missing file, program or machine; those just offer less.

import { GLOBAL_CONFIG_PATH, PROJECT_CONFIG_NAME, mergeConfigEntries, parseLaunchablesFile } from "./config.js";
import { dirname, join, normalize } from "./path.js";

async function tryExec(io, cmd, args, options) {
  try {
    return await io.exec(cmd, args, options);
  } catch {
    return null;
  }
}

async function tryRead(io, path, on) {
  try {
    return await io.readTextFile(path, { on });
  } catch {
    return null;
  }
}

/** The nearest `.launchables.json` at or above `cwd`: `{ path, text }` or null. */
async function nearestProjectConfig(io, cwd, on) {
  let dir = normalize(cwd);
  for (;;) {
    const path = join(dir, PROJECT_CONFIG_NAME);
    const text = await tryRead(io, path, on);
    if (text !== null) return { path, text };
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * A linked git worktree without its own config borrows the primary
 * checkout's (the file is usually untracked). Its relative folders resolve
 * against this worktree's root, as if the file had been copied here, which
 * is what the TUI plugin does on `worktree.created`.
 */
async function primaryWorktreeConfig(io, cwd, on) {
  const top = await tryExec(io, "git", ["-C", cwd, "rev-parse", "--show-toplevel"], { on });
  if (!top || top.code !== 0) return null;
  const root = top.stdout.trim();
  const list = await tryExec(io, "git", ["-C", cwd, "worktree", "list", "--porcelain", "-z"], { on });
  if (!list || list.code !== 0) return null;
  const firstField = list.stdout.split("\0", 1)[0] ?? "";
  if (!firstField.startsWith("worktree ")) return null;
  const primary = firstField.slice("worktree ".length);
  if (normalize(primary) === normalize(root)) return null;
  const path = join(primary, PROJECT_CONFIG_NAME);
  const text = await tryRead(io, path, on);
  return text === null ? null : { path, text, configDir: root };
}

/** Configured launchables for `cwd` on `machine`: `{ entries, errors }`. */
export async function discoverConfig(io, { cwd, machine, home }) {
  const errors = [];
  let globalEntries = [];
  const globalPath = join(home, GLOBAL_CONFIG_PATH);
  const globalText = await tryRead(io, globalPath, machine);
  if (globalText !== null) {
    const parsed = parseLaunchablesFile(globalText, { path: globalPath, source: "global" });
    globalEntries = parsed.entries;
    errors.push(...parsed.errors);
  }

  let projectEntries = [];
  if (cwd) {
    let project = await nearestProjectConfig(io, cwd, machine);
    // The global file lives under home too; walking up from inside home finds it.
    if (project && normalize(project.path) === normalize(globalPath)) project = null;
    project ??= await primaryWorktreeConfig(io, cwd, machine);
    if (project) {
      const parsed = parseLaunchablesFile(project.text, { path: project.path, source: "project", configDir: project.configDir });
      projectEntries = parsed.entries;
      errors.push(...parsed.errors);
    }
  }

  return { entries: mergeConfigEntries(globalEntries, projectEntries), errors };
}

// Existing folders in zoxide's rank order; one round trip, run on that machine.
const ZOXIDE_SCRIPT = 'zoxide query --list 2>/dev/null | while IFS= read -r d; do [ -d "$d" ] && printf "%s\\n" "$d"; done';

/** zoxide's ranked folders on `machine`, or [] when zoxide isn't there. */
export async function discoverZoxide(io, { machine }) {
  const r = await tryExec(io, "/bin/sh", ["-c", ZOXIDE_SCRIPT], { on: machine });
  if (!r || r.code !== 0) return [];
  return r.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("/"));
}
