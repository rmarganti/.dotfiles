#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const HERDR_BIN = process.env.HERDR_BIN_PATH || 'herdr';
const SHELL_NAMES = new Set(['bash', 'sh', 'zsh', 'fish']);

function herdr(args) {
  const result = spawnSync(HERDR_BIN, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`herdr ${args.join(' ')} failed (${result.status})\n${result.stderr || ''}${result.stdout || ''}`);
  }

  return result.stdout || '';
}

function herdrJson(args) {
  return JSON.parse(herdr(args));
}

function idlePaneIds() {
  const panes = herdrJson(['pane', 'list']).result?.panes || [];
  const ids = [];

  for (const pane of panes) {
    const processInfo = herdrJson(['pane', 'process-info', '--pane', pane.pane_id]).result?.process_info;
    const foreground = processInfo?.foreground_processes?.[0];
    const name = foreground?.name || foreground?.argv0 || '';
    if (SHELL_NAMES.has(name)) ids.push(pane.pane_id);
  }

  return ids;
}

function runInIdlePanes(command) {
  const panes = idlePaneIds();
  for (const paneId of panes) {
    herdr(['pane', 'run', paneId, command]);
  }
}

function killProcesses() {
  spawnSync('bash', ['-lc', 'killall nvim node opencode php 2>/dev/null || true'], {
    stdio: 'ignore',
  });
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'clear-all-terminals':
      runInIdlePanes('clear');
      return;
    case 'refresh-bash-env':
      runInIdlePanes('source ~/.bash_profile');
      return;
    case 'kill-processes':
      killProcesses();
      return;
    default:
      process.stderr.write('usage: global-launchables.mjs <clear-all-terminals|refresh-bash-env|kill-processes>\n');
      process.exit(2);
  }
}

main();
