import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

import type { ResolvedLaunchable } from './types.ts';

function displayLine(item: ResolvedLaunchable, index: number): string {
    return `${index}\t${item.name} [${item.source}] [${item.launchable.type}]`;
}

export function selectLaunchable(
    items: ResolvedLaunchable[]
): ResolvedLaunchable | null {
    if (items.length === 0) return null;
    if (items.length === 1) return items[0] || null;

    const input = `${items.map((item, index) => displayLine(item, index)).join('\n')}\n`;
    const fzf = spawnSync(
        'fzf',
        [
            '--delimiter',
            '\t',
            '--with-nth',
            '2..',
            '--no-sort',
            '--ansi',
            '--border-label',
            ' launchables ',
            '--prompt',
            '🚀  ',
        ],
        {
            input,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'inherit'],
        }
    );

    if (!fzf.error && fzf.status === 0) {
        const selected = (fzf.stdout || '').trim();
        const indexText = selected.split('\t', 1)[0] || '';
        const index = Number.parseInt(indexText, 10);
        return Number.isInteger(index) ? items[index] || null : null;
    }

    if (!fzf.error) return null;

    process.stderr.write('launchables:\n');
    items.forEach((item, index) =>
        process.stderr.write(
            `  ${index + 1}) ${item.name} [${item.source}] [${item.launchable.type}]\n`
        )
    );
    process.stderr.write('Choose launchable: ');
    const choice = fs.readFileSync(0, 'utf8').trim();
    const index = Number.parseInt(choice, 10) - 1;
    return Number.isInteger(index) && index >= 0 && index < items.length
        ? items[index] || null
        : null;
}
