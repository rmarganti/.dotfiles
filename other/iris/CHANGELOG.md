# Iris layout changelog

Changes to `iris-layout.json`, newest first. Run `./iris-layout-to-svg.py iris-layout.json`
to refresh `iris-layout.svg`, and `git log -p --follow iris-layout.json` to see the full diff
for any entry.

## 2026-11-12

- The unused left thumb key now holds Hyper (Ctrl+Opt+Shift+Cmd).
  - It stays available on SYM, NUM and NAV through transparent bindings.
- The SVG labels the modifier-only chord as Hyper.

## 2026-11-09

- Add herdr-app shortcuts to the NUM layer:
  - W/E send Cmd+[/] for the previous/next agent.
  - S/D send Option+Cmd+[/] for the previous/next space.

## 2026-11-06

- Holding Space turns on the Nav layer, so navigating takes one thumb.
  - Window management keys mirror the Rectangle Pro bindings: halves,
    thirds, two-thirds, fifths and displays.
- NUM is now a right-hand 10-key, with 0 on the thumb.
  - Its home-row mods follow Mac keyboard order: Shift, Ctrl, Opt, Cmd.
- The SYM and NUM thumb keys swap sides.
- Backspace moves to the right outer thumb on tap, with Right Opt on hold.
- Macros are replaced with mod-wrapped keycodes so they auto-repeat.

## Before 2026-11-06

- The first layout in this repo, as exported from VIA.
