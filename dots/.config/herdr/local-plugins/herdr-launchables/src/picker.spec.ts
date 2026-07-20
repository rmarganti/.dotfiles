import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { selectLaunchable } from './picker.ts';
import type { Launchable } from './types.ts';

function launchable(title: string, source: Launchable['source']): Launchable {
    return {
        id: `${source}:${title}`,
        title,
        source,
        kind: 'background',
        action: {
            type: 'run-background',
            command: 'true',
            cwd: '/',
            logName: title,
        },
    };
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

function fakeFzf(binDir: string, body: string): void {
    const executable = path.join(binDir, 'fzf');
    fs.writeFileSync(executable, `#!/bin/sh\n${body}\n`);
    fs.chmodSync(executable, 0o755);
}

test('searches only titles, displays metadata, and preserves input order for ties', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-picker-'));
    try {
        const binDir = path.join(root, 'bin');
        const argsPath = path.join(root, 'args');
        const inputPath = path.join(root, 'input');
        fs.mkdirSync(binDir);
        fakeFzf(
            binDir,
            `printf '%s\\n' "$@" > "${argsPath}"
while IFS= read -r line; do printf '%s\\n' "$line" >> "${inputPath}"; second="$line"; done
printf '%s\\n' "$second"`
        );

        const items = [
            launchable('Configured task', 'project-config'),
            launchable('Target directory', 'zoxide'),
        ];
        const selected = withPath(binDir, () => selectLaunchable(items));

        assert.equal(selected, items[1]);
        const args = fs.readFileSync(argsPath, 'utf8').trim().split('\n');
        assert.deepEqual(args.slice(0, 8), [
            '--delimiter', '\t', '--with-nth', '{2} {3}', '--nth', '1',
            '--tiebreak', 'length,index',
        ]);
        assert.equal(args.includes('--no-sort'), false);

        const rows = fs.readFileSync(inputPath, 'utf8').trim().split('\n');
        const firstFields = rows[0]!.split('\t');
        assert.equal(firstFields[1], 'Configured task');
        assert.doesNotMatch(firstFields[2]!, /Configured task/);
        assert.match(firstFields[2]!, /project-config/);
        assert.doesNotMatch(firstFields[1]!, /project-config|background|^0$/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('returns null when fzf is cancelled', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-picker-'));
    try {
        fakeFzf(root, 'exit 130');
        const items = [
            launchable('First', 'global-config'),
            launchable('Second', 'zoxide'),
        ];
        assert.equal(withPath(root, () => selectLaunchable(items)), null);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
