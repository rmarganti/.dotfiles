// A pixel rubber duck living in a little pond below the agents list.
// Agents working: the duck paddles around. Someone blocked: a "!" over its head.
// All at rest: it drifts, half asleep. Click it for a quack.

import { View, div } from "gpui-kit";
import { agents } from "herdr";

const PX = 3; // one art pixel, in logical px
const HEIGHT = 64;
const WATER = 44; // y of the waterline

// A duck at dusk, from Neverforest: slate body, cyan eye, deep teal beak.
const C = {
  Y: "#4b565c", // body
  L: "#5f6b70", // highlight
  S: "#3a4347", // shade
  D: "#2e3539", // deep shade, closed eye
  O: "#527a86", // beak
  o: "#41626c", // beak shade
  E: "#aeccc6", // eye
};

// Facing right. `E` is the eye; it closes while the duck dozes.
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
const DUCK_W = DUCK[0].length * PX;
const DUCK_H = DUCK.length * PX;
// How far the duck sits in the water.
const DUCK_TOP = WATER - DUCK_H + 2 * PX;

// One art row as runs of same-colored pixels, so a row is a few divs, not fifteen.
function pixels(rows, { flip, asleep }) {
  const out = [];
  rows.forEach((raw, y) => {
    let row = flip ? [...raw].reverse().join("") : raw;
    if (asleep) row = row.replace("E", "D");
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (row[end + 1] === ch) end++;
      if (ch !== ".") {
        out.push(div().absolute().left(x * PX).top(y * PX).w((end - x + 1) * PX).h(PX).bg(C[ch]));
      }
      x = end + 1;
    }
  });
  return out;
}

const dot = (x, y, w, color, h = 1) => div().absolute().left(x).top(y).w(w).h(h).bg(color);

export default class Duck extends View {
  init(_props, cx) {
    this.width = 0;
    this.x = null; // the duck's left edge; null until the pond is measured
    this.flip = false;
    this.moveMs = 5000;
    this.quack = false;
    this.swim(cx, 1500);
  }

  mood() {
    const all = agents();
    return {
      working: all.some((a) => a.status === "working"),
      blocked: all.some((a) => a.status === "blocked"),
    };
  }

  // Each stroke picks a spot, glides there, then rests a beat before the next.
  // Only redraws while something works; at rest the timer just looks and waits.
  swim(cx, delay) {
    cx.timer.after(delay, (cx) => {
      const room = this.width - DUCK_W - 2 * PX - 34; // keep clear of the reeds
      if (this.mood().working && room > 24) {
        let next = 2 * PX + Math.random() * room;
        if (Math.abs(next - this.x) < 18) next = this.x < room / 2 ? next + room / 2 : next - room / 2;
        next = Math.max(2 * PX, Math.min(2 * PX + room, next));
        this.flip = next < this.x;
        this.moveMs = 2500 + Math.abs(next - this.x) * 35;
        this.x = Math.round(next);
        cx.notify();
        this.swim(cx, this.moveMs + 800 + Math.random() * 2200);
      } else {
        this.swim(cx, 2000);
      }
    });
  }

  render() {
    const { working, blocked } = this.mood();
    const narrow = this.width > 0 && this.width < 120;
    if (this.x === null && this.width > 0) this.x = Math.round((this.width - DUCK_W) / 2) - 10;
    const x = narrow ? Math.round((this.width - DUCK_W) / 2) : this.x ?? 0;
    const asleep = !working && !blocked;
    // Swimming, it faces where it's going. Stopped, it turns to look into the
    // pond rather than at the nearer edge.
    const flip = working ? this.flip : x + DUCK_W / 2 > (this.width - 34) / 2;
    const water = "#87b5c1";

    // Above the waterline: the duck bobbing, with what it's thinking.
    const duck = div()
      .absolute()
      .left(x)
      .top(0)
      .w(DUCK_W)
      .h(HEIGHT)
      .transition("left", { duration: this.moveMs, easing: "ease-in-out" })
      .id("duck")
      .cursor_pointer()
      .on_click((_e, cx) => {
        this.quack = true;
        cx.notify();
        cx.timer.after(1400, (cx) => {
          this.quack = false;
          cx.notify();
        });
      })
      .child(
        div()
          .absolute()
          .left(0)
          .w(DUCK_W)
          .h(DUCK_H)
          .loop("top", working
            ? { from: DUCK_TOP, to: DUCK_TOP + 2, period: 900 }
            : { from: DUCK_TOP, to: DUCK_TOP + 1, period: 4200 })
          .children(pixels(DUCK, { flip, asleep })),
      )
      // A wake trailing behind while it paddles.
      .when(working, (el) =>
        el.child(
          div()
            .absolute()
            .top(WATER + 2)
            .left(flip ? DUCK_W - 2 : -10)
            .w(12)
            .h(4)
            .loop("opacity", { from: 0.15, to: 0.7, period: 700 })
            .child(dot(flip ? 2 : 0, 0, 8, water))
            .child(dot(flip ? 0 : 4, 3, 8, water)),
        ),
      )
      .when(blocked, (el) =>
        el.child(
          div()
            .absolute()
            .left(flip ? 2 * PX : DUCK_W - 4 * PX)
            .top(DUCK_TOP - 5 * PX)
            .w(PX)
            .h(5 * PX)
            .loop("opacity", { from: 0.35, to: 1, period: 1400 })
            .child(dot(0, 0, PX, C.Y, 3 * PX))
            .child(dot(0, 4 * PX, PX, C.Y, PX)),
        ),
      )
      .when(asleep && !this.quack, (el) =>
        el.child(
          div()
            .absolute()
            .left(flip ? -4 : DUCK_W - 6)
            .top(DUCK_TOP - 16)
            .text_size(9)
            .font_family("JetBrains Mono")
            .text_color("#77817d")
            .frames(["z", "z", "zz", "zzZ", "zzZ", " "], 1100),
        ),
      )
      .when(this.quack, (el) =>
        el.child(
          div()
            .absolute()
            .left(flip ? -22 : DUCK_W - 14)
            .top(DUCK_TOP - 16)
            .text_size(9)
            .font_family("JetBrains Mono")
            .text_color(C.L)
            .child("quack!"),
        ),
      );

    // Reeds and a lily pad at the right edge; still, apart from one firefly at night.
    const W = this.width;
    const reeds = div()
      .absolute()
      .left(W - 30)
      .top(0)
      .w(30)
      .h(HEIGHT)
      .child(dot(8, 18, 2, "#4b565c", WATER - 16))
      .child(dot(7, 14, 4, "#9c8862", 8))
      .child(dot(15, 24, 2, "#4b565c", WATER - 22))
      .child(dot(14, 21, 4, "#9c8862", 6))
      .child(dot(21, 30, 2, "#4b565c", WATER - 28))
      .when(asleep, (el) =>
        el.child(dot(2, 8, 2, "#dbbc7f", 2).loop("opacity", { from: 0, to: 0.8, period: 5200 })));

    const pad = dot(Math.max(0, W - 64), WATER + 4, 14, "#5a7a64", 3)
      .rounded(2)
      .loop("left", { from: Math.max(0, W - 64), to: Math.max(0, W - 61), period: 9000 });

    // The waterline drawn over the duck's belly, so it sits in the water, not on it.
    const ripples = [0.12, 0.38, 0.66].map((f, i) =>
      dot(Math.round(W * f), WATER + 6 + (i % 2) * 5, 10 + i * 3, water)
        .opacity(0.25)
        .loop("left", { from: Math.round(W * f), to: Math.round(W * f) + 6, period: 6000 + i * 1700 }));

    return div()
      .id("pond")
      .relative()
      .size_full()
      .overflow_hidden()
      .on_size_change((size, cx) => {
        this.width = size.width;
        if (this.x !== null) this.x = Math.max(2 * PX, Math.min(this.x, size.width - DUCK_W - 36));
        cx.notify();
      })
      .when(W > 0, (el) =>
        el
          .when(!narrow, (el) => el.child(reeds).child(pad).children(ripples))
          .child(duck)
          .child(dot(0, WATER, W, "#87b5c11f", HEIGHT - WATER))
          .child(dot(0, WATER, W, "#87b5c13d", 1)),
      );
  }
}
