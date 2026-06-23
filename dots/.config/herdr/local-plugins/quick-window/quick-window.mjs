#!/usr/bin/env node
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ID = 'dots.quick-window';
const CONFIG_FILE = path.join(os.homedir(), '.config/tmux/quick-window.json');
const HERDR_BIN = process.env.HERDR_BIN_PATH || 'herdr';
const PLUGIN_ROOT = process.env.HERDR_PLUGIN_ROOT || path.dirname(fileURLToPath(import.meta.url));
const OVERLAY_CLOSE_TIMEOUT_MS = 5000;
const OVERLAY_CLOSE_POLL_MS = 50;

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const context = parseJson(process.env.HERDR_PLUGIN_CONTEXT_JSON, {});

function contextValue(...keys) {
  for (const key of keys) {
    const value = process.env[key] ?? context[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function herdr(args, options = {}) {
  const result = spawnSync(HERDR_BIN, args, {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = result.stderr || '';
    const stdout = result.stdout || '';
    throw new Error(`herdr ${args.join(' ')} failed (${result.status})\n${stderr}${stdout}`);
  }
  return result.stdout || '';
}

function herdrJson(args) {
  return parseJson(herdr(args), null);
}

function focusedPaneCwd(paneId) {
  if (!paneId) return '';
  try {
    const data = herdrJson(['pane', 'current', '--pane', paneId]);
    return data?.result?.pane?.cwd || data?.result?.pane?.foreground_cwd || '';
  } catch {
    return '';
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function findWorkPath(config, cwd) {
  let current = path.resolve(cwd);
  while (current && current !== path.dirname(current)) {
    if (Object.prototype.hasOwnProperty.call(config, current)) return current;
    current = path.dirname(current);
  }
  return '';
}

function layoutsFor(config, workPath) {
  const entry = config?.[workPath];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
  return Object.keys(entry).sort((a, b) => a.localeCompare(b));
}

function selectLayout(layouts) {
  if (layouts.length === 0) return '';
  if (layouts.length === 1) return layouts[0];

  const input = `${layouts.join('\n')}\n`;
  const fzf = spawnSync('fzf', ['--no-sort', '--ansi', '--border-label', ' quick-window ', '--prompt', '⚡  '], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  if (!fzf.error && fzf.status === 0) return (fzf.stdout || '').trim();
  if (!fzf.error) return '';

  process.stderr.write('quick-window layouts:\n');
  layouts.forEach((layout, index) => process.stderr.write(`  ${index + 1}) ${layout}\n`));
  process.stderr.write('Choose layout: ');
  const choice = fs.readFileSync(0, 'utf8').trim();
  const index = Number.parseInt(choice, 10) - 1;
  return Number.isInteger(index) && index >= 0 && index < layouts.length ? layouts[index] : '';
}

function logFile() {
  return path.join(process.env.HERDR_PLUGIN_STATE_DIR || os.tmpdir(), 'quick-window.log');
}

function detachApply(workspaceId, workPath, layout, pickerPaneId) {
  const file = logFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const out = fs.openSync(file, 'a');
  const args = [path.join(PLUGIN_ROOT, 'quick-window.mjs'), 'apply', workspaceId, workPath, layout];
  if (pickerPaneId) args.push(pickerPaneId);
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: ['ignore', out, out],
    env: process.env,
  });
  child.unref();
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPaneGone(paneId, timeoutMs = OVERLAY_CLOSE_TIMEOUT_MS) {
  if (!paneId) return;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = spawnSync(HERDR_BIN, ['pane', 'get', paneId], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error || result.status !== 0) return;
    await sleep(OVERLAY_CLOSE_POLL_MS);
  }
}

async function cmdOpen() {
  let workspaceId = contextValue('HERDR_WORKSPACE_ID', 'workspace_id');
  const paneId = contextValue('HERDR_PANE_ID', 'focused_pane_id');
  let cwd = contextValue('focused_pane_cwd', 'pane_cwd', 'workspace_cwd');
  if (!cwd) cwd = focusedPaneCwd(paneId);

  const args = [
    'plugin', 'pane', 'open',
    '--plugin', PLUGIN_ID,
    '--entrypoint', 'picker',
    '--placement', 'overlay',
    '--focus',
  ];

  // Herdr overlay plugin panes implicitly target the active pane; passing
  // --target-pane is rejected. Forward source context via environment instead.
  if (workspaceId) args.push('--env', `QUICK_WINDOW_WORKSPACE_ID=${workspaceId}`);
  if (paneId) args.push('--env', `QUICK_WINDOW_SOURCE_PANE_ID=${paneId}`);
  if (cwd) args.push('--env', `QUICK_WINDOW_CWD=${cwd}`);

  herdr(args, { stdio: 'inherit' });
}

async function cmdPicker() {
  const config = loadConfig();
  if (!config) return;

  const cwd = process.env.QUICK_WINDOW_CWD || contextValue('focused_pane_cwd', 'pane_cwd', 'workspace_cwd');
  if (!cwd) return;

  const workPath = findWorkPath(config, cwd);
  if (!workPath) return;

  const layout = selectLayout(layoutsFor(config, workPath));
  if (!layout) return;

  const workspaceId = process.env.QUICK_WINDOW_WORKSPACE_ID || contextValue('workspace_id');
  if (!workspaceId) return;

  const pickerPaneId = contextValue('HERDR_PANE_ID', 'pane_id');
  detachApply(workspaceId, workPath, layout, pickerPaneId);
}

async function cmdApply(workspaceId, workPath, layout, pickerPaneId) {
  if (!workspaceId || !workPath || !layout) {
    process.stderr.write('usage: quick-window.mjs apply <workspace-id> <work-path> <layout> [picker-pane-id]\n');
    process.exitCode = 2;
    return;
  }

  await waitForPaneGone(pickerPaneId);

  const config = loadConfig();
  const commands = config?.[workPath]?.[layout];
  if (!Array.isArray(commands)) return;

  const tab = herdrJson(['tab', 'create', '--workspace', workspaceId, '--cwd', workPath, '--label', layout, '--focus']);
  const tabId = tab?.result?.tab?.tab_id;
  let currentPane = tab?.result?.root_pane?.pane_id;
  if (!tabId || !currentPane) throw new Error(`quick-window: failed to read new tab ids: ${JSON.stringify(tab)}`);

  let index = 0;
  for (const command of commands) {
    if (!command) continue;

    if (index === 0) {
      herdr(['pane', 'run', currentPane, command]);
    } else {
      const split = herdrJson(['pane', 'split', currentPane, '--direction', 'right', '--cwd', workPath, '--no-focus']);
      currentPane = split?.result?.pane?.pane_id;
      if (!currentPane) throw new Error(`quick-window: failed to read split pane id: ${JSON.stringify(split)}`);
      herdr(['pane', 'run', currentPane, command]);
    }

    index += 1;
  }

  // Overlay teardown can restore the previous focus after layout creation. Assert
  // the intended destination once the layout exists so the new quick-window tab
  // wins without relying on a fixed sleep.
  herdr(['workspace', 'focus', workspaceId]);
  herdr(['tab', 'focus', tabId]);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'open') return cmdOpen();
  if (command === 'picker') return cmdPicker();
  if (command === 'apply') return cmdApply(args[0], args[1], args[2], args[3]);

  process.stderr.write('usage: quick-window.mjs <open|picker|apply>\n');
  process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message || error}\n`);
  process.exit(1);
});
