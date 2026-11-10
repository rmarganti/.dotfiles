// Pixel ducks for the agents list. Each agent is a dusk duck:
//   plumage  - its space's color, mixed into slate
//   headgear - its own, kept per agent so siblings in a space differ
//   behavior - its status: paddling, a "!", a splash, or asleep
//   eye      - cyan on the focused agent, slate on the rest
// Sub-agents are hatless ducklings in their parent's plumage.

import { div } from "gpui-kit";

const PX = 2;

// Art is drawn facing right, toward the row's text. Rows above the head are
// headroom for hats. `E` is the eye, `O`/`o` the beak.
const HEADROOM = 3;
const DUCK = [
  "......LLLL.....",
  ".....LYYYYY....",
  ".....YYYYEYOO..",
  ".....YYYYYYOOo.",
  "......YYYYY....",
  "..L...SYYYS....",
  ".LYYLLYYYYYY...",
  ".YYYYYSSSYYYY..",
  ".SYYYYYSSYYYY..",
  "..SYYYYYYYYYS..",
  "...SSSSSSSSS...",
];
const DUCKLING = [
  "....LLL....",
  "...LYYEYO..",
  "...YYYYYOo.",
  "....YYYY...",
  ".Y.YYYYYY..",
  ".YYYYSSYYY.",
  "..SYYYYYYS.",
  "...SSSSSS..",
];

// Hats sit over the head: row 0 is the first headroom row (3 above the head's
// top). `.` leaves the duck showing through. Colors are hat-local letters.
export const HATS = {
  none: { rows: [] },
  beanie: {
    rows: [
      ".......P.......",
      "......HHHH.....",
      ".....HHHHHH....",
      ".....BBBBBB....",
    ],
    colors: { P: "#cfc6b0", H: "#8a6f73", B: "#6e5a5e" },
  },
  cap: {
    rows: [
      "...............",
      "......CCC......",
      ".....CCCCCC....",
      ".....CCCCCCKK..",
    ],
    colors: { C: "#5f7e8a", K: "#476470" },
  },
  headphones: {
    rows: [
      "...............",
      "...............",
      "......BBBB.....",
      ".....B.........",
      "....MM.........",
      "....MM.........",
    ],
    colors: { B: "#9da9a0", M: "#2e3539" },
  },
  crest: {
    rows: [
      ".......T.......",
      "......TT.......",
      ".......T.......",
    ],
    colors: { T: "#9da9a0" },
  },
  bow: {
    rows: [
      "...............",
      "...............",
      "....RR.RR......",
      ".....RRR.......",
    ],
    colors: { R: "#b07e8a" },
  },
  // Pinned agents wear this instead of their own.
  crown: {
    rows: [
      "...............",
      ".....G.G.G.....",
      ".....GGGGG.....",
      "......GGG......",
    ],
    colors: { G: "#c9a96a" },
  },
};
export const HAT_NAMES = ["none", "beanie", "headphones", "cap", "crest", "bow"];

const SLATE = { Y: "#4b565c", L: "#5f6b70", S: "#3a4347", D: "#2e3539" };
const BEAK = { O: "#527a86", o: "#41626c" };
const EYE = { on: "#aeccc6", off: "#77817d" };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, f) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * f));

// Slate pulled toward the space's color: enough to tell flocks apart, not
// enough to compete with the space avatars above.
export function plumage(hue, f = 0.2) {
  if (!hue) return SLATE;
  return { Y: mix(SLATE.Y, hue, f), L: mix(SLATE.L, hue, f * 1.05), S: mix(SLATE.S, hue, f * 0.8), D: mix(SLATE.D, hue, f * 0.55) };
}

// Same-colored runs as one div each, so a row is a few elements.
function paint(rows, colors, dy, out) {
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (row[end + 1] === ch) end++;
      if (ch !== "." && colors[ch]) {
        out.push(div().absolute().left(x * PX).top((y + dy) * PX).w((end - x + 1) * PX).h(PX).bg(colors[ch]));
      }
      x = end + 1;
    }
  });
}

// A small stable number from a string, for desyncing bobs.
export function hash(s) {
  let h = 0;
  for (const ch of s ?? "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * One duck, sized to sit at the front of a row.
 * { status, hue, hat, focused, small, seed, blockedColor, waterColor }
 */
export function duck({ strength, status, hue, hat = "none", focused = false, small = false, seed = 0, blockedColor = "#dbbc7f", waterColor = "#87b5c1" }) {
  const art = small ? DUCKLING : DUCK;
  const head = small ? 0 : HEADROOM;
  const w = art[0].length * PX;
  const h = (art.length + head) * PX;
  const asleep = status === "idle";
  const colors = { ...plumage(hue, strength), ...BEAK, E: asleep ? null : focused ? EYE.on : EYE.off };
  if (asleep) colors.E = plumage(hue, strength).D;

  const pixels = [];
  paint(art, colors, head, pixels);
  if (!small && HATS[hat]?.rows.length) paint(HATS[hat].rows, HATS[hat].colors, 0, pixels);

  const working = status === "working";
  // Each agent bobs on its own period, so a busy list shimmers instead of marching.
  const sprite = div()
    .absolute()
    .left(0)
    .w(w)
    .h(h)
    .when(working, (el) => el.loop("top", { from: 0, to: 1, period: 820 + (seed % 7) * 60 }))
    .when(!working, (el) => el.top(0))
    .children(pixels);

  const waterY = h - 2 * PX;
  return div()
    .relative()
    .flex_none()
    .w(w)
    .h(h)
    .child(sprite)
    // Sitting in a sliver of water.
    .child(div().absolute().left(-PX).top(waterY).w(w + 2 * PX).h(1).bg(waterColor + "40"))
    .when(working, (el) =>
      el.child(
        div()
          .absolute()
          .left(-6)
          .top(waterY + 2)
          .w(10)
          .h(4)
          .loop("opacity", { from: 0.1, to: 0.6, period: 700 + (seed % 5) * 40 })
          .child(div().absolute().left(0).top(0).w(5).h(1).bg(waterColor))
          .child(div().absolute().left(3).top(3).w(5).h(1).bg(waterColor)),
      ),
    )
    .when(status === "done", (el) =>
      el.child(
        div()
          .absolute()
          .left(-PX)
          .top(waterY - 3 * PX)
          .w(w + 2 * PX)
          .h(3 * PX)
          .loop("opacity", { from: 0.15, to: 0.75, period: 1600 })
          .child(div().absolute().left(0).top(PX).w(PX).h(PX).bg(waterColor))
          .child(div().absolute().left(w).top(0).w(PX).h(PX).bg(waterColor)),
      ),
    )
    .when(status === "blocked", (el) =>
      el.child(
        div()
          .absolute()
          .left(w - PX)
          .top(small ? 0 : PX)
          .w(PX)
          .h(5 * PX)
          .loop("opacity", { from: 0.4, to: 1, period: 1400 })
          .child(div().absolute().left(0).top(0).w(PX).h(3 * PX).bg(blockedColor))
          .child(div().absolute().left(0).top(4 * PX).w(PX).h(PX).bg(blockedColor)),
      ),
    );
}
