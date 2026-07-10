import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

import type {
    Launchable,
    LaunchableKind,
    LaunchableSource,
} from './types.ts';

const RESET = '\x1b[0m';
const BLACK = '\x1b[30m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';

const KIND_ICONS: Record<LaunchableKind, string> = {
    workspace: '󰉋',
    tab: '󰓩',
    pane: '',
    background: '󰒲',
    'idle-panes': '󰌘',
};

const SOURCE_COLORS: Record<LaunchableSource, string> = {
    'global-config': CYAN,
    'project-config': YELLOW,
    'running-workspace': BLUE,
    zoxide: GREEN,
};

function displayIcon(kind: LaunchableKind, source: LaunchableSource): string {
    return `${SOURCE_COLORS[source]}${KIND_ICONS[kind]}${RESET}`;
}

function displayLine(launchable: Launchable, index: number): string {
    const source = `${BLACK}[${launchable.source}]${RESET}`;
    const kind = `${BLACK}[${launchable.kind}]${RESET}`;
    return `${index}\t${displayIcon(launchable.kind, launchable.source)} ${launchable.title} ${source} ${kind}`;
}

export function selectLaunchable(launchables: Launchable[]): Launchable | null {
    if (launchables.length === 0) return null;
    if (launchables.length === 1) return launchables[0] || null;

    const input = `${launchables.map((launchable, index) => displayLine(launchable, index)).join('\n')}\n`;
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
        return Number.isInteger(index) ? launchables[index] || null : null;
    }

    if (!fzf.error) return null;

    process.stderr.write('launchables:\n');
    launchables.forEach((launchable, index) =>
        process.stderr.write(
            `  ${index + 1}) ${launchable.title} [${launchable.source}] [${launchable.kind}]\n`
        )
    );
    process.stderr.write('Choose launchable: ');
    const choice = fs.readFileSync(0, 'utf8').trim();
    const index = Number.parseInt(choice, 10) - 1;
    return Number.isInteger(index) && index >= 0 && index < launchables.length
        ? launchables[index] || null
        : null;
}
