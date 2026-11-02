// Launchables: one picker (cmd-p) for everything you'd start or go to.
//
//   1. tabs that need you        4. running spaces
//   2. configured launchables    5. new tab / new space (here, or on a machine)
//   3. the other open tabs       6. zoxide folders
//
// Configured launchables come from `.launchables.json` (nearest project file,
// then ~/.config/.launchables.json) on the focused space's machine; the schema
// is shared with the Herdr TUI plugin (dots/.config/herdr/local-plugins/
// herdr-launchables). Type to filter (fzf syntax), ↑/↓ or ctrl-n/p to move,
// Enter to go, ctrl-d to close an open tab, Esc to leave.
//
// Where it lives: a floating block in the layout, top center, that draws
// nothing until `launchables.open` (keys.json: "cmd-p": "launchables.open"):
//
//   "floating": [{ "id": "launchables", "content": { "mod": "launchables" }, "edge": "top", "align": "center" }]
//
// Not an overlay, because Herdr's mod runtime is slow on code's first runs
// (building the rows takes seconds in a fresh copy, ~100 ms warm) and every
// overlay is a fresh copy; this copy stays alive and warm, keeps the last
// discovery to show at once, and outlives its own launches. Opened as an
// overlay instead (mod.open), it still works: slower, and it stays open
// ("Launching…") until a launch is done, since closing would cancel it.
//
// The runtime also gives each slice of work a time budget and drops a render
// that runs long, so render only reads what's computed: rows are rebuilt
// after discovery or when spaces/agents change, ranking reruns only when the
// query does, and match highlights are computed for the rows on screen.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, Scrollbar, v_virtual_list, VirtualListScrollHandle } from "gpui-base";
import {
  agents, closeOverlay, exec, focused, hc, home, knownAgents, nextCommand, notify, panes, props, readTextFile,
  run, spaces, theme,
} from "herdr";
import { discoverConfig, discoverZoxide } from "./lib/discover.js";
import { matchPositions, parseQuery, rankIndexes } from "./lib/fuzzy.js";
import { execute } from "./lib/launch.js";
import { basename } from "./lib/path.js";
import { buildRows, zoxideAction } from "./lib/plan.js";

const WIDTH = 680;
const ROW_HEIGHT = 34;
const LIST_MAX_HEIGHT = 440;
// Herdr's own icons. A mod's own SVGs don't load from a symlinked mod folder
// (this one lives in dotfiles), so borrow shipped ones; they match the app.
const KIND_ICONS = {
  workspace: "mods/workspace-chrome/layers.svg",
  "open-space": "mods/workspace-chrome/layers.svg",
  tab: "mods/workspace-chrome/terminal.svg",
  "open-tab": "mods/workspace-chrome/terminal.svg",
  pane: "mods/pane/split-right.svg",
  background: "mods/workspace-chrome/clock.svg",
  "idle-panes": "icons/shell.svg",
  folder: "mods/workspace-chrome/folder.svg",
  new: "mods/workspace-chrome/plus.svg",
};
const SEARCH_ICON = "mods/workspace-chrome/search.svg";
const SPINNER_ICON = "mods/workspace-chrome/spinner.svg";

// Actions Herdr does in one command.
const DIRECT = {
  "focus-tab": (a) => [["space.select", { id: a.space }], ["tab.select", { id: a.tab }]],
  "focus-space": (a) => [["space.select", { id: a.space }]],
  "new-tab": (a) => [["tab.new", a.space ? { space: a.space } : {}]],
  "new-space": (a) => [["space.new", a.machine ? { machine: a.machine } : {}]],
};

const SOURCE_COLOR = {
  "project-config": "ansi3",
  "global-config": "ansi6",
  running: "ansi4",
  zoxide: "ansi2",
  new: "muted",
};

// ----------------------------------------------------------------
// Herdr-backed api and io for lib/launch.js and lib/discover.js
// ----------------------------------------------------------------

async function herdrDo(name, args) {
  const r = await exec("herdr-app", ["do", name, JSON.stringify(args ?? {})]);
  let out = null;
  try {
    out = JSON.parse(r.stdout);
  } catch {}
  if (r.code !== 0 || !out || out.error) throw new Error(out?.error ?? (r.stderr || r.stdout || `${name} failed`).trim());
  return out;
}

/**
 * Where each space is now: its first tab's first terminal's live folder.
 * A space's `folder` is only where it was made (AGENTS.md: "Where a space is
 * now is its terminals' live folders").
 */
async function spaceLocations() {
  const [layoutR, termsR] = await Promise.all([exec("herdr-app", ["ls"]), hc(["ls", "--json"])]);
  const cwd = new Map();
  const terminals = JSON.parse(termsR.stdout || "{}").terminals ?? [];
  for (let i = 0; i < terminals.length; i++) cwd.set(terminals[i].address, terminals[i].cwd);
  const out = new Map();
  for (const space of JSON.parse(layoutR.stdout || "{}").spaces ?? []) {
    const first = space.tabs?.[0]?.terminals?.[0]?.terminal;
    if (first && cwd.get(first)) out.set(space.id, cwd.get(first));
  }
  return out;
}

/** Live spaces as plain objects, with where each one is now. */
function spacesWithLocations(locations) {
  const list = spaces();
  const out = [];
  for (let i = 0; i < list.length; i++) out.push({ ...list[i], location: locations.get(list[i].id) ?? null });
  return out;
}

const api = {
  do: herdrDo,
  hc: (args) => hc(args),
  ls: async () => JSON.parse((await exec("herdr-app", ["ls"])).stdout),
  spaces: async () => spacesWithLocations(await spaceLocations().catch(() => new Map())),
  idleTerminals: async () => panes().filter((p) => p.terminal && p.program?.shell).map((p) => p.terminal),
  sleep: (ms) => exec("sleep", [String(ms / 1000)]),
};

const io = {
  readTextFile: (path, { on } = {}) => readTextFile(path, { on }),
  exec: (cmd, args, options) => exec(cmd, args, options),
};

async function machineHome(machine) {
  if (!machine) return home();
  const r = await exec("sh", ["-c", 'printf %s "$HOME"'], { on: machine });
  return r.code === 0 ? r.stdout.trim() : "";
}

async function connectedMachines() {
  const r = await hc(["machine", "ls", "--json"]);
  if (r.code !== 0) return [];
  const out = [];
  for (const m of JSON.parse(r.stdout).machines ?? []) if (m.state === "connected" && !m.temporary) out.push(m.name);
  return out;
}

async function launch(request) {
  try {
    await execute(api, request.action);
  } catch (error) {
    notify({ title: `Couldn't launch ${request.title}`, body: String(error?.message ?? error), level: "error", timeout: 8000 });
  }
}

// ----------------------------------------------------------------
// Rendering helpers
// ----------------------------------------------------------------

function firstWord(command) {
  const words = command.trim().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) return basename(words[i]).toLowerCase();
  }
  return "";
}

function programIcon(t, program, size) {
  if (!program?.icon) return null;
  return program.tint
    ? svg(program.icon).size(size).flex_none().text_color(program.color ?? t.foreground)
    : image(program.icon).w(size).h(size).flex_none();
}

/** Splits `text` into runs, marking those at `positions` (sorted). */
function highlightRuns(text, positions) {
  const runs = [];
  let k = 0;
  let i = 0;
  while (i < text.length) {
    const hit = k < positions.length && positions[k] === i;
    let j = i;
    while (j < text.length && (k < positions.length && positions[k] === j) === hit) {
      if (hit) k++;
      j++;
    }
    runs.push({ text: text.slice(i, j), hit });
    i = j;
  }
  return runs;
}

// ----------------------------------------------------------------
// The picker
// ----------------------------------------------------------------

export default class Launchables extends View {
  init(initialProps, cx) {
    // Only an overlay copy (mod.open) has an overlay id. Anything else, the
    // floating block included, waits hidden for `launchables.open`; that's also
    // the safe default when props() comes back null, as it has after a hot reload.
    this.floating = !(props()?.overlay ?? initialProps?.overlay);
    this.visible = !this.floating;
    this.query = "";
    this.groups = [];
    this.at = 0;
    this.ctx = null;
    this.config = [];
    this.zoxide = [];
    this.machines = [];
    this.locations = new Map();
    this.programs = new Map();
    this.rows = [];
    this.texts = [];
    this.lowers = [];
    this.order = [];
    this.liveKey = null;
    this.loading = false;
    this.launching = null;
    this.generation = 0;

    this.input = InputState.new({ placeholder: "Launch or go to…" });
    this.input.on("change", (_e, cx) => {
      this.query = this.input.value();
      this.refilter();
      this.at = 0;
      this.scroll.scroll_to_item(0);
      cx.notify();
    });
    this.input.on("submit", (_e, cx) => this.go(this.selected(), cx));
    this.scroll = VirtualListScrollHandle.new();
    this.handle = cx.focus_handle();

    if (this.floating) {
      cx.spawn(async (cx) => {
        for (;;) {
          const command = await nextCommand();
          if (command === "open") this.open(cx);
          else if (command === "toggle") this.visible ? this.dismiss(cx) : this.open(cx);
          else if (command === "close") this.dismiss(cx);
          // Using cx lets a hot reload end this loop; without it the old build keeps the commands.
          cx.notify();
        }
      });
      // Run discovery, row building and ranking once while hidden, so the first cmd-p is warm too.
      cx.timer.after(1500, (cx) => {
        if (this.visible) return;
        this.prepare();
        this.discover(cx);
      });
    } else {
      this.open(cx);
    }
  }

  async close() {
    this.scroll?.release();
  }

  /** Shows the picker for where the person is now, and refreshes what it offers. */
  open(cx) {
    this.prepare();
    this.visible = true;
    this.input.focus();
    // The input isn't in the tree until this render; focus it once it is.
    cx.timer.after(16, () => this.input.focus());
    cx.timer.after(120, () => this.input.focus());
    this.discover(cx);
  }

  /** Takes the focused space, tab, pane and folder as the context, and resets the query. */
  prepare() {
    const f = focused();
    const space = spaces().find((s) => s.id === f?.space);
    const machine = space?.machine ?? null;
    const previous = this.ctx;
    this.ctx = {
      space: f?.space ?? null,
      tab: f?.tab ?? null,
      pane: f?.pane ?? null,
      machine,
      cwd: f?.cwd || space?.folder || (machine ? "" : home()),
      home: machine ? (previous?.machine === machine ? previous.home : "") : home(),
    };
    // What the last open found is shown at once unless the machine changed; discovery replaces it.
    if (previous?.machine !== machine) {
      this.config = [];
      this.zoxide = [];
    }
    this.launching = null;
    this.query = "";
    this.input.set_value("");
    this.at = 0;
    this.rebuild();
  }

  discover(cx) {
    const generation = ++this.generation;
    this.loading = true;
    const ctx = this.ctx;
    const current = () => generation === this.generation;
    const update = (apply) => {
      if (!current()) return;
      apply();
      this.rebuild();
      cx.notify();
    };
    cx.spawn(async (cx) => {
      if (ctx.machine && !ctx.home) ctx.home = await machineHome(ctx.machine).catch(() => "");
      const config = ctx.home ? await discoverConfig(io, { cwd: ctx.cwd, machine: ctx.machine, home: ctx.home }) : { entries: [], errors: [] };
      if (!current()) return;
      if (config.errors.length && this.visible) {
        notify({
          title: "Launchables: invalid config",
          body: config.errors.slice(0, 6).join("\n") + (config.errors.length > 6 ? `\n…and ${config.errors.length - 6} more` : ""),
          level: "warning",
          timeout: 10000,
        });
      }
      update(() => (this.config = config.entries));
      const [zoxide, machines, locations] = await Promise.all([
        discoverZoxide(io, { machine: ctx.machine }),
        connectedMachines().catch(() => []),
        spaceLocations().catch(() => new Map()),
      ]);
      update(() => {
        this.zoxide = zoxide;
        this.machines = machines;
        this.locations = locations;
        this.loading = false;
      });
      if (!this.visible && current()) {
        // Warming up: give the matcher its first (slow) runs now rather than on the first keystroke.
        const groups = parseQuery("a b");
        rankIndexes(groups, this.texts, this.lowers);
        for (let i = 0; i < Math.min(this.texts.length, 20); i++) matchPositions(groups, this.texts[i]);
      }
      // Program icons only decorate rows; they can come last.
      const known = await knownAgents({ on: ctx.machine }).catch(() => []);
      for (const program of known) this.addProgram(program);
      for (const pane of panes()) this.addProgram(pane.program);
      if (current()) cx.notify();
    });
  }

  addProgram(program) {
    if (!program?.icon || program.key === "program" || program.key === "shell") return;
    for (const name of [program.key, program.name]) {
      if (name && !this.programs.has(name.toLowerCase())) this.programs.set(name.toLowerCase(), program);
    }
  }

  /** What the rows depend on that can change while the picker is open. */
  currentLiveKey() {
    return JSON.stringify(spaces()) + JSON.stringify(agents());
  }

  rebuild() {
    if (!this.ctx) return;
    this.liveKey = this.currentLiveKey();
    this.rows = buildRows({
      ctx: this.ctx,
      configEntries: this.config,
      spaces: spacesWithLocations(this.locations),
      agents: agents(),
      machines: this.machines,
      zoxide: this.zoxide,
      home: home(),
    });
    const texts = [];
    const lowers = [];
    for (let i = 0; i < this.rows.length; i++) {
      texts.push(this.rows[i].search);
      lowers.push(this.rows[i].search.toLowerCase());
    }
    this.texts = texts;
    this.lowers = lowers;
    this.refilter();
  }

  refilter() {
    this.groups = parseQuery(this.query);
    this.order = rankIndexes(this.groups, this.texts, this.lowers);
    this.at = Math.max(0, Math.min(this.at, this.order.length - 1));
  }

  selected() {
    return this.rows[this.order[this.at]];
  }

  dismiss(cx) {
    if (!this.floating) return closeOverlay(props().overlay);
    this.visible = false;
    this.generation++;
    // Give the keyboard back to the pane the picker was opened from.
    if (this.ctx?.pane) run("pane.focus", { pane: this.ctx.pane });
    cx?.notify();
  }

  go(row, cx) {
    if (!row || this.launching) return;
    const action = row.action ?? zoxideAction(row.folder, this.ctx.machine);
    const direct = DIRECT[action.type];
    if (direct) {
      this.dismiss(cx);
      for (const [name, args] of direct(action)) run(name, args);
      return;
    }
    const request = { title: row.title, action };
    if (this.floating) {
      // The launch focuses what it makes, so don't hand focus back to the source pane.
      this.visible = false;
      this.generation++;
      cx?.notify();
      cx?.spawn(async () => launch(request));
      return;
    }
    // An overlay's tasks end when it closes: launch first, then close.
    this.launching = row.title;
    cx?.notify();
    cx?.spawn(async () => {
      await launch(request);
      this.dismiss();
    });
  }

  closeTab(row) {
    if (row?.kind !== "open-tab") return false;
    run("tab.close", { id: row.action.tab });
    return true;
  }

  icon(t, row) {
    const color = t[SOURCE_COLOR[row.source]] ?? t.muted;
    if (row.kind === "open-tab" && row.status === "working") {
      return svg(SPINNER_ICON).size(14).flex_none().text_color(t.working).spin(900);
    }
    const program = row.program ?? (row.command ? this.programs.get(firstWord(row.command)) : null);
    return programIcon(t, program, 15) ?? svg(KIND_ICONS[row.kind]).size(15).flex_none().text_color(color);
  }

  title(t, row) {
    const text = row.title;
    if (!this.groups.length) return div().flex_1().min_w(0).truncate().text_color(t.foreground).child(text);
    const runs = highlightRuns(text, matchPositions(this.groups, text));
    return h_flex()
      .flex_1()
      .min_w(0)
      .overflow_hidden()
      .text_color(t.foreground)
      .children(runs.map((r) => div().flex_none().whitespace_nowrap().when(r.hit, (d) => d.text_color(t.accent).font_semibold()).child(r.text)));
  }

  badge(t, row) {
    if (row.status === "blocked") return div().flex_none().text_size(11).text_color(t.blocked).child("needs you");
    if (row.status === "done") return div().flex_none().text_size(11).text_color(t.done).child("finished");
    return null;
  }

  row(t, row, selected) {
    const badge = this.badge(t, row);
    const meta = row.source === "project-config" || row.source === "global-config" ? `${row.detail} ${row.kind}` : row.detail;
    return h_flex()
      .id(`lr-${row.id}`)
      .h(ROW_HEIGHT)
      .mx(4)
      .px(10)
      .gap(10)
      .items_center()
      .rounded(7)
      .cursor_pointer()
      .when(selected, (el) => el.bg(t.hover))
      .hover((s) => s.bg(t.hover))
      .child(this.icon(t, row))
      .child(this.title(t, row))
      .when(Boolean(badge), (el) => el.child(badge))
      .when(Boolean(meta), (el) => el.child(div().flex_none().max_w(220).truncate().text_size(11).text_color(t.dim).child(meta)));
  }

  render(cx) {
    if (!this.visible) return div();
    const t = theme();
    // Spaces or agents changed while open: rebuild in a slice of its own.
    if (!this.rebuilding && this.currentLiveKey() !== this.liveKey) {
      this.rebuilding = true;
      cx.spawn(async (cx) => {
        this.rebuild();
        this.rebuilding = false;
        cx.notify();
      });
    }
    const count = this.order.length;
    const move = (delta) => {
      if (!count) return;
      this.at = (this.at + delta + count) % count;
      this.scroll.scroll_to_item(this.at);
    };

    const listHeight = Math.min(LIST_MAX_HEIGHT, Math.max(count, 1) * ROW_HEIGHT + 4);
    const list = count
      ? v_flex()
          .relative()
          .h(listHeight)
          .child(
            v_virtual_list(
              "launchables-rows",
              count,
              ROW_HEIGHT,
              (index) => this.rows[this.order[index]].id,
              (range) => {
                const out = [];
                for (let i = range.start; i < range.end; i++) out.push(this.row(t, this.rows[this.order[i]], i === this.at));
                return out;
              },
            )
              .size_full()
              .track_scroll(this.scroll)
              .on_item_click((key) => this.go(this.rows.find((row) => row.id === key), cx)),
          )
          .child(Scrollbar.vertical("launchables-rows").absolute().inset_0())
      : div().px(10).py(8).text_color(t.dim).child(this.loading ? "Loading…" : "Nothing matches");

    return v_flex()
      .id("launchables")
      .track_focus(this.handle)
      .when(this.floating, (el) => el.w(WIDTH))
      .when(!this.floating, (el) => el.w_full().bg(t.popover))
      .min_h(0)
      .p(18)
      .gap(10)
      .text_size(13)
      // A floating block can be dragged by any press it doesn't stop.
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_key_down((e, cx) => {
        const ctrl = e.modifiers?.control;
        if (e.key === "escape") return this.dismiss(cx);
        if (e.key === "down" || (ctrl && e.key === "n")) move(1);
        else if (e.key === "up" || (ctrl && e.key === "p")) move(-1);
        else if (ctrl && e.key === "d") {
          if (!this.closeTab(this.selected())) return;
        } else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(
        h_flex()
          .items_center()
          .gap(8)
          .child(div().flex_1().text_size(15).font_semibold().text_color(t.foreground).child(this.launching ? `Launching ${this.launching}…` : "Launch"))
          .when(this.loading, (el) => el.child(svg(SPINNER_ICON).size(12).text_color(t.dim).spin(900)))
          .child(div().text_size(11).text_color(t.dim).child("Esc")),
      )
      .child(
        h_flex()
          .h(36)
          .flex_none()
          .px(10)
          .gap(8)
          .items_center()
          .rounded(9)
          .border_1()
          .border_color(t.accent)
          .bg(t.background)
          .child(svg(SEARCH_ICON).size(15).text_color(t.dim))
          .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)),
      )
      .child(list)
      .child(
        h_flex()
          .gap(14)
          .text_size(11)
          .text_color(t.dim)
          .child("↵ open")
          .child("⌃n/⌃p move")
          .child("⌃d close tab")
          .child(div().flex_1())
          .child(`${count} ${count === 1 ? "item" : "items"}`),
      );
  }
}
