# launchables

A Herdr app mod: one picker (`cmd-p`) for everything you'd start or go to. It is the Desktop port of the TUI plugin at `dots/.config/herdr/local-plugins/herdr-launchables`, reads the same `.launchables.json` files (see that README for the schema), and replaces the shipped `picker` mod.

Rows, in the order an empty query shows them:

1. tabs that need you (blocked, then finished)
2. configured launchables: the nearest project `.launchables.json`, then `~/.config/.launchables.json`, read on the focused space's machine
3. the other open tabs, on every machine
4. running spaces not already covered by a configured workspace
5. new tab, new space, new space on each connected machine
6. zoxide folders on the focused space's machine

Type to filter with fzf's syntax (`'exact`, `^prefix`, `suffix$`, `!not`, `a | b`). Use ↑/↓ or ctrl-n/ctrl-p to move, Enter to go, ctrl-d to close an open tab, and Esc to leave.

## Setup

- `layouts/neverforest.json`: a floating block at the root, `{ "id": "launchables", "content": { "mod": "launchables" }, "edge": "top", "align": "center" }`. It draws nothing until opened.
- `keys.json`: `"cmd-p": "launchables.open"` (`launchables.toggle` and `launchables.close` also work).
- `mise.toml` links the mod folder into `~/.config/herdr-app/mods`.

A layout without the floating block can still open the picker with `mod.open {name: "launchables"}`. It works as an overlay, but more slowly, and it stays open ("Launching…") until a launch finishes.

## How it maps onto the TUI plugin

| TUI plugin | Here |
|---|---|
| overlay pane + detached `apply` process | a persistent floating block that launches directly |
| `fzf` | `lib/fuzzy.js`: fzf's v1 algorithm and scoring |
| `herdr workspace/tab/pane …` | `herdr-app do space.new / tab.new / pane.split`, `hc send` |
| `pane rename` | none: the Herdr app has no pane names, so a pane's `name` is accepted and ignored |
| `--ratio` splits | none in Herdr: a run of panes in one direction is split as a balanced tree (2 and 4 come out even) |
| `background` log files | `hc run --bg`, labelled `launchables.background=<key>`; `hc read <t>` shows its output |
| `idle-panes` process check | panes whose program is a shell |
| `worktree.created` copy hook | none needed: a linked worktree without its own config uses the primary checkout's, resolved from the worktree |

A workspace launchable matches a running space by name, then by the name Herdr gave it, then by where its first terminal is now. Selecting one that matches focuses that space instead of building it again.

Commands: a tab's first pane is a fresh shell, so its command is typed in, as in the TUI plugin. Every other pane runs the command through the person's login shell (bash, zsh or sh; not fish) and keeps `commandMode`. Split panes start gated and run their commands only once the whole tab exists, because a command that ends at once (`exit-on-success`) would otherwise close a pane that is still to be split from.

## Runtime notes

Herdr's mod runtime is slow the first time any code runs: building the rows takes seconds in a fresh copy and about 100 ms once warm. A long render is dropped ("could not be re-rendered: interrupted"). So:

- The picker lives in the layout, not in an overlay: an overlay is a fresh copy on every open, while the floating block stays alive and warm.
- About 1.5 s after it starts, it does a discovery, row build and ranking while hidden. Until that finishes (roughly 10–20 s after the app or layout starts), `cmd-p` is queued, not lost.
- `render` only reads what's already computed. Rows are rebuilt when discovery or live spaces/agents change, ranking reruns only when the query changes, and highlights are computed only for the rows on screen.
- New blocks added to the layout that's already showing don't start until you switch layouts (switch away and back), or restart the app.
- A mod's own SVGs don't load from a symlinked mod folder, so the icons are Herdr's shipped ones.

## Tests

```sh
npm test                    # unit tests (node)
npm run test:integration    # drives the running app in a throwaway space it closes afterwards
herdr-app check ~/.config/herdr-app/mods/launchables
```
