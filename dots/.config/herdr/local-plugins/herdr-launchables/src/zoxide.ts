import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** A ranked, currently available directory discovered through zoxide. */
export interface ZoxideDirectory {
    path: string;
}

/**
 * Returns directories in zoxide's ranking order.
 *
 * Zoxide is an optional discovery source: absence, command failures, empty
 * output, and invalid entries all degrade silently to fewer launchables.
 */
export function discoverZoxideDirectories(): ZoxideDirectory[] {
    const result = spawnSync('zoxide', ['query', '--list'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    });

    if (result.error || result.status !== 0) return [];

    const directories: ZoxideDirectory[] = [];
    for (const line of (result.stdout || '').split(/\r?\n/)) {
        const candidate = line.trim();
        if (!candidate || !path.isAbsolute(candidate) || !isDirectory(candidate))
            continue;
        directories.push({ path: path.normalize(candidate) });
    }
    return directories;
}

function isDirectory(candidate: string): boolean {
    try {
        return fs.statSync(candidate).isDirectory();
    } catch {
        return false;
    }
}
