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

interface PickerRow {
    index: number;
    searchText: string;
    displayText: string;
}

function toPickerRow(launchable: Launchable, index: number): PickerRow {
    const source = `${BLACK}[${launchable.source}]${RESET}`;
    const kind = `${BLACK}[${launchable.kind}]${RESET}`;
    return {
        index,
        searchText: launchable.title,
        displayText: `${displayIcon(launchable.kind, launchable.source)} ${source} ${kind}`,
    };
}

function serializePickerRow(row: PickerRow): string {
    return `${row.index}\t${row.searchText}\t${row.displayText}`;
}

function parseSelectedIndex(output: string): number | null {
    const index = Number.parseInt(output.trim().split('\t', 1)[0] || '', 10);
    return Number.isInteger(index) ? index : null;
}

type FzfSelection =
    | { available: true; index: number | null }
    | { available: false };

function selectWithFzf(rows: PickerRow[]): FzfSelection {
    const input = `${rows.map(serializePickerRow).join('\n')}\n`;
    const fzf = spawnSync(
        'fzf',
        [
            '--delimiter',
            '\t',
            // with-nth is applied before nth. The template replaces the tab
            // delimiter between title and metadata with one visible space.
            '--with-nth',
            '{2} {3}',
            '--nth',
            '1',
            '--tiebreak',
            'length,index',
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

    if (fzf.error) return { available: false };
    return {
        available: true,
        index: fzf.status === 0 ? parseSelectedIndex(fzf.stdout || '') : null,
    };
}

export function selectLaunchable(
    launchables: readonly Launchable[]
): Launchable | null {
    if (launchables.length === 0) return null;
    if (launchables.length === 1) return launchables[0] || null;

    const selection = selectWithFzf(launchables.map(toPickerRow));
    if (selection.available) {
        return selection.index === null
            ? null
            : launchables[selection.index] || null;
    }

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
