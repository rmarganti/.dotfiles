import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

import type {
    Launchable,
    LaunchableSource,
    LaunchableType,
    ResolvedLaunchable,
} from './types.ts';

const RESET = '\x1b[0m';
const BLACK = '\x1b[30m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

const TYPE_ICONS: Record<LaunchableType, string> = {
    workspace: '󰉋',
    tab: '󰓩',
    pane: '',
    background: '󰒲',
    'idle-panes': '󰌘',
};

const SOURCE_COLORS: Record<LaunchableSource, string> = {
    global: CYAN, // cyan
    project: YELLOW, // yellow
};

function displayIcon(type: LaunchableType, source: LaunchableSource): string {
    return `${SOURCE_COLORS[source]}${TYPE_ICONS[type]}${RESET}`;
}

function displayLine(item: ResolvedLaunchable, index: number): string {
    const source = `${BLACK}[${item.source}]${RESET}`;
    const type = `${BLACK}[${item.launchable.type}]${RESET}`;
    return `${index}\t${displayIcon(item.launchable.type, item.source)} ${item.name} ${source} ${type}`;
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
