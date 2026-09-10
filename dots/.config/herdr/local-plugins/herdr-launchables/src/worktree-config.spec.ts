import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    copyPrimaryWorktreeConfig,
    primaryWorktreeFromPorcelain,
    worktreePathFromEnvironment,
} from './worktree-config.ts';

test('resolves the created worktree from the Herdr event envelope', () => {
    const env = {
        HERDR_PLUGIN_EVENT_JSON: JSON.stringify({
            event: 'worktree_created',
            data: { worktree: { path: '/worktrees/feature' } },
        }),
    };

    assert.equal(worktreePathFromEnvironment(env), '/worktrees/feature');
});

test('falls back to the event plugin context checkout', () => {
    const env = {
        HERDR_PLUGIN_CONTEXT_JSON: JSON.stringify({
            worktree: { checkout_path: '/worktrees/feature' },
        }),
    };

    assert.equal(worktreePathFromEnvironment(env), '/worktrees/feature');
});

test('reads the primary worktree from null-delimited porcelain output', () => {
    const output =
        'worktree /code/project with spaces\0HEAD abc\0branch refs/heads/main\0\0' +
        'worktree /worktrees/feature\0HEAD def\0branch refs/heads/feature\0\0';

    assert.equal(
        primaryWorktreeFromPorcelain(output),
        '/code/project with spaces'
    );
});

test('copies .launchables.json from the primary worktree', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'launchables-worktree-'));
    const primary = path.join(root, 'primary');
    const worktree = path.join(root, 'feature');
    fs.mkdirSync(primary);
    fs.mkdirSync(worktree);
    fs.writeFileSync(path.join(primary, '.launchables.json'), '{"source":true}\n');

    try {
        const result = copyPrimaryWorktreeConfig(worktree, () => primary);
        assert.equal(result.status, 'copied');
        assert.equal(
            fs.readFileSync(path.join(worktree, '.launchables.json'), 'utf8'),
            '{"source":true}\n'
        );
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('does nothing when the primary worktree has no config', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'launchables-worktree-'));
    const primary = path.join(root, 'primary');
    const worktree = path.join(root, 'feature');
    fs.mkdirSync(primary);
    fs.mkdirSync(worktree);

    try {
        assert.deepEqual(copyPrimaryWorktreeConfig(worktree, () => primary), {
            status: 'source-missing',
            source: path.join(primary, '.launchables.json'),
        });
        assert.equal(fs.existsSync(path.join(worktree, '.launchables.json')), false);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
