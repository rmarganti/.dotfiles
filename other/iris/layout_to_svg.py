#!/usr/bin/env python3
"""Render a VIA layout export for the Keebio Iris (Rev. 6 / 6a) as an SVG.

Every layer is drawn on the real physical layout. Keycodes are shown as the
keys they actually send: S(KC_2) is "@", LCA(KC_J) is "⌃⌥J", a VIA macro such
as "{KC_LGUI,KC_LEFT}" is "⌘←", and tap/hold keys show both actions.

Usage:
    layout_to_svg.py layout.json [-o out.svg] [--names Base,Sym,Num,Nav]
"""

from __future__ import annotations

import argparse
import json
import math
import re
from dataclasses import dataclass
from html import escape
from pathlib import Path

# --------------------------------------------------------------------------
# Physical layout
# --------------------------------------------------------------------------

# KLE layout from the VIA definition for the Iris Rev. 6a
# (the-via/keyboards: v3/keebio/iris/iris-rev6a.json). Each "row,col" is a
# matrix position; the export's flat key list is indexed by row * COLS + col.
COLS = 6
KLE = [
    [{"x": 3}, "0,3", {"x": 8}, "5,3"],
    [{"y": -0.875, "x": 2}, "0,2", {"x": 1}, "0,4", {"x": 6}, "5,4", {"x": 1}, "5,2"],
    [{"y": -0.875, "x": 5}, "0,5", {"x": 4}, "5,5"],
    [{"y": -0.875}, "0,0", "0,1", {"x": 12}, "5,1", "5,0"],
    [{"y": -0.375, "x": 3}, "1,3", {"x": 8}, "6,3"],
    [{"y": -0.875, "x": 2}, "1,2", {"x": 1}, "1,4", {"x": 6}, "6,4", {"x": 1}, "6,2"],
    [{"y": -0.875, "x": 5}, "1,5", {"x": 4}, "6,5"],
    [{"y": -0.875}, "1,0", "1,1", {"x": 12}, "6,1", "6,0"],
    [{"y": -0.375, "x": 3}, "2,3", {"x": 8}, "7,3"],
    [{"y": -0.875, "x": 2}, "2,2", {"x": 1}, "2,4", {"x": 6}, "7,4", {"x": 1}, "7,2"],
    [{"y": -0.875, "x": 5}, "2,5", {"x": 4}, "7,5"],
    [{"y": -0.875}, "2,0", "2,1", {"x": 12}, "7,1", "7,0"],
    [{"y": -0.375, "x": 3}, "3,3", {"x": 8}, "8,3"],
    [{"y": -0.875, "x": 2}, "3,2", {"x": 1}, "3,4", {"x": 6}, "8,4", {"x": 1}, "8,2"],
    [{"y": -0.875, "x": 5}, "3,5", {"x": 4}, "8,5"],
    [{"y": -0.875}, "3,0", "3,1", {"x": 12}, "8,1", "8,0"],
    [{"y": -0.125, "x": 3.5}, "4,2", {"x": 7}, "9,2"],
    [{"y": -0.875, "x": 4.5}, "4,3", {"x": 5}, "9,3"],
    [{"r": 30, "rx": 8, "y": 4.13, "x": 0.6}, "4,5"],
    [{"x": 0.6}, "4,4"],
    [{"r": -30, "y": -2, "x": -1.6}, "9,5"],
    [{"x": -1.6}, "9,4"],
]


@dataclass
class Key:
    x: float
    y: float
    w: float
    h: float
    r: float
    rx: float
    ry: float

    def corners(self) -> list[tuple[float, float]]:
        a = math.radians(self.r)
        pts = []
        for px, py in (
            (self.x, self.y),
            (self.x + self.w, self.y),
            (self.x, self.y + self.h),
            (self.x + self.w, self.y + self.h),
        ):
            dx, dy = px - self.rx, py - self.ry
            pts.append(
                (
                    self.rx + dx * math.cos(a) - dy * math.sin(a),
                    self.ry + dx * math.sin(a) + dy * math.cos(a),
                )
            )
        return pts


def parse_kle(rows: list) -> dict[int, Key]:
    """Minimal KLE parser (same cursor rules as kle-serial)."""
    keys: dict[int, Key] = {}
    cur = {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0, "r": 0.0, "rx": 0.0, "ry": 0.0}
    for row in rows:
        for item in row:
            if isinstance(item, dict):
                if "r" in item:
                    cur["r"] = item["r"]
                if "rx" in item:
                    cur["rx"] = item["rx"]
                    cur["x"], cur["y"] = cur["rx"], cur["ry"]
                if "ry" in item:
                    cur["ry"] = item["ry"]
                    cur["x"], cur["y"] = cur["rx"], cur["ry"]
                cur["x"] += item.get("x", 0)
                cur["y"] += item.get("y", 0)
                cur["w"] = item.get("w", cur["w"])
                cur["h"] = item.get("h", cur["h"])
            else:
                row_i, col_i = map(int, item.split(","))
                keys[row_i * COLS + col_i] = Key(
                    cur["x"], cur["y"], cur["w"], cur["h"], cur["r"], cur["rx"], cur["ry"]
                )
                cur["x"] += cur["w"]
                cur["w"] = cur["h"] = 1.0
        cur["y"] += 1
        cur["x"] = cur["rx"]
    return keys


# --------------------------------------------------------------------------
# Keycode -> label
# --------------------------------------------------------------------------

CTL, ALT, SFT, GUI = "ctl", "alt", "sft", "gui"
MOD_ORDER = [CTL, ALT, SFT, GUI]  # Apple's menu order: ⌃⌥⇧⌘
MOD_GLYPH = {CTL: "⌃", ALT: "⌥", SFT: "⇧", GUI: "⌘"}

# Plain modifier keycodes, with the side they're on.
MOD_KEYS = {
    "KC_LCTL": (CTL, "L"), "KC_RCTL": (CTL, "R"),
    "KC_LSFT": (SFT, "L"), "KC_RSFT": (SFT, "R"),
    "KC_LALT": (ALT, "L"), "KC_RALT": (ALT, "R"), "KC_LOPT": (ALT, "L"), "KC_ROPT": (ALT, "R"),
    "KC_LGUI": (GUI, "L"), "KC_RGUI": (GUI, "R"), "KC_LCMD": (GUI, "L"), "KC_RCMD": (GUI, "R"),
}

# Modifier-wrapper functions: LCA(KC_J), S(KC_2), ...
MOD_FUNCS = {
    "C": {CTL}, "LCTL": {CTL}, "RCTL": {CTL},
    "S": {SFT}, "LSFT": {SFT}, "RSFT": {SFT},
    "A": {ALT}, "LALT": {ALT}, "RALT": {ALT}, "LOPT": {ALT}, "ROPT": {ALT}, "ALGR": {ALT},
    "G": {GUI}, "LGUI": {GUI}, "RGUI": {GUI}, "LCMD": {GUI}, "RCMD": {GUI}, "LWIN": {GUI}, "RWIN": {GUI},
    "LCA": {CTL, ALT}, "RCA": {CTL, ALT},
    "LSA": {SFT, ALT}, "RSA": {SFT, ALT}, "SAGR": {SFT, ALT},
    "SGUI": {SFT, GUI}, "SCMD": {SFT, GUI}, "SWIN": {SFT, GUI}, "LSG": {SFT, GUI}, "RSG": {SFT, GUI},
    "LAG": {ALT, GUI}, "RAG": {ALT, GUI},
    "LCG": {CTL, GUI}, "RCG": {CTL, GUI},
    "C_S": {CTL, SFT}, "LCS": {CTL, SFT}, "RCS": {CTL, SFT},
    "LCAG": {CTL, ALT, GUI},
    "MEH": {CTL, ALT, SFT},
    "HYPR": {CTL, ALT, SFT, GUI},
}

# Mod-tap shorthands: CTL_T(KC_ESC), ...
MOD_TAP_FUNCS = {f"{k}_T": v for k, v in MOD_FUNCS.items() if len(k) > 1}
MOD_TAP_FUNCS.update({"CTL_T": {CTL}, "SFT_T": {SFT}, "ALT_T": {ALT}, "OPT_T": {ALT},
                      "GUI_T": {GUI}, "CMD_T": {GUI}, "ALL_T": {CTL, ALT, SFT, GUI}})

MOD_MASKS = {
    "MOD_LCTL": {CTL}, "MOD_RCTL": {CTL},
    "MOD_LSFT": {SFT}, "MOD_RSFT": {SFT},
    "MOD_LALT": {ALT}, "MOD_RALT": {ALT},
    "MOD_LGUI": {GUI}, "MOD_RGUI": {GUI},
    "MOD_MEH": {CTL, ALT, SFT},
    "MOD_HYPR": {CTL, ALT, SFT, GUI},
}

BASIC = {
    "KC_SPC": "Space", "KC_SPACE": "Space",
    "KC_ENT": "Enter", "KC_ENTER": "Enter",
    "KC_BSPC": "⌫", "KC_BACKSPACE": "⌫",
    "KC_DEL": "⌦", "KC_DELETE": "⌦",
    "KC_TAB": "Tab", "KC_ESC": "Esc", "KC_ESCAPE": "Esc", "KC_CAPS": "Caps",
    "KC_LEFT": "←", "KC_RGHT": "→", "KC_RIGHT": "→", "KC_UP": "↑", "KC_DOWN": "↓",
    "KC_HOME": "Home", "KC_END": "End",
    "KC_PGUP": "PgUp", "KC_PAGE_UP": "PgUp", "KC_PGDN": "PgDn", "KC_PAGE_DOWN": "PgDn",
    "KC_INS": "Ins", "KC_PSCR": "PrtSc",
    "KC_GRV": "`", "KC_MINS": "-", "KC_EQL": "=", "KC_LBRC": "[", "KC_RBRC": "]",
    "KC_BSLS": "\\", "KC_SCLN": ";", "KC_QUOT": "'", "KC_COMM": ",", "KC_DOT": ".",
    "KC_SLSH": "/", "KC_NUHS": "#", "KC_NUBS": "\\",
    "KC_TILD": "~", "KC_EXLM": "!", "KC_AT": "@", "KC_HASH": "#", "KC_DLR": "$",
    "KC_PERC": "%", "KC_CIRC": "^", "KC_AMPR": "&", "KC_ASTR": "*", "KC_LPRN": "(",
    "KC_RPRN": ")", "KC_UNDS": "_", "KC_PLUS": "+", "KC_LCBR": "{", "KC_RCBR": "}",
    "KC_PIPE": "|", "KC_COLN": ":", "KC_DQUO": '"', "KC_LT": "<", "KC_GT": ">",
    "KC_QUES": "?",
    "KC_PPLS": "+", "KC_PMNS": "-", "KC_PAST": "*", "KC_PSLS": "/", "KC_PDOT": ".",
    "KC_PEQL": "=", "KC_PENT": "Enter", "KC_PCMM": ",", "KC_NUM": "NumLk",
    "KC_MUTE": "Mute", "KC_VOLU": "Vol+", "KC_VOLD": "Vol−",
    "KC_MPLY": "Play", "KC_MNXT": "Next", "KC_MPRV": "Prev", "KC_MSTP": "Stop",
    "KC_BRIU": "Bri+", "KC_BRID": "Bri−",
    "QK_BOOT": "Boot", "RESET": "Boot",
}
for _c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    BASIC[f"KC_{_c}"] = _c
for _d in "0123456789":
    BASIC[f"KC_{_d}"] = _d
    BASIC[f"KC_P{_d}"] = _d
for _n in range(1, 25):
    BASIC[f"KC_F{_n}"] = f"F{_n}"

SHIFTED = {
    "KC_GRV": "~", "KC_1": "!", "KC_2": "@", "KC_3": "#", "KC_4": "$", "KC_5": "%",
    "KC_6": "^", "KC_7": "&", "KC_8": "*", "KC_9": "(", "KC_0": ")", "KC_MINS": "_",
    "KC_EQL": "+", "KC_LBRC": "{", "KC_RBRC": "}", "KC_BSLS": "|", "KC_SCLN": ":",
    "KC_QUOT": '"', "KC_COMM": "<", "KC_DOT": ">", "KC_SLSH": "?",
}

NONE = {"KC_NO", "XXXXXXX"}
TRNS = {"KC_TRNS", "_______", "KC_TRANSPARENT"}


@dataclass
class Label:
    tap: str = ""
    hold: str = ""  # what happens when held (tap/hold keys), shown small
    mods: str = ""  # modifier glyphs sent with `tap`, shown above it
    kind: str = "key"  # key | mod | layer | combo | none | trns


def split_args(s: str) -> list[str]:
    """Split on commas that aren't nested inside parentheses."""
    out, depth, buf = [], 0, ""
    for ch in s:
        if ch == "," and depth == 0:
            out.append(buf.strip())
            buf = ""
            continue
        depth += ch == "("
        depth -= ch == ")"
        buf += ch
    if buf.strip():
        out.append(buf.strip())
    return out


def mods_glyphs(mods: set[str]) -> str:
    return "".join(MOD_GLYPH[m] for m in MOD_ORDER if m in mods)


# Shorter names for keys that appear after modifiers.
COMBO_SHORT = {"Enter": "↩", "Space": "␣", "Tab": "⇥", "Esc": "⎋"}


def combo_parts(mods: set[str], base: str) -> tuple[str, str]:
    """(modifier glyphs, key). A lone Shift on a key with a shifted symbol becomes the symbol."""
    if mods == {SFT} and base in SHIFTED:
        return "", SHIFTED[base]
    key = basic_label(base)
    return mods_glyphs(mods), COMBO_SHORT.get(key, key) if mods else key


def combo(mods: set[str], base: str) -> str:
    return "".join(combo_parts(mods, base))


def basic_label(code: str) -> str:
    if code in MOD_KEYS:
        mod, side = MOD_KEYS[code]
        return MOD_GLYPH[mod] if side == "L" else "R" + MOD_GLYPH[mod]
    return BASIC.get(code, re.sub(r"^(KC|QK)_", "", code))


def unwrap_mods(code: str) -> tuple[set[str], str]:
    """S(LCA(KC_X)) -> ({sft, ctl, alt}, 'KC_X')."""
    mods: set[str] = set()
    while (m := re.fullmatch(r"(\w+)\((.*)\)", code)) and m.group(1) in MOD_FUNCS:
        mods |= MOD_FUNCS[m.group(1)]
        code = m.group(2).strip()
    return mods, code


def mask_mods(mask: str) -> set[str]:
    mods: set[str] = set()
    for part in mask.split("|"):
        mods |= MOD_MASKS.get(part.strip(), set())
    return mods


def mask_label(mask: str) -> str:
    """MOD_LCTL -> "⌃", MOD_RALT -> "R⌥" (side matters for apps that watch right Alt)."""
    parts = [p.strip() for p in mask.split("|")]
    right = all(re.fullmatch(r"MOD_R(CTL|SFT|ALT|GUI)", p) for p in parts)
    return ("R" if right else "") + mods_glyphs(mask_mods(mask))


def macro_label(text: str) -> str:
    """Turn VIA macro text into the keys it sends, e.g. "{+KC_LCTL}j{-KC_LCTL}" -> "⌃J"."""
    held: set[str] = set()
    parts: list[str] = []
    typed = ""

    def flush_typed():
        nonlocal typed
        if typed:
            parts.append(typed)
            typed = ""

    for m in re.finditer(r"\{([^}]*)\}|([^{]+)", text):
        if m.group(2) is not None:
            for ch in m.group(2):
                if held:
                    flush_typed()
                    parts.append(mods_glyphs(held) + ch.upper())
                else:
                    typed += ch
            continue
        body = m.group(1).strip()
        if re.fullmatch(r"\d+", body):  # delay
            continue
        if body[:1] in "+-":
            code = body[1:].strip()
            if code in MOD_KEYS:
                (held.add if body[0] == "+" else held.discard)(MOD_KEYS[code][0])
            elif body[0] == "+":
                flush_typed()
                parts.append(mods_glyphs(held) + basic_label(code))
            continue
        flush_typed()  # chord tap: {KC_LCTL,KC_LALT,KC_LEFT}
        codes = [c.strip() for c in body.split(",") if c.strip()]
        mods = held | {MOD_KEYS[c][0] for c in codes if c in MOD_KEYS}
        keys = [c for c in codes if c not in MOD_KEYS]
        parts.append(combo(mods, keys[-1]) if keys else mods_glyphs(mods))

    flush_typed()
    return " ".join(parts)


def label_for(code: str, layer_names: list[str], macros: list[str]) -> Label:
    code = code.strip()
    if code in NONE:
        return Label(kind="none")
    if code in TRNS:
        return Label(kind="trns")
    if code in MOD_KEYS:
        return Label(basic_label(code), kind="mod")

    m = re.fullmatch(r"(\w+)\((.*)\)", code)
    if not m:
        return Label(basic_label(code))
    fn, args = m.group(1), split_args(m.group(2))

    def layer(n: str) -> str:
        i = int(n)
        return layer_names[i] if i < len(layer_names) else f"L{i}"

    if fn in MOD_FUNCS:
        mods, base = unwrap_mods(code)
        glyphs, key = combo_parts(mods, base)
        return Label(key, mods=glyphs, kind="combo" if glyphs else "key")
    if fn == "MO":
        return Label(layer(args[0]), "hold", kind="layer")
    if fn == "LT":
        return Label(label_for(args[1], layer_names, macros).tap, layer(args[0]), kind="key")
    if fn == "MT":
        return Label(label_for(args[1], layer_names, macros).tap, mask_label(args[0]))
    if fn in MOD_TAP_FUNCS:
        return Label(label_for(args[0], layer_names, macros).tap, mods_glyphs(MOD_TAP_FUNCS[fn]))
    if fn == "OSM":
        return Label(mask_label(args[0]), "once", kind="mod")
    if fn == "OSL":
        return Label(layer(args[0]), "once", kind="layer")
    if fn in ("TG", "TT"):
        return Label(layer(args[0]), "toggle", kind="layer")
    if fn in ("TO", "DF"):
        return Label(layer(args[0]), "switch", kind="layer")
    if fn == "LM":
        return Label(layer(args[0]), mask_label(args[1]), kind="layer")
    if fn == "MACRO":
        i = int(args[0])
        text = macros[i] if i < len(macros) else ""
        if not text:
            return Label(f"M{i}", kind="combo")
        sent = macro_label(text)
        m = re.fullmatch(r"([⌃⌥⇧⌘]+)([^⌃⌥⇧⌘ ]+)", sent)
        return Label(m.group(2), mods=m.group(1), kind="combo") if m else Label(sent, kind="combo")
    return Label(code)


# --------------------------------------------------------------------------
# SVG
# --------------------------------------------------------------------------

U = 58  # px per key unit
GAP = 3  # px between keycaps
PAD = 24
TITLE_H = 40
PANEL_GAP = 28

STYLE = """
  svg { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif; }
  .bg { fill: #f6f7f9; }
  .title { fill: #1f2328; font-size: 18px; font-weight: 600; }
  .subtitle { fill: #6b7280; font-size: 12px; }
  .cap { fill: #ffffff; stroke: #c8cdd5; stroke-width: 1; }
  .tap { fill: #1f2328; text-anchor: middle; dominant-baseline: central; font-weight: 500; }
  .hold { fill: #6b7280; text-anchor: middle; font-size: 9.5px; }
  .mods { fill: #146c3b; text-anchor: middle; font-size: 11px; letter-spacing: 1px; opacity: 0.8; }
  .k-mod .cap { fill: #eef1ff; stroke: #b8c0f0; }
  .k-mod .tap { fill: #3742b0; }
  .k-layer .cap { fill: #fff3e3; stroke: #f1c48a; }
  .k-layer .tap { fill: #a14f00; }
  .k-combo .cap { fill: #effaf3; stroke: #a9dcbc; }
  .k-combo .tap { fill: #146c3b; }
  .k-none .cap { fill: #eceef1; stroke: #dfe2e6; }
  .k-trns .cap { fill: #fafafa; stroke: #dfe2e6; stroke-dasharray: 3 2; }
  .k-trns .tap { fill: #a3a9b1; font-weight: 400; }
  .k-held .cap { fill: #f08c1a; stroke: #c96f0c; }
  .k-held .tap, .k-held .hold { fill: #ffffff; }
  .legend { fill: #6b7280; font-size: 11px; }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #16181d; }
    .title { fill: #e6e8eb; }
    .subtitle, .hold, .legend { fill: #8b929c; }
    .cap { fill: #23262d; stroke: #3a3f48; }
    .tap { fill: #e6e8eb; }
    .k-mod .cap { fill: #22284a; stroke: #3d4785; }
    .k-mod .tap { fill: #a9b3ff; }
    .k-layer .cap { fill: #3a2a14; stroke: #7a5320; }
    .k-layer .tap { fill: #ffbe73; }
    .k-combo .cap { fill: #15301f; stroke: #2e6b45; }
    .k-combo .tap, .mods { fill: #8ee0ad; }
    .k-none .cap { fill: #1c1e23; stroke: #2a2e35; }
    .k-trns .cap { fill: #1c1e23; stroke: #3a3f48; }
    .k-trns .tap { fill: #5d636c; }
    .k-held .cap { fill: #d9780f; stroke: #f08c1a; }
  }
"""


def font_size(text: str) -> float:
    n = len(text)
    if n <= 2:
        return 18
    if n <= 3:
        return 15
    if n <= 4:
        return 13
    if n <= 6:
        return 11
    return 9.5


def render_key(key: Key, lbl: Label, extra_class: str = "") -> str:
    x, y = key.x * U + GAP / 2, key.y * U + GAP / 2
    w, h = key.w * U - GAP, key.h * U - GAP
    cx = x + w / 2
    cls = f"k-{lbl.kind} {extra_class}".strip()
    transform = f' transform="rotate({key.r} {key.rx * U} {key.ry * U})"' if key.r else ""
    out = [f'<g class="{cls}"{transform}>',
           f'<rect class="cap" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="7"/>']
    if lbl.mods:
        out.append(f'<text class="mods" x="{cx:.1f}" y="{y + 15:.1f}">{escape(lbl.mods)}</text>')
    if lbl.tap:
        ty = y + h / 2 - (6 if lbl.hold else 0) + (6 if lbl.mods else 0)
        out.append(f'<text class="tap" x="{cx:.1f}" y="{ty:.1f}" '
                   f'font-size="{font_size(lbl.tap)}">{escape(lbl.tap)}</text>')
    if lbl.hold:
        out.append(f'<text class="hold" x="{cx:.1f}" y="{y + h - 7:.1f}">{escape(lbl.hold)}</text>')
    out.append("</g>")
    return "".join(out)


LAYER_KEY = r"(MO|LT|TT|LM)\(\s*{n}\s*[,)]"


def holders(layers: list[list[str]], target: int) -> list[list[int]]:
    """Ways to reach `target` by holding keys, as lists of positions.

    A base-layer key gives [pos]. A key on layer k that leads to `target`
    (e.g. a tri-layer MO(3) on Sym) gives [the base key for k, pos].
    """
    pat = re.compile(LAYER_KEY.format(n=target))
    ways = [[i] for i, code in enumerate(layers[0]) if pat.match(code)]
    for k in range(1, len(layers)):
        if k == target:
            continue
        via = [i for i, code in enumerate(layers[0]) if re.match(LAYER_KEY.format(n=k), code)]
        for i, code in enumerate(layers[k]):
            if pat.match(code) and via:
                ways.append([via[0], i])
    return ways


def render(layout: dict, layer_names: list[str]) -> str:
    keys = parse_kle(KLE)
    layers: list[list[str]] = layout["layers"]
    macros: list[str] = layout.get("macros", [])

    xs = [px for k in keys.values() for px, _ in k.corners()]
    ys = [py for k in keys.values() for _, py in k.corners()]
    min_x, min_y = min(xs), min(ys)
    board_w = (max(xs) - min_x) * U
    board_h = (max(ys) - min_y) * U
    panel_h = TITLE_H + board_h

    width = board_w + PAD * 2
    height = PAD + len(layers) * (panel_h + PANEL_GAP) + 20 + PAD
    title = layout.get("name", "Keyboard layout")

    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" '
        f'viewBox="0 0 {width:.0f} {height:.0f}">',
        f"<title>{escape(title)}</title>",
        f"<style>{STYLE}</style>",
        f'<rect class="bg" width="{width:.0f}" height="{height:.0f}"/>',
    ]

    base_labels = [label_for(c, layer_names, macros) for c in layers[0]]
    for li, layer in enumerate(layers):
        top = PAD + li * (panel_h + PANEL_GAP)
        name = layer_names[li] if li < len(layer_names) else f"Layer {li}"
        ways = holders(layers, li) if li else []
        held = {i for way in ways for i in way}
        # "hold Space", "hold the Sym key", "hold Sym + Num"
        def key_name(i: int) -> str:
            code = layers[0][i]
            return base_labels[i].tap if code.startswith("LT(") else base_labels[i].tap or f"#{i}"
        descs = []
        for way in {tuple(sorted(w)): w for w in ways}.values():  # Sym+Num == Num+Sym
            if len(way) == 1 and not layers[0][way[0]].startswith("LT("):
                descs.append(f"the {key_name(way[0])} key")
            else:
                descs.append(" + ".join(key_name(i) for i in way))
        how = "hold " + " or ".join(dict.fromkeys(descs)) if descs else ""
        out.append(f'<text class="title" x="{PAD}" y="{top + 22}">{li} · {escape(name)}</text>')
        if how:
            out.append(f'<text class="subtitle" x="{PAD + 14 + 10 * len(name) + 40}" y="{top + 22}">'
                       f"{escape(how)}</text>")
        out.append(f'<g transform="translate({PAD - min_x * U:.1f} {top + TITLE_H - min_y * U:.1f})">')
        for idx, key in sorted(keys.items()):
            code = layer[idx] if idx < len(layer) else "KC_NO"
            lbl = label_for(code, layer_names, macros)
            extra = ""
            if idx in held:
                lbl = Label(base_labels[idx].tap if layers[0][idx].startswith("MO(") else name,
                            "held", kind="layer")
                extra = "k-held"
            elif lbl.kind == "trns" and li:
                b = base_labels[idx]
                lbl = Label(b.tap, b.hold, kind="trns")
            out.append(render_key(key, lbl, extra))
        out.append("</g>")

    legend_y = height - PAD
    out.append(
        f'<text class="legend" x="{PAD}" y="{legend_y:.0f}">'
        "Small text = action when held  ·  dashed = falls through to base  ·  "
        "orange = key holding this layer  ·  green = shortcut / combo  ·  blue = modifier</text>"
    )
    out.append("</svg>")
    return "\n".join(out) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("layout", type=Path, help="VIA layout export (.json)")
    ap.add_argument("-o", "--output", type=Path, help="output .svg (default: next to the input)")
    ap.add_argument("--names", default="Base,Sym,Num,Nav", help="comma-separated layer names (default: %(default)s)")
    args = ap.parse_args()

    layout = json.loads(args.layout.read_text())
    n = len(layout["layers"])
    names = [s.strip() for s in args.names.split(",")] if args.names else []
    names += ["Base" if i == 0 else f"Layer {i}" for i in range(len(names), n)]

    out = args.output or args.layout.with_suffix(".svg")
    out.write_text(render(layout, names))
    print(out)


if __name__ == "__main__":
    main()
