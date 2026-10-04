#!/usr/bin/env python3
"""
Neverforest background tuner.

Simulates a Herdr session (sidebar, tab bar, bordered panes) running inside
Ghostty, with a Neovim pane and a shell pane, all painted from the real
Neverforest definitions:

    - Ghostty:  dots/.config/ghostty/themes/neverforest (bg, ANSI 0-15)
    - Neovim:   dots/.config/nvim/lua/rmarganti/colors/* (palette, abstractions,
                core/treesitter/lsp/gitsigns/cmp groups, lualine theme).
                `Normal` has no bg, so the editor shows Ghostty's background.
    - Herdr:    dots/.config/herdr/config.toml [theme.custom]

Darkening happens in OKLab lightness so hue stays put.

Modes:
    ramp     every background-family color (bg_darker .. bg_lightest, Herdr
             surfaces, Ghostty selection, indent/whitespace gray) shifts by the
             same ΔL, preserving the steps between them.
    bg-only  only Ghostty's background (and Herdr's sidebar, which mirrors it)
             changes. Shows what happens if you only edit Ghostty.

Re-derive mirrors utils/palette_gen: *_dark / *_darker are mixes against bg,
*_darkest against bg_darker, so they track the new background.

Keys are listed in the bottom panel. Enter quits and prints the new values.

CLI:
    --delta=N       start at ΔL N (OKLab lightness ×100, e.g. -1.5)
    --bg-only       start in bg-only mode
    --no-rederive   don't re-derive *_dark / *_darker / *_darkest
    --dry-run       list files that --apply would touch
    --apply         rewrite every tracked file under dots/ and utils/ (and
                    this script's baseline) in one pass, updating palette.lua
                    cterm values too
"""

import math
import os
import re
import select
import shutil
import signal
import subprocess
import sys
import termios
import tty

# ------------------------------------------------
# Source colors
# ------------------------------------------------

PALETTE = {
    'bg_darker': '#0a0d0e',
    'bg_dark': '#15181a',
    'bg': '#1a1e22',
    'bg_light': '#20252a',
    'bg_lighter': '#272d33',
    'bg_lightest': '#2d343b',
    'fg': '#d3c6aa',
    'black_darker': '#2d3338',
    'black_dark': '#3c444a',
    'black': '#4b565c',
    'black_light': '#627078',
    'black_lighter': '#7a8a93',
    'red_darkest': '#291e1e',
    'red_darker': '#654345',
    'red_dark': '#a46062',
    'red': '#e67e80',
    'red_light': '#eea9aa',
    'green_darkest': '#202724',
    'green_darker': '#4c5d56',
    'green_dark': '#769380',
    'green': '#a2ccae',
    'green_light': '#c3decb',
    'yellow_darkest': '#27251e',
    'yellow_darker': '#605845',
    'yellow_dark': '#9c8862',
    'yellow': '#dbbc7f',
    'yellow_light': '#e6d1a7',
    'blue_darkest': '#1d2426',
    'blue_darker': '#42555c',
    'blue_dark': '#64848d',
    'blue': '#87b5c1',
    'blue_light': '#a9cad2',
    'magenta_darkest': '#262125',
    'magenta_darker': '#5f4c58',
    'magenta_dark': '#987186',
    'magenta': '#d699b6',
    'cyan_darkest': '#212726',
    'cyan_darker': '#505d5e',
    'cyan_dark': '#7d9390',
    'cyan': '#aeccc6',
    'white_darker': '#5d5b54',
    'white_dark': '#968f7e',
    'white': '#d3c6aa',
    'white_light': '#e4ddcc',
    'gray_darker': '#282e34',
    'gray_dark': '#515a5b',
    'gray': '#77817d',
    'gray_light': '#9da9a0',
    'gray_lighter': '#bec8b5',
}

GHOSTTY = {
    'background': '#1a1e22',
    'foreground': '#d3c6aa',
    'cursor-text': '#1a1e22',
    'selection-background': '#3a4348',
}

GHOSTTY_ANSI = [
    '#4b565c', '#e67e80', '#a2ccae', '#dbbc7f', '#87b5c1', '#d699b6', '#aeccc6', '#d3c6aa',
    '#77817d', '#eea9aa', '#c3decb', '#e6d1a7', '#a9cad2', '#e5bdd0', '#cde0dc', '#e4ddcc',
]

HERDR = {
    'accent': '#7a8a93',
    'panel_bg': '#1d2226',
    'sidebar_bg': '#1a1e22',
    'active_row_bg': '#272d33',
    'selection_bg': '#2d343b',
    'surface0': '#2d343b',
    'surface1': '#4b565c',
    'surface_dim': '#272d33',
    'overlay0': '#4b565c',
    'overlay1': '#7a8a93',
    'text': '#d3c6aa',
    'subtext0': '#a6b0a8',
    'mauve': '#d699b6',
    'green': '#a2ccae',
    'yellow': '#dbbc7f',
    'red': '#e67e80',
    'blue': '#87b5c1',
    'teal': '#aeccc6',
}

# Background-family colors that move together in `ramp` mode.
RAMP_PALETTE = ['bg_darker', 'bg_dark', 'bg', 'bg_light', 'bg_lighter', 'bg_lightest', 'gray_darker', 'black_darker']
RAMP_GHOSTTY = ['background', 'cursor-text', 'selection-background']
RAMP_HERDR = ['panel_bg', 'sidebar_bg', 'active_row_bg', 'selection_bg', 'surface0', 'surface_dim']

# Colors that literally *are* the terminal background, in `bg-only` mode.
BG_ONLY_PALETTE = ['bg']
BG_ONLY_GHOSTTY = ['background', 'cursor-text']
BG_ONLY_HERDR = ['sidebar_bg']

DERIVED_BASES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
DERIVED_MIXES = [('_dark', 0.3, 'bg'), ('_darker', 0.6, 'bg'), ('_darkest', 0.85, 'bg_darker')]

DELTA_MIN, DELTA_MAX = -0.15, 0.05

# ------------------------------------------------
# Color math
# ------------------------------------------------


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(c):
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(v))) for v in c)


def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _delin(c):
    c = max(0.0, min(1.0, c))
    return 255 * (c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)


def _cbrt(x):
    return math.copysign(abs(x) ** (1 / 3), x)


def to_oklab(h):
    r, g, b = (_lin(v) for v in hex_to_rgb(h))
    l = _cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = _cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = _cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def from_oklab(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return rgb_to_hex((
        _delin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        _delin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        _delin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    ))


def shift_lightness(h, delta):
    """Move a color's OKLab L by `delta`, scaling chroma down as it darkens."""
    if delta == 0:
        return h
    L, a, b = to_oklab(h)
    L2 = max(0.0, L + delta)
    k = min(1.0, L2 / L) if L > 0 else 0.0
    return from_oklab(L2, a * k, b * k)


def _lab_f(t):
    return t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116


def _lab_finv(t):
    return t ** 3 if t ** 3 > 216 / 24389 else (116 * t - 16) / (24389 / 27)


_WHITE = (0.95047, 1.0, 1.08883)


def to_lab(h):
    r, g, b = (_lin(v) for v in hex_to_rgb(h))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / _WHITE[0]
    y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / _WHITE[1]
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / _WHITE[2]
    fx, fy, fz = _lab_f(x), _lab_f(y), _lab_f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def from_lab(L, a, b):
    fy = (L + 16) / 116
    x, y, z = _lab_finv(fy + a / 500) * _WHITE[0], _lab_finv(fy) * _WHITE[1], _lab_finv(fy - b / 200) * _WHITE[2]
    return rgb_to_hex((
        _delin(3.2406 * x - 1.5372 * y - 0.4986 * z),
        _delin(-0.9689 * x + 1.8758 * y + 0.0415 * z),
        _delin(0.0557 * x - 0.2040 * y + 1.0570 * z),
    ))


def mix(h1, h2, ratio):
    """colord's `mix`: linear interpolation in CIELAB."""
    a, b = to_lab(h1), to_lab(h2)
    return from_lab(*(x + (y - x) * ratio for x, y in zip(a, b)))


def luminance(h):
    r, g, b = (_lin(v) for v in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(h1, h2):
    l1, l2 = sorted((luminance(h1), luminance(h2)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def lightness(h):
    return to_oklab(h)[0] * 100


def rgb_to_x256(h):
    """Port of utils/palette_gen/x256.ts."""
    r, g, b = hex_to_rgb(h)

    def v2ci(v):
        return 0 if v < 48 else 1 if v < 115 else (v - 35) // 40

    ir, ig, ib = v2ci(r), v2ci(g), v2ci(b)
    color_index = 36 * ir + 6 * ig + ib
    average = (r + g + b) // 3
    gray_index = 23 if average > 238 else (average - 3) // 10
    i2cv = [0, 0x5F, 0x87, 0xAF, 0xD7, 0xFF]
    cr, cg, cb = i2cv[ir], i2cv[ig], i2cv[ib]
    gv = 8 + 10 * gray_index

    def dist(A, B, C):
        return (A - r) ** 2 + (B - g) ** 2 + (C - b) ** 2

    return 16 + color_index if dist(cr, cg, cb) <= dist(gv, gv, gv) else 232 + gray_index


# ------------------------------------------------
# Theme
# ------------------------------------------------


class Theme:
    def __init__(self, delta=0.0, mode='ramp', rederive=True):
        self.delta, self.mode, self.rederive = delta, mode, rederive

        ramp = mode == 'ramp'
        pal_keys = RAMP_PALETTE if ramp else BG_ONLY_PALETTE
        gho_keys = RAMP_GHOSTTY if ramp else BG_ONLY_GHOSTTY
        her_keys = RAMP_HERDR if ramp else BG_ONLY_HERDR

        self.p = {k: shift_lightness(v, delta) if k in pal_keys else v for k, v in PALETTE.items()}
        self.ghostty = {k: shift_lightness(v, delta) if k in gho_keys else v for k, v in GHOSTTY.items()}
        self.herdr = {k: shift_lightness(v, delta) if k in her_keys else v for k, v in HERDR.items()}
        self.ansi = list(GHOSTTY_ANSI)

        if rederive and delta != 0:
            for base in DERIVED_BASES:
                for suffix, ratio, against in DERIVED_MIXES:
                    name = base + suffix
                    if name not in PALETTE or self.p[against] == PALETTE[against]:
                        continue
                    old = hex_to_rgb(mix(PALETTE[base], PALETTE[against], ratio))
                    new = hex_to_rgb(mix(PALETTE[base], self.p[against], ratio))
                    orig = hex_to_rgb(PALETTE[name])
                    self.p[name] = rgb_to_hex(o + (n - d) for o, n, d in zip(orig, new, old))

        p = self.p
        # rmarganti/colors/abstractions.lua
        self.a = {
            'fg': p['white'], 'minus3': p['gray_darker'], 'minus2': p['gray_dark'], 'minus1': p['gray'],
            'base': p['gray_light'], 'plus1': p['gray_lighter'], 'plus2': p['cyan'], 'plus3': p['green'],
            'plus4': p['white'], 'border': p['gray_dark'], 'float_bg': p['bg_light'],
            'select_fg': p['white'], 'select_bg': p['gray_dark'],
        }

    @property
    def term_bg(self):
        return self.ghostty['background']

    def changes(self):
        out = []
        for src, cur, orig in (
            ('nvim palette.lua', self.p, PALETTE),
            ('ghostty theme', self.ghostty, GHOSTTY),
            ('herdr config.toml', self.herdr, HERDR),
        ):
            for k, v in cur.items():
                if v != orig[k]:
                    out.append((src, k, orig[k], v))
        return out


# ------------------------------------------------
# Canvas
# ------------------------------------------------


class Style:
    __slots__ = ('fg', 'bg', 'bold', 'italic', 'ul', 'sp')

    def __init__(self, fg=None, bg=None, bold=False, italic=False, ul=None, sp=None):
        self.fg, self.bg, self.bold, self.italic, self.ul, self.sp = fg, bg, bold, italic, ul, sp

    def key(self):
        return (self.fg, self.bg, self.bold, self.italic, self.ul, self.sp)


class Canvas:
    def __init__(self, w, h, bg):
        self.w, self.h = w, h
        self.chars = [[' '] * w for _ in range(h)]
        self.styles = [[(None, bg, False, False, None, None)] * w for _ in range(h)]

    def put(self, x, y, text, fg=None, bg=None, bold=False, italic=False, ul=None, sp=None, clip=None):
        if not 0 <= y < self.h:
            return x
        x_max = self.w if clip is None else min(self.w, clip)
        for ch in text:
            if x >= x_max:
                break
            if x >= 0:
                cur = self.styles[y][x]
                self.chars[y][x] = ch
                self.styles[y][x] = (fg if fg is not None else cur[0], bg if bg is not None else cur[1], bold, italic, ul, sp)
            x += 1
        return x

    def fill(self, x, y, w, h, bg, ch=' ', fg=None):
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.chars[yy][xx] = ch
                self.styles[yy][xx] = (fg, bg, False, False, None, None)

    def box(self, x, y, w, h, fg, bg=None, title=None, title_fg=None):
        tl, tr, bl, br, hz, vt = '╭', '╮', '╰', '╯', '─', '│'
        self.put(x, y, tl + hz * (w - 2) + tr, fg, bg)
        for yy in range(y + 1, y + h - 1):
            self.put(x, yy, vt, fg, bg)
            self.put(x + w - 1, yy, vt, fg, bg)
        self.put(x, y + h - 1, bl + hz * (w - 2) + br, fg, bg)
        if title:
            self.put(x + 2, y, f' {title} ', title_fg or fg, bg, clip=x + w - 2)

    def render(self):
        out = ['\x1b[H']
        last = None
        for y in range(self.h):
            out.append(f'\x1b[{y + 1};1H')
            for x in range(self.w):
                st = self.styles[y][x]
                if st != last:
                    out.append(sgr(st))
                    last = st
                out.append(self.chars[y][x])
        out.append('\x1b[0m')
        return ''.join(out)


def sgr(st):
    fg, bg, bold, italic, ul, sp = st
    parts = ['0']
    if fg:
        parts.append('38;2;%d;%d;%d' % hex_to_rgb(fg))
    if bg:
        parts.append('48;2;%d;%d;%d' % hex_to_rgb(bg))
    if bold:
        parts.append('1')
    if italic:
        parts.append('3')
    seq = '\x1b[' + ';'.join(parts) + 'm'
    if ul:
        seq += {'line': '\x1b[4m', 'curl': '\x1b[4:3m', 'dot': '\x1b[4:4m'}[ul]
        if sp:
            seq += '\x1b[58:2::%d:%d:%dm' % hex_to_rgb(sp)
    return seq


# ------------------------------------------------
# Neovim pane
# ------------------------------------------------

CODE = '''\
import { readFile } from 'node:fs/promises';
import type { Palette, Theme } from './types';

// Shift every background swatch by the same amount.
export const DEFAULT_DELTA = -0.02;

export async function loadTheme(path: string): Promise<Theme> {
    const raw = await readFile(path, 'utf8');
    const palette = JSON.parse(raw) as Palette;

    if (!palette.bg) {
        throw new Error(`missing bg in ${path}`);
    }

    return { name: 'neverforest', dark: true, palette };
}

export function darken(theme: Theme, delta = DEFAULT_DELTA): Theme {
    const next = { ...theme.palette };

    for (const [key, hex] of Object.entries(next)) {
        if (key.startsWith('bg')) {
            next[key] = shift(hex, delta);
        }
    }

    // TODO: re-derive the *_dark variants too
    return { ...theme, palette: next };
}

export class Swatch {
    constructor(private readonly hex: string) {}

    get lightness(): number {
        return toOklab(this.hex).l * 100;
    }
}
'''

KEYWORDS = {'const', 'let', 'return', 'async', 'await', 'function', 'type', 'as', 'new', 'throw', 'class',
            'constructor', 'private', 'readonly', 'get'}
INCLUDES = {'import', 'export', 'from'}
CONDITIONALS = {'if', 'else', 'for', 'of', 'while'}
BOOLEANS = {'true', 'false', 'null', 'undefined'}
PARAMS = {'path', 'theme', 'delta', 'hex'}
BUILTIN_TYPES = {'string', 'number', 'boolean'}

TOKEN_RE = re.compile(r"""
    (?P<com>//.*)
  | (?P<str>'[^']*'|`[^`]*`)
  | (?P<num>-?\d+(\.\d+)?)
  | (?P<word>[A-Za-z_$][\w$]*)
  | (?P<op>=>|===|\.\.\.|[=+\-*/<>!?:|&])
  | (?P<punc>[{}()\[\];,.])
  | (?P<ws>\s+)
""", re.VERBOSE)


def tokenize(line):
    """Tiny TS tokenizer that maps to Neverforest's treesitter/core groups."""
    toks = []
    for m in TOKEN_RE.finditer(line):
        kind = m.lastgroup
        text = m.group()
        if kind == 'word':
            rest = line[m.end():]
            prev = line[:m.start()].rstrip()
            if text in INCLUDES:
                kind = 'include'
            elif text in CONDITIONALS:
                kind = 'cond'
            elif text in KEYWORDS:
                kind = 'kw'
            elif text in BOOLEANS:
                kind = 'bool'
            elif text == 'this':
                kind = 'builtin'
            elif text in BUILTIN_TYPES or text[0].isupper() and not rest.startswith('('):
                kind = 'type'
            elif rest.startswith('(') or rest.startswith('<') and text[0].islower():
                kind = 'fn'
            elif prev.endswith('.') and not prev.endswith('...'):
                kind = 'prop'
            elif text in PARAMS:
                kind = 'param'
            elif text.isupper():
                kind = 'const'
            else:
                kind = 'var'
        elif kind == 'str' and text.startswith('`') and '${' in text:
            pre, _, tail = text.partition('${')
            inner, _, post = tail.partition('}')
            toks += [('str', pre), ('punc', '${'), ('param', inner), ('punc', '}'), ('str', post)]
            continue
        toks.append((kind, text))
    return toks


def code_styles(t):
    a = t.a
    return {
        'com': dict(fg=a['minus2'], italic=True),
        'str': dict(fg=a['plus1']),
        'num': dict(fg=a['plus1']),
        'bool': dict(fg=a['plus1']),
        'include': dict(fg=a['minus1']),
        'kw': dict(fg=a['minus1']),
        'cond': dict(fg=a['base']),
        'type': dict(fg=a['plus2']),
        'fn': dict(fg=a['plus3']),
        'prop': dict(fg=a['plus1'], italic=True),
        'param': dict(fg=a['plus4'], italic=True),
        'builtin': dict(fg=a['plus4'], italic=True),
        'const': dict(fg=a['plus4']),
        'var': dict(fg=a['plus4']),
        'op': dict(fg=a['base']),
        'punc': dict(fg=a['minus1']),
        'ws': dict(fg=a['fg']),
    }


GIT_SIGNS = {7: 'add', 8: 'add', 20: 'change', 27: 'add', 28: 'delete'}


def draw_nvim(c, t, x, y, w, h, state):
    """Draw a Neovim window into the pane interior (x, y, w, h)."""
    p, a = t.p, t.a
    styles = code_styles(t)
    lines = CODE.splitlines()
    cursor = 23  # 1-based line of the cursor
    visual = state['visual']
    vis_range = range(cursor - 2, cursor + 1) if visual else range(0)

    # Winbar (lualine winbar: filename in `base`, navic in `minus1`)
    wb = c.put(x + 1, y, 'src/theme/darken.ts', a['base'] if state['focus'] == 'nvim' else a['minus2'])
    if state['focus'] == 'nvim':
        c.put(wb, y, '  > darken > for', a['minus1'], clip=x + w)

    body_h = h - 3  # winbar, statusline, cmdline
    top = 0
    for row in range(body_h):
        ln = top + row + 1
        yy = y + 1 + row
        if ln > len(lines):
            continue  # fillchars eob = ' '
        is_cur = ln == cursor and not visual
        line_bg = p['bg_dark'] if is_cur else None

        if line_bg:
            c.fill(x, yy, w, 1, line_bg)

        # Sign column (gitsigns)
        sign = GIT_SIGNS.get(ln)
        if sign:
            glyph, col = {'add': ('▎', p['green_dark']), 'change': ('▎', p['yellow_dark']), 'delete': ('▁', p['red_dark'])}[sign]
            c.put(x, yy, glyph, col, line_bg)

        # Number column (number + relativenumber)
        num = str(ln) if ln == cursor else str(abs(ln - cursor))
        if ln == cursor:
            c.put(x + 2, yy, num.ljust(3) + ' ', a['plus2'], p['bg_dark'] if not visual else None)
        else:
            c.put(x + 2, yy, num.rjust(3) + ' ', a['minus2'])

        # Text
        text = lines[ln - 1]
        cx = x + 6
        lead = len(text) - len(text.lstrip(' '))
        in_vis = ln in vis_range
        vis_bg = p['bg_lighter'] if in_vis else None

        for kind, tok in tokenize(text):
            if kind == 'ws' and cx - (x + 6) < lead:
                # listchars lead = '·' (Whitespace -> minus3), indent-blankline guide on each level
                for i, _ in enumerate(tok):
                    col = cx - (x + 6)
                    ch, fg = ('│', a['minus3']) if col % 4 == 0 and col > 0 else ('·', a['minus3'])
                    if col == 0:
                        ch = '·'
                    cx = c.put(cx, yy, ch, fg, vis_bg or line_bg, clip=x + w)
                continue
            st = dict(styles[kind])
            st['bg'] = vis_bg or line_bg
            if kind == 'com' and 'TODO' in tok:
                pre, _, post = tok.partition('TODO')
                cx = c.put(cx, yy, pre, clip=x + w, **st)
                cx = c.put(cx, yy, 'TODO', a['fg'], p['blue_darker'], clip=x + w)
                cx = c.put(cx, yy, post, clip=x + w, **st)
                continue
            if state['search'] and tok == 'delta' and kind == 'param':
                is_cur_match = ln == cursor
                st = dict(fg=p['bg_dark'], bg=p['green_light'] if is_cur_match else p['green_dark'])
            if ln == 11 and tok in ('palette', 'bg') and kind in ('var', 'prop'):
                st.update(ul='dot', sp=p['yellow_dark'])
            cx = c.put(cx, yy, tok, clip=x + w, **st)

        # Diagnostic virtual text
        if ln == 11:
            c.put(cx + 2, yy, '■ Unnecessary conditional', p['yellow'], clip=x + w)
        if ln == 34:
            c.put(cx + 2, yy, '■ Cannot find name \'toOklab\'.', p['red'], clip=x + w)

    # Completion menu (pumborder = rounded, Pmenu on float_bg)
    if state['popup'] and not visual:
        items = [('shift', 'Function'), ('shiftLightness', 'Function'), ('shiftHue', 'Function'), ('showSwatch', 'Variable')]
        pw = 28
        px = x + 6 + 22
        py = y + 1 + (cursor - top)
        if px + pw <= x + w and py + len(items) + 2 <= y + 1 + body_h:
            c.fill(px, py, pw, len(items) + 2, a['float_bg'])
            c.box(px, py, pw, len(items) + 2, a['border'], a['float_bg'])
            for i, (label, kind) in enumerate(items):
                sel = i == 0
                bg = a['select_bg'] if sel else a['float_bg']
                c.fill(px + 1, py + 1 + i, pw - 2, 1, bg)
                ex = c.put(px + 2, py + 1 + i, label[:2], p['cyan'], bg)  # CmpItemAbbrMatch
                c.put(ex, py + 1 + i, label[2:], a['select_fg'] if sel else a['plus4'], bg)
                c.put(px + pw - 2 - len(kind), py + 1 + i, kind, a['base'], bg)

    # Global statusline (laststatus = 3, lualine neverforest theme)
    sy = y + h - 2
    mode, mode_fg = ('VIS', p['gray']) if visual else ('NOR', p['gray'])
    sec_a = dict(fg=mode_fg, bg=p['bg_lightest'], bold=True)
    sec_b = dict(fg=p['gray_dark'], bg=p['bg'])
    sec_c = dict(fg=p['gray_dark'], bg=p['bg_light'])
    c.fill(x, sy, w, 1, p['bg_light'])
    sx = c.put(x, sy, f' {mode} ', **sec_a)
    sx = c.put(sx, sy, '  main ', **sec_b)
    sx = c.put(sx, sy, ' ', **sec_c)
    sx = c.put(sx, sy, '+2 ', p['green_dark'], p['bg_light'])
    sx = c.put(sx, sy, '~1 ', p['yellow_dark'], p['bg_light'])
    sx = c.put(sx, sy, '-1 ', p['red_dark'], p['bg_light'])
    sx = c.put(sx, sy, ' 1 ', p['red'], p['bg_light'])
    sx = c.put(sx, sy, ' 1 ', p['yellow'], p['bg_light'])
    c.put(sx, sy, ' darken.ts', **sec_c)
    right = [(' utf-8  unix  typescript ', sec_c), (' 60% ', sec_b), (f' {cursor}:13 ', sec_a)]
    rx = x + w - sum(len(s) for s, _ in right)
    for s, st in right:
        rx = c.put(rx, sy, s, **st)

    # Cmdline
    if visual:
        c.put(x, y + h - 1, '-- VISUAL LINE --', a['fg'], bold=True)


# ------------------------------------------------
# Shell pane
# ------------------------------------------------


def draw_shell(c, t, x, y, w, h, state):
    A = t.ansi
    fg = t.ghostty['foreground']
    rows = []

    def prompt(cmd):
        # starship: ┌ host (branch status) dir ───┐ / └ $
        segs = [('┌ ', A[0]), ('macbook ', A[4]), ('(', A[0]), ('main', A[2]), (' !?', A[5]), (') ', A[0]), ('~/.dotfiles', A[6])]
        used = sum(len(s) for s, _ in segs)
        segs.append((' ' + '─' * max(0, w - used - 3) + '┐', A[0]))
        rows.append(segs)
        rows.append([('└ ', A[0]), ('$ ', A[7]), (cmd, fg)])

    prompt('git log --oneline -4')
    rows.append([('9a3bb29 ', A[3]), ('(', A[3]), ('HEAD -> ', A[14]), ('main', A[2]), (')', A[3]), (' --wip--', fg)])
    rows.append([('e72673b ', A[3]), ('chore(deps): bump undici', fg)])
    rows.append([('4ba9b86 ', A[3]), ('feat(nvim): use local hydra.nvim fork', fg)])
    rows.append([('9d72578 ', A[3]), ('feat(mise): include diffnav', fg)])
    rows.append([])
    prompt('git status -s')
    rows.append([(' M ', A[1]), ('dots/.config/ghostty/themes/neverforest', fg)])
    rows.append([('M  ', A[2]), ('dots/.config/herdr/config.toml', fg)])
    rows.append([('?? ', A[1]), ('utils/bg_tuner/', fg)])
    rows.append([])
    prompt('ls')
    rows.append([('README.md  ', fg), ('bb-plugin-todo', A[4]), ('  codebook.toml  ', fg), ('dots', A[4]), ('  mise.toml  ', fg), ('utils', A[4])])
    rows.append([])
    prompt('colors')
    rows.append([(f' {i:<2} ', t.term_bg if i in (7, 15) or i > 8 else fg) for i in range(8)])
    rows.append([(f' {i:<2} ', t.term_bg) for i in range(8, 16)])
    rows.append([])
    prompt('')

    for i, segs in enumerate(rows[-h:] if len(rows) > h else rows):
        cx = x
        is_palette = segs and segs[0][0].strip().isdigit()
        for j, (s, col) in enumerate(segs):
            if is_palette:
                idx = int(s)
                cx = c.put(cx, y + i, s, col, A[idx], clip=x + w)
            else:
                cx = c.put(cx, y + i, s, col, clip=x + w)
        if i == min(len(rows), h) - 1 and state['focus'] == 'shell':
            c.put(cx, y + i, ' ', t.ghostty['cursor-text'], fg)  # block cursor
        elif i == min(len(rows), h) - 1:
            c.put(cx, y + i, '▯', fg)

    # Selection (Ghostty selection-background), when toggled
    if state['visual']:
        for xx in range(x, min(x + w, x + 18)):
            ch = c.chars[y + 2][xx]
            c.styles[y + 2][xx] = (fg, t.ghostty['selection-background'], False, False, None, None)
            c.chars[y + 2][xx] = ch


# ------------------------------------------------
# Herdr chrome
# ------------------------------------------------


def draw_sidebar(c, t, x, y, w, h):
    H = t.herdr
    c.fill(x, y, w, h, H['sidebar_bg'])
    c.put(x + 1, y, 'Workspaces', H['overlay1'], H['sidebar_bg'], bold=True)
    ws = [('dotfiles', True, H['green']), ('work-api', False, H['yellow']), ('notes', False, None)]
    for i, (name, active, dot) in enumerate(ws):
        yy = y + 1 + i
        bg = H['active_row_bg'] if active else H['sidebar_bg']
        c.fill(x, yy, w, 1, bg)
        c.put(x + 1, yy, f'{i + 1} {name}', H['text'] if active else H['subtext0'], bg, bold=active)
        if active:
            c.put(x + w - 7, yy, 'main', H['mauve'], bg)
    sep_y = y + len(ws) + 2
    c.put(x, sep_y, '─' * w, H['surface_dim'], H['sidebar_bg'])
    c.put(x + 1, sep_y + 1, 'Agents', H['overlay1'], H['sidebar_bg'], bold=True)
    agents = [
        ('●', H['yellow'], 'dotfiles', '1', 'claude', True),
        ('●', H['green'], 'work-api', '2', 'pi', False),
        ('●', H['teal'], 'notes', '1', 'claude', False),
        ('●', H['red'], 'work-api', '3', 'opencode', False),
    ]
    for i, (icon, col, wsn, tab, agent, focused) in enumerate(agents):
        yy = sep_y + 2 + i * 2
        bg = H['active_row_bg'] if focused else H['sidebar_bg']
        c.fill(x, yy, w, 2, bg)
        ex = c.put(x + 1, yy, icon + ' ', col, bg)
        ex = c.put(ex, yy, wsn, H['text'] if focused else H['subtext0'], bg)
        c.put(ex, yy, f' · {tab}', H['overlay1'], bg)
        c.put(x + 3, yy + 1, f'local · {agent}', H['overlay1'], bg)
    # Navigate-mode cursor row
    ny = sep_y + 2 + len(agents) * 2 + 1
    if ny < y + h - 1:
        c.fill(x, ny, w, 1, H['selection_bg'])
        c.put(x + 1, ny, '+ new agent', H['text'], H['selection_bg'])


def draw_tabbar(c, t, x, y, w):
    H = t.herdr
    cx = x
    for i, (name, sel) in enumerate([('nvim', True), ('server', False), ('scratch', False)]):
        label = f' {i + 1} {name} '
        if sel:
            cx = c.put(cx, y, label, t.term_bg, H['accent'], bold=True)
        else:
            cx = c.put(cx, y, label, H['overlay1'], H['surface0'])
        cx += 1
    right = '14:05 · 󰇥 '
    c.put(x + w - len(right) - 1, y, right, H['overlay1'])


def draw_toast(c, t, x, y, w):
    H = t.herdr
    msg = [('✓ ', H['blue']), ('claude finished', H['text']), (' in dotfiles', H['subtext0'])]
    tw = sum(len(s) for s, _ in msg) + 4
    tx = x + w - tw
    c.fill(tx, y, tw, 3, H['panel_bg'])
    c.box(tx, y, tw, 3, H['surface1'], H['panel_bg'])
    cx = tx + 2
    for s, col in msg:
        cx = c.put(cx, y + 1, s, col, H['panel_bg'])


# ------------------------------------------------
# Control panel (painted with the *original* palette)
# ------------------------------------------------

PANEL_H = 8


def draw_panel(c, t, y, state):
    P = PALETTE
    w = c.w
    bg = P['bg_dark']
    c.fill(0, y, w, PANEL_H, bg)
    c.put(0, y, '─' * w, P['gray_dark'], bg)
    c.put(2, y, ' neverforest bg tuner ', P['green'], bg, bold=True)
    showing = ' SHOWING ORIGINAL ' if state['compare'] else ''
    if showing:
        c.put(w - len(showing) - 2, y, showing, P['bg_dark'], P['yellow'], bold=True)

    # Slider
    sy = y + 1
    lbl = c.put(2, sy, 'lighter ', P['gray'], bg)
    bar_w = max(20, min(60, w - 70))
    pos = round((state['delta'] - DELTA_MAX) / (DELTA_MIN - DELTA_MAX) * (bar_w - 1))
    zero = round((0 - DELTA_MAX) / (DELTA_MIN - DELTA_MAX) * (bar_w - 1))
    for i in range(bar_w):
        if i == pos:
            ch, col = '●', P['green']
        elif i == zero:
            ch, col = '┃', P['gray']
        else:
            ch, col = ('━', P['green_dark']) if min(zero, pos) < i < max(zero, pos) else ('─', P['gray_dark'])
        c.put(lbl + i, sy, ch, col, bg)
    c.put(lbl + bar_w + 1, sy, 'darker', P['gray'], bg)
    ex = c.put(lbl + bar_w + 9, sy, f'ΔL {state["delta"] * 100:+.2f}', P['fg'], bg, bold=True)
    ex = c.put(ex + 3, sy, 'mode ', P['gray'], bg)
    ex = c.put(ex, sy, t.mode, P['cyan'], bg)
    ex = c.put(ex + 3, sy, 're-derive ', P['gray'], bg)
    c.put(ex, sy, 'on' if t.rederive else 'off', P['cyan'] if t.rederive else P['red'], bg)

    # Ramp swatches: original → new
    keys = [('bg_darker', t.p), ('bg_dark', t.p), ('bg', t.p), ('bg_light', t.p), ('bg_lighter', t.p), ('bg_lightest', t.p),
            ('panel_bg', t.herdr), ('selection-background', t.ghostty)]
    origs = {**PALETTE, **HERDR, **GHOSTTY}
    cx, ry = 2, y + 3
    for name, src in keys:
        new, old = src[name], origs[name]
        short = {'selection-background': 'ghostty sel', 'panel_bg': 'herdr panel'}.get(name, name)
        cell_w = len(short) + 21
        if cx + cell_w > w:
            cx, ry = 2, ry + 1
        cx = c.put(cx, ry, '  ', None, old)
        cx = c.put(cx, ry, '  ', None, new)
        cx = c.put(cx + 1, ry, short + ' ', P['gray'], bg)
        changed = new != old
        cx = c.put(cx, ry, new if changed else old, P['fg'] if changed else P['gray_dark'], bg)
        cx += 3

    # Metrics
    my = y + 5
    base_bg = t.term_bg

    def metric(x, label, value, ok):
        x = c.put(x, my, label + ' ', P['gray'], bg)
        return c.put(x, my, value, P['green'] if ok else P['red'], bg) + 3

    mx = 2
    mx = metric(mx, 'fg', f'{contrast(t.a["fg"], base_bg):.1f}:1', True)
    mx = metric(mx, 'comment', f'{contrast(t.a["minus2"], base_bg):.2f}:1', contrast(t.a['minus2'], base_bg) >= 2.0)
    for label, key in (('cursorline', 'bg_dark'), ('float', 'bg_light'), ('visual', 'bg_lighter'), ('indent·', 'gray_darker')):
        d = lightness(t.p[key]) - lightness(base_bg)
        mx = metric(mx, label, f'{d:+.1f}', abs(d) >= 1.5)
    mx = metric(mx, 'herdr panel', f'{lightness(t.herdr["panel_bg"]) - lightness(base_bg):+.1f}', True)

    help_ = '←/→ h/l step  H/L ×5  0 reset  m mode  r re-derive  space A/B  f focus  v visual  / search  p popup  t toast  b sidebar  ⏎ quit+print  q quit'
    c.put(2, y + 7, help_, P['gray_dark'], bg, clip=w - 1)


# ------------------------------------------------
# Frame
# ------------------------------------------------


def draw(w, h, state):
    t = Theme(0.0, state['mode'], state['rederive']) if state['compare'] else Theme(state['delta'], state['mode'], state['rederive'])
    c = Canvas(w, h, t.term_bg)
    sim_h = h - PANEL_H
    H = t.herdr

    sb_w = 26 if state['sidebar'] and w >= 100 else 0
    if sb_w:
        draw_sidebar(c, t, 0, 0, sb_w, sim_h - 1)
        for yy in range(sim_h - 1):
            c.put(sb_w, yy, '│', H['surface_dim'], H['sidebar_bg'])
        sb_w += 1

    pane_y, pane_h = 0, sim_h - 1
    avail = w - sb_w
    nvim_w = max(40, int(avail * 0.6))
    shell_w = avail - nvim_w

    focus = state['focus']
    nvim_border = H['accent'] if focus == 'nvim' else H['overlay0']
    shell_border = H['accent'] if focus == 'shell' else H['overlay0']
    c.box(sb_w, pane_y, nvim_w, pane_h, nvim_border, title='nvim', title_fg=H['text'] if focus == 'nvim' else H['overlay0'])
    draw_nvim(c, t, sb_w + 1, pane_y + 1, nvim_w - 2, pane_h - 2, state)
    if shell_w >= 20:
        sx = sb_w + nvim_w
        c.box(sx, pane_y, shell_w, pane_h, shell_border, title='shell', title_fg=H['text'] if focus == 'shell' else H['overlay0'])
        draw_shell(c, t, sx + 1, pane_y + 1, shell_w - 2, pane_h - 2, state)
        if state['toast']:
            draw_toast(c, t, sx + 1, pane_y + pane_h - 5, shell_w - 3)

    draw_tabbar(c, t, sb_w, sim_h - 1, w - sb_w)
    draw_panel(c, Theme(state['delta'], state['mode'], state['rederive']), sim_h, state)
    return c.render()


# ------------------------------------------------
# Report
# ------------------------------------------------


def report(state):
    t = Theme(state['delta'], state['mode'], state['rederive'])
    changes = t.changes()
    print(f'\nNeverforest bg — mode {t.mode}, re-derive {"on" if t.rederive else "off"}, ΔL {t.delta * 100:+.2f}\n')
    if not changes:
        print('No changes.')
        return

    groups = {}
    for src, k, old, new in changes:
        groups.setdefault(src, []).append((k, old, new))

    for src, items in groups.items():
        print(f'# {src}')
        for k, old, new in items:
            if src.startswith('nvim'):
                print(f"    {k} = {{ gui = '{new}', cterm = {rgb_to_x256(new)} }},  -- was {old}")
            elif src.startswith('ghostty'):
                print(f'{k} = {new}  # was {old}')
            else:
                print(f'{k} = "{new}"  # was {old}')
        print()

    root = repo_root()
    olds = sorted({old for _, _, old, _ in changes})
    print('# Other files referencing replaced hex values')
    try:
        out = subprocess.run(['git', '-C', root, 'grep', '-n', '-i', '-E', '|'.join(olds), '--', 'dots'],
                             capture_output=True, text=True).stdout
    except OSError:
        out = ''
    seen = {}
    for line in out.splitlines():
        path = line.split(':', 1)[0]
        seen.setdefault(path, set()).update(h for h in olds if h in line.lower())
    for path, hexes in sorted(seen.items()):
        print(f'  {path}: {", ".join(sorted(hexes))}')

    flags = f'--delta={t.delta * 100:g}' + (' --bg-only' if t.mode == 'bg-only' else '') + ('' if t.rederive else ' --no-rederive')
    print(f'\nApply everywhere with:\n  utils/bg_tuner/bg_tuner.py --apply {flags}')


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def replacement_map(t):
    """Old hex -> new hex across all sources. Refuses ambiguous mappings."""
    mapping = {}
    for src, k, old, new in t.changes():
        prev = mapping.setdefault(old, (new, f'{src}:{k}'))
        if prev[0] != new:
            sys.exit(f'{old} maps to both {prev[0]} ({prev[1]}) and {new} ({src}:{k}); refusing to apply')
    return {old: new for old, (new, _) in mapping.items()}


def apply_changes(state, dry_run=False):
    """Rewrite every tracked file (plus this script) in a single pass, so new
    values that equal other old values are never shifted twice."""
    t = Theme(state['delta'], state['mode'], state['rederive'])
    mapping = replacement_map(t)
    if not mapping:
        print('No changes.')
        return

    root = repo_root()
    files = subprocess.run(['git', '-C', root, 'ls-files', '--', 'dots', 'utils'],
                           capture_output=True, text=True, check=True).stdout.splitlines()
    files = sorted(set(files) | {os.path.relpath(os.path.abspath(__file__), root)})

    hex_re = re.compile(r'#(' + '|'.join(h[1:] for h in mapping) + r')(?=[0-9a-fA-F]{2}\b|\b)', re.IGNORECASE)
    cterm_re = re.compile(r"(gui = ')(#[0-9a-fA-F]{6})(', cterm = )\d+")

    def swap(m):
        new = mapping['#' + m.group(1).lower()]
        return new.upper() if m.group(1).isupper() else new

    print(f'{"Would apply" if dry_run else "Applying"} {len(mapping)} color changes '
          f'(mode {t.mode}, re-derive {"on" if t.rederive else "off"}, ΔL {t.delta * 100:+.2f})\n')
    for rel in files:
        path = os.path.join(root, rel)
        if 'node_modules' in rel or not os.path.isfile(path):
            continue
        try:
            with open(path, encoding='utf-8') as f:
                text = f.read()
        except (UnicodeDecodeError, OSError):
            continue
        new_text, n = hex_re.subn(swap, text)
        if not n:
            continue
        # palette.lua: keep cterm fallbacks in sync with the new gui value.
        new_text = cterm_re.sub(lambda m: m.group(1) + m.group(2) + m.group(3) + str(rgb_to_x256(m.group(2).lower()))
                                if m.group(2).lower() in mapping.values() else m.group(0), new_text)
        print(f'  {n:4d}  {rel}')
        if not dry_run:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_text)
    if not dry_run:
        print('\nReview with `git diff`; revert with `git checkout -- dots utils`.')


# ------------------------------------------------
# Main loop
# ------------------------------------------------


def read_key(fd):
    data = os.read(fd, 32).decode(errors='ignore')
    keys = []
    i = 0
    while i < len(data):
        if data.startswith('\x1b[', i) and i + 2 < len(data):
            keys.append({'C': 'right', 'D': 'left', 'A': 'up', 'B': 'down'}.get(data[i + 2], ''))
            i += 3
        else:
            keys.append(data[i])
            i += 1
    return keys


def main():
    state = dict(delta=0.0, mode='ramp', rederive=True, compare=False, focus='nvim',
                 visual=False, search=True, popup=True, toast=True, sidebar=True)
    for arg in sys.argv[1:]:
        if arg.startswith('--delta='):
            state['delta'] = float(arg.split('=', 1)[1]) / 100
        elif arg == '--bg-only':
            state['mode'] = 'bg-only'
        elif arg == '--no-rederive':
            state['rederive'] = False
        elif arg in ('--apply', '--dry-run'):
            state[arg[2:].replace('-', '_')] = True
        elif arg in ('-h', '--help'):
            print(__doc__)
            return
        else:
            sys.exit(f'unknown argument: {arg}')

    if state.get('apply') or state.get('dry_run'):
        apply_changes(state, dry_run=not state.get('apply') or state.get('dry_run', False))
        return

    if not sys.stdin.isatty():
        sys.exit('bg_tuner needs an interactive terminal')

    fd = sys.stdin.fileno()
    old_attrs = termios.tcgetattr(fd)
    resized = [True]
    signal.signal(signal.SIGWINCH, lambda *_: resized.__setitem__(0, True))
    print_report = False

    sys.stdout.write('\x1b[?1049h\x1b[?25l')
    try:
        tty.setcbreak(fd)
        dirty = True
        while True:
            if dirty or resized[0]:
                w, h = shutil.get_terminal_size()
                resized[0] = False
                if w < 80 or h < 24:
                    sys.stdout.write('\x1b[2J\x1b[Hterminal too small (need 80x24)')
                else:
                    sys.stdout.write(draw(w, h, state))
                sys.stdout.flush()
                dirty = False
            ready, _, _ = select.select([fd], [], [], 0.1)
            if not ready:
                continue
            for k in read_key(fd):
                step = 0.0025
                if k in ('right', 'l'):
                    state['delta'] -= step
                elif k in ('left', 'h'):
                    state['delta'] += step
                elif k == 'L':
                    state['delta'] -= step * 5
                elif k == 'H':
                    state['delta'] += step * 5
                elif k == '0':
                    state['delta'] = 0.0
                elif k == 'm':
                    state['mode'] = 'bg-only' if state['mode'] == 'ramp' else 'ramp'
                elif k == 'r':
                    state['rederive'] = not state['rederive']
                elif k == ' ':
                    state['compare'] = not state['compare']
                elif k in ('f', '\t'):
                    state['focus'] = 'shell' if state['focus'] == 'nvim' else 'nvim'
                elif k == 'v':
                    state['visual'] = not state['visual']
                elif k == '/':
                    state['search'] = not state['search']
                elif k == 'p':
                    state['popup'] = not state['popup']
                elif k == 't':
                    state['toast'] = not state['toast']
                elif k == 'b':
                    state['sidebar'] = not state['sidebar']
                elif k in ('\r', '\n'):
                    print_report = True
                    raise KeyboardInterrupt
                elif k in ('q', '\x1b'):
                    raise KeyboardInterrupt
                state['delta'] = round(max(DELTA_MIN, min(DELTA_MAX, state['delta'])), 4)
                dirty = True
    except KeyboardInterrupt:
        pass
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_attrs)
        sys.stdout.write('\x1b[0m\x1b[?25h\x1b[?1049l')
        sys.stdout.flush()

    if print_report:
        report(state)


if __name__ == '__main__':
    main()
