import os from 'node:os';
import path from 'node:path';

export const PLUGIN_ID = 'dots.herdr-launchables';
export const HERDR_BIN = process.env.HERDR_BIN_PATH || 'herdr';

export const OVERLAY_CLOSE_TIMEOUT_MS = 5000;
export const OVERLAY_CLOSE_POLL_MS = 50;

export const GLOBAL_CONFIG_PATH = path.join(
    os.homedir(),
    '.config/.launchables.json'
);
export const PROJECT_CONFIG_NAME = '.launchables.json';

export const IDLE_SHELL_NAMES = new Set(['bash', 'sh', 'zsh', 'fish']);
