import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function stateDir(): string {
    return process.env.HERDR_PLUGIN_STATE_DIR || os.tmpdir();
}

export function ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
}

export function pluginLogFile(): string {
    const filePath = path.join(stateDir(), 'launchables.log');
    ensureDir(path.dirname(filePath));
    return filePath;
}

export function appendLog(message: string): void {
    fs.appendFileSync(
        pluginLogFile(),
        `[${new Date().toISOString()}] ${message}\n`
    );
}

export function backgroundLogFile(name: string): string {
    const safeName =
        name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') ||
        'launchable';
    const filePath = path.join(stateDir(), 'background', `${safeName}.log`);
    ensureDir(path.dirname(filePath));
    return filePath;
}
