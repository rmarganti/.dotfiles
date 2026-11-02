// `.launchables.json` parsing and validation. The schema is shared with the
// Herdr TUI plugin (dots/.config/herdr/local-plugins/herdr-launchables), so
// keep the two validators in step.

import { dirname } from "./path.js";

export const PROJECT_CONFIG_NAME = ".launchables.json";
export const GLOBAL_CONFIG_PATH = ".config/.launchables.json"; // relative to the machine's home

const COMMAND_MODES = ["exit-on-success", "keep-shell", "exit-always", "loop"];

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(pathName, candidate, field, errors) {
  if (candidate[field] === undefined) return undefined;
  if (!isNonEmptyString(candidate[field])) {
    errors.push(`${pathName}: ${field} must be a non-empty string when provided`);
    return undefined;
  }
  return candidate[field];
}

function forbid(pathName, candidate, fields, errors, owner) {
  for (const [field, message] of fields) {
    if (candidate[field] !== undefined) errors.push(`${pathName}: ${message ?? `${owner} must not define ${field}`}`);
  }
}

function validatePane(pathName, value, { rootInTab = false } = {}) {
  const errors = [];
  if (!isObject(value)) return { launchable: null, errors: [`${pathName}: expected pane object`] };

  if (value.type !== "pane") errors.push(`${pathName}: type must be "pane"`);
  const name = optionalString(pathName, value, "name", errors);
  const cwd = optionalString(pathName, value, "cwd", errors);

  let direction;
  if (value.direction !== undefined) {
    if (value.direction === "right" || value.direction === "down") direction = value.direction;
    else errors.push(`${pathName}: pane.direction must be right or down`);
  }

  let commandMode;
  if (value.commandMode !== undefined) {
    if (COMMAND_MODES.includes(value.commandMode)) commandMode = value.commandMode;
    else errors.push(`${pathName}: pane.commandMode must be exit-on-success, keep-shell, exit-always, or loop`);
  }

  if (value.command !== undefined && !isNonEmptyString(value.command)) {
    errors.push(`${pathName}: pane.command must be a non-empty string when provided`);
  }
  if (value.commandMode !== undefined && value.command === undefined) {
    errors.push(`${pathName}: pane.commandMode requires pane.command`);
  }
  if (rootInTab && value.direction !== undefined) {
    errors.push(`${pathName}: first/root pane in a tab must not define direction`);
  }
  forbid(pathName, value, [["commands"], ["tabs"]], errors, "pane");

  if (errors.length) return { launchable: null, errors };
  return {
    launchable: {
      type: "pane",
      ...(name ? { name } : {}),
      ...(isNonEmptyString(value.command) ? { command: value.command } : {}),
      ...(commandMode ? { commandMode } : {}),
      ...(cwd ? { cwd } : {}),
      ...(direction ? { direction } : {}),
    },
    errors,
  };
}

function validateTab(pathName, value) {
  const errors = [];
  if (!isObject(value)) return { launchable: null, errors: [`${pathName}: expected tab object`] };

  if (value.type !== "tab") errors.push(`${pathName}: type must be "tab"`);
  const name = optionalString(pathName, value, "name", errors);
  const cwd = optionalString(pathName, value, "cwd", errors);
  forbid(pathName, value, [
    ["command", "tab.command is no longer supported; use tab.panes"],
    ["commands", "tab.commands is no longer supported; use tab.panes"],
    ["commandMode", "tab must not define commandMode; set it on panes"],
    ["direction"],
  ], errors, "tab");

  let panes;
  if (value.panes !== undefined) {
    if (!Array.isArray(value.panes) || value.panes.length === 0) {
      errors.push(`${pathName}: tab.panes must be a non-empty array when provided`);
    } else {
      panes = [];
      value.panes.forEach((pane, index) => {
        const result = validatePane(`${pathName}.panes[${index}]`, pane, { rootInTab: index === 0 });
        if (result.launchable) panes.push(result.launchable);
        errors.push(...result.errors);
      });
    }
  }

  if (errors.length) return { launchable: null, errors };
  return {
    launchable: { type: "tab", ...(name ? { name } : {}), ...(cwd ? { cwd } : {}), ...(panes ? { panes } : {}) },
    errors,
  };
}

function validateWorkspace(pathName, value) {
  const errors = [];
  if (value.type !== "workspace") errors.push(`${pathName}: type must be "workspace"`);
  const name = optionalString(pathName, value, "name", errors);
  const cwd = optionalString(pathName, value, "cwd", errors);
  forbid(pathName, value, [
    ["command"],
    ["commands"],
    ["commandMode", "workspace must not define commandMode; set it on panes"],
    ["direction"],
  ], errors, "workspace");

  const tabs = [];
  if (!Array.isArray(value.tabs) || value.tabs.length === 0) {
    errors.push(`${pathName}: workspace.tabs must be a non-empty array`);
  } else {
    value.tabs.forEach((tab, index) => {
      const result = validateTab(`${pathName}.tabs[${index}]`, tab);
      if (result.launchable) tabs.push(result.launchable);
      errors.push(...result.errors);
    });
  }

  if (errors.length) return { launchable: null, errors };
  return { launchable: { type: "workspace", ...(name ? { name } : {}), ...(cwd ? { cwd } : {}), tabs }, errors };
}

function validateCommandOnly(name, value, type, { allowCwd }) {
  const errors = [];
  const cwd = allowCwd ? optionalString(name, value, "cwd", errors) : undefined;
  if (!isNonEmptyString(value.command)) errors.push(`${name}: ${type}.command must be a non-empty string`);
  forbid(name, value, [
    ["name"],
    ...(allowCwd ? [] : [["cwd"]]),
    ["commands"],
    ["commandMode"],
    ["direction"],
    ["panes"],
    ["tabs"],
  ], errors, type);
  if (errors.length) return { launchable: null, errors };
  return { launchable: { type, command: value.command, ...(cwd ? { cwd } : {}) }, errors };
}

/** Validates one top-level entry: `{ launchable, errors }`, launchable null when invalid. */
export function validateLaunchable(name, value) {
  if (!isObject(value)) return { launchable: null, errors: [`${name}: expected object`] };

  const type = value.type;
  if (!isNonEmptyString(type)) return { launchable: null, errors: [`${name}: missing string type`] };
  if (type === "background") return validateCommandOnly(name, value, "background", { allowCwd: true });
  if (type === "idle-panes") return validateCommandOnly(name, value, "idle-panes", { allowCwd: false });
  if (type === "split") return { launchable: null, errors: [`${name}: type "split" is unsupported; use type "pane"`] };
  if (type === "pane") return validatePane(name, value);
  if (type === "tab") return validateTab(name, value);
  if (type === "workspace") return validateWorkspace(name, value);
  return { launchable: null, errors: [`${name}: unsupported type ${JSON.stringify(type)}`] };
}

/**
 * Parses a `.launchables.json`'s text. `configDir` is the folder project
 * entries resolve relative `cwd`s against (normally the file's own folder).
 * Returns `{ entries, errors }`; invalid entries are left out and explained.
 */
export function parseLaunchablesFile(text, { path, source, configDir = dirname(path) }) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { entries: [], errors: [`${path}: ${error.message}`] };
  }
  if (!isObject(parsed)) return { entries: [], errors: [`${path}: expected a top-level object`] };

  const entries = [];
  const errors = [];
  for (const [name, value] of Object.entries(parsed)) {
    const result = validateLaunchable(name, value);
    if (result.launchable) entries.push({ name, source, configPath: path, configDir, launchable: result.launchable });
    errors.push(...result.errors.map((error) => `${path}: ${error}`));
  }
  return { entries, errors };
}

/** Project entries override global ones by key; project first, then by name. */
export function mergeConfigEntries(globalEntries, projectEntries) {
  const merged = new Map();
  for (const entry of globalEntries) merged.set(entry.name, entry);
  for (const entry of projectEntries) merged.set(entry.name, entry);
  return [...merged.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "project" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
