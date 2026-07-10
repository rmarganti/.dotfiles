import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverZoxideDirectories } from './zoxide.ts';

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

function withPath<T>(value: string, callback: () => T): T {
    const previous = process.env.PATH;
    process.env.PATH = value;
    try {
        return callback();
    } finally {
        if (previous === undefined) delete process.env.PATH;
        else process.env.PATH = previous;
    }
}

function fakeZoxide(binDir: string, body: string): void {
    const executable = path.join(binDir, 'zoxide');
    fs.writeFileSync(executable, `#!/bin/sh\n${body}\n`);
    fs.chmodSync(executable, 0o755);
}

test('returns available directories in zoxide order', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-zoxide-'));
    try {
        const binDir = path.join(root, 'bin');
        const first = path.join(root, 'first project');
        const second = path.join(root, 'second');
        fs.mkdirSync(binDir);
        fs.mkdirSync(first);
        fs.mkdirSync(second);
        fakeZoxide(
            binDir,
            `printf '%s\\n' ${shellQuote(first)} relative/path ${shellQuote(path.join(root, 'missing'))} ${shellQuote(second)}`
        );

        const directories = withPath(binDir, discoverZoxideDirectories);
        assert.deepEqual(directories, [{ path: first }, { path: second }]);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('degrades silently when zoxide is unavailable or fails', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-zoxide-'));
    try {
        assert.deepEqual(withPath(root, discoverZoxideDirectories), []);

        fakeZoxide(root, 'exit 1');
        assert.deepEqual(withPath(root, discoverZoxideDirectories), []);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
