#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERDR_BIN = process.env.HERDR_BIN_PATH || 'herdr';
const STATE_PATH = path.join(process.env.HERDR_PLUGIN_STATE_DIR || os.tmpdir(), 'last-workspace-title');

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function herdr(args) {
  const result = spawnSync(HERDR_BIN, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${HERDR_BIN} ${args.join(' ')} failed: ${result.stderr || result.stdout}`.trim());
  }

  return (result.stdout || '').trim();
}

function herdrJson(args) {
  return parseJson(herdr(args), null);
}

function clean(value) {
  return String(value ?? '')
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contextWorkspaceId() {
  const context = parseJson(process.env.HERDR_PLUGIN_CONTEXT_JSON, {});
  return clean(process.env.HERDR_WORKSPACE_ID || context?.workspace_id);
}

function currentWorkspace() {
  const workspaceId = contextWorkspaceId();
  if (workspaceId) {
    return herdrJson(['workspace', 'get', workspaceId])?.result?.workspace || null;
  }

  const pane = herdrJson(['pane', 'current'])?.result?.pane;
  if (!pane?.workspace_id) return null;
  return herdrJson(['workspace', 'get', pane.workspace_id])?.result?.workspace || null;
}

function workspaceTitle(workspace) {
  if (!workspace) return 'herdr';

  const number = workspace.number != null ? String(workspace.number) : '';
  const label = clean(workspace.label);
  return label && label !== number ? label : number || 'herdr';
}

function lastTitle() {
  try {
    return fs.readFileSync(STATE_PATH, 'utf8').trim();
  } catch {
    return '';
  }
}

function saveTitle(title) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, `${title}\n`);
}

function main() {
  const title = workspaceTitle(currentWorkspace());
  if (title !== lastTitle()) {
    herdr(['terminal', 'title', 'set', title]);
    saveTitle(title);
  }
  process.stdout.write(`${title}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
