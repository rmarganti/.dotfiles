// The popup copy: overdue, today's and the next 7 days' tasks, with quick add.
// j/k move, x completes, o opens in Todoist, a (or /) adds, r reloads, Esc closes.
// In the add field: Enter adds (quick add syntax), Esc or ↓ goes back to the list.

import { div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, run, props, closeOverlay, theme, notify } from "herdr";
import { readToken, all, quickAdd, closeTask, taskUrl, TOKEN_HELP } from "./client.js";

const QUERY = "overdue | next 7 days";
const SECTIONS = [
  ["overdue", "Overdue"],
  ["today", "Today"],
  ["upcoming", "Next 7 days"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEAD_H = 33;
const ROW_H = 31;
const PROJECT_H = 15;
const MAX_LIST_H = 440;

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "YYYY-MM-DD" (all day) or "YYYY-MM-DDTHH:MM:SS[Z]" (with a time). Without a zone it's local.
function parseDue(due) {
  const hasTime = due.date.length > 10;
  const [y, m, d] = due.date.slice(0, 10).split("-").map(Number);
  return { key: due.date.slice(0, 10), at: hasTime ? new Date(due.date) : new Date(y, m - 1, d), hasTime };
}

function section(task, now) {
  const due = parseDue(task.due);
  const today = dayKey(now);
  if (due.key < today || (due.hasTime && due.key === today && due.at < now)) return "overdue";
  return due.key === today ? "today" : "upcoming";
}

function dueLabel(task, where) {
  const { at, hasTime } = parseDue(task.due);
  const time = hasTime ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  const date = where === "today" ? "" : where === "upcoming" ? DAYS[at.getDay()] : `${MONTHS[at.getMonth()]} ${at.getDate()}`;
  return [date, time].filter(Boolean).join(" ") + (task.due.is_recurring ? " ↻" : "");
}

// The API's priority 4 is the app's p1.
function priorityColor(t, priority) {
  return { 4: t.ansi1, 3: t.ansi3, 2: t.ansi4 }[priority] ?? t.dim;
}

export default class TaskList {
  init(cx) {
    this.tasks = [];
    this.projects = {};
    this.at = 0;
    this.loading = true;
    this.error = null;
    this.message = null;
    this.handle = cx.focus_handle();
    this.input = InputState.new({ placeholder: "Add a task: Pay rent tomorrow p1 #Home" });
    this.inputFocused = false;
    this.input.on("focus", (_e, cx) => { this.inputFocused = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.inputFocused = false; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.add(cx));
    this.handle.focus();
    cx.timer.after(600, () => { if (!this.inputFocused) this.handle.focus(); });
    this.load(cx);
  }

  close() {
    closeOverlay(props().overlay);
  }

  // Tasks in display order, each with its section.
  rows() {
    const now = new Date();
    const order = Object.fromEntries(SECTIONS.map(([k], i) => [k, i]));
    return this.tasks
      .filter((task) => task.due)
      .map((task) => ({ task, where: section(task, now), due: parseDue(task.due).at }))
      .sort((a, b) => order[a.where] - order[b.where] || a.due - b.due || b.task.priority - a.task.priority || a.task.child_order - b.task.child_order);
  }

  load(cx) {
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        const token = await readToken();
        const [tasks, projects] = await Promise.all([all(token, "tasks/filter", { query: QUERY }), all(token, "projects")]);
        this.tasks = tasks;
        this.projects = Object.fromEntries(projects.map((p) => [p.id, p.name]));
        this.error = null;
      } catch (e) {
        this.error = String(e?.message ?? e);
      }
      this.loading = false;
      cx.notify();
    });
  }

  complete(row, cx) {
    if (!row) return;
    const before = this.tasks;
    this.tasks = this.tasks.filter((task) => task.id !== row.task.id);
    this.message = `Completed “${row.task.content}”`;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        await closeTask(await readToken(), row.task.id);
        run("todoist.refresh");
      } catch (e) {
        this.tasks = before;
        this.message = `Couldn't complete “${row.task.content}”: ${e?.message ?? e}`;
      }
      cx.notify();
    });
  }

  add(cx) {
    const text = this.input.value().trim();
    if (!text || this.adding) return;
    this.adding = true;
    cx.spawn(async (cx) => {
      try {
        const task = await quickAdd(await readToken(), text);
        this.input.set_value("");
        this.message = `Added “${task.content}”${task.due ? ` · ${task.due.string}` : " · no due date"}`;
        run("todoist.refresh");
        this.load(cx);
      } catch (e) {
        this.message = `Couldn't add the task: ${e?.message ?? e}`;
      }
      this.adding = false;
      cx.notify();
    });
  }

  open(row) {
    if (!row) return;
    exec("open", [taskUrl(row.task.id)]);
    this.close();
  }

  key(e, cx, rows) {
    const k = e.key;
    if (this.inputFocused) {
      if (k !== "escape" && k !== "down") return;
      this.handle.focus();
    } else if (k === "escape") return this.close();
    else if (k === "j" || k === "down") this.at = Math.min(this.at + 1, rows.length - 1);
    else if (k === "k" || k === "up") this.at = Math.max(this.at - 1, 0);
    else if (k === "x" || k === "space") this.complete(rows[this.at], cx);
    else if (k === "o" || k === "enter") this.open(rows[this.at]);
    else if (k === "a" || k === "/") this.input.focus();
    else if (k === "r") this.load(cx);
    else return;
    cx.stop_propagation();
    cx.notify();
  }

  render() {
    const t = theme();
    const rows = this.rows();
    this.at = Math.max(0, Math.min(this.at, rows.length - 1));
    const listFocused = !this.inputFocused;

    const head = (label, count) => h_flex().px(10).pt(12).pb(4).gap(6).text_size(11).font_semibold()
      .text_color(label === "Overdue" ? t.blocked : t.dim)
      .child(label).child(div().text_color(t.dim).font_normal().child(String(count)));

    const row = (r, i) => {
      const on = listFocused && i === this.at;
      const color = priorityColor(t, r.task.priority);
      const project = this.projects[r.task.project_id];
      return h_flex().id(`td-${r.task.id}`).mx(4).px(10).py(6).gap(10).items_center().rounded(7).cursor_pointer()
        .when(on, (el) => el.bg(t.hover))
        .hover((s) => s.bg(t.hover))
        .on_click((_e, cx) => { this.at = i; this.handle.focus(); cx.notify(); })
        .child(div().id(`td-done-${r.task.id}`).size(14).flex_none().rounded(7).border_1().border_color(color)
          .hover((s) => s.bg(color))
          .on_click((_e, cx) => { this.complete(r, cx); cx.stop_propagation(); }))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().text_color(t.foreground).child(r.task.content))
          .when(Boolean(project), (el) => el.child(div().truncate().text_size(11).text_color(t.dim).child(`#${project}`))))
        .child(div().flex_none().text_size(11).text_color(r.where === "overdue" ? t.blocked : t.dim).child(dueLabel(r.task, r.where)));
    };

    // A popup is as tall as its content, so the list needs a height of its own.
    const body = [];
    let height = 8;
    for (const [where, label] of SECTIONS) {
      const mine = rows.filter((r) => r.where === where);
      if (!mine.length) continue;
      body.push(head(label, mine.length));
      height += HEAD_H;
      for (const r of mine) {
        body.push(row(r, rows.indexOf(r)));
        height += this.projects[r.task.project_id] ? ROW_H + PROJECT_H : ROW_H;
      }
    }

    let status = null;
    if (this.error) {
      status = this.error === "no token in Keychain" ? `No Todoist token. Add one with: ${TOKEN_HELP}` : `Couldn't load tasks: ${this.error}`;
    } else if (this.loading && !this.tasks.length) status = "Loading…";
    else if (!rows.length) status = "Nothing due in the next 7 days.";

    return v_flex().id("todoist-list").track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx, rows))
      .w_full().min_h(0).p(14).gap(10).bg(t.popover).text_size(13).text_color(t.foreground)
      .child(h_flex().items_center().gap(8)
        .child(div().flex_1().text_size(15).font_semibold().child("Todoist"))
        .when(this.loading && this.tasks.length > 0, (el) => el.child(div().text_size(11).text_color(t.dim).child("Refreshing…")))
        .child(div().text_size(11).text_color(t.dim).child("Esc")))
      .child(h_flex().h(34).flex_none().px(10).items_center().rounded(8).border_1()
        .border_color(this.inputFocused ? t.accent : t.input).bg(t.background)
        .child(div().text_color(t.dim).pr(8).child("+"))
        .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)))
      .when(Boolean(this.message), (el) => el.child(div().px(2).text_size(11.5).text_color(t.muted).truncate().child(this.message)))
      .child(v_flex().id("td-rows").h(status ? 40 : Math.min(MAX_LIST_H, height)).flex_none().overflow_y_scrollbar()
        .when(Boolean(status), (el) => el.child(div().p(10).text_color(t.dim).child(status)))
        .children(body))
      .child(div().text_size(11).text_color(t.dim).child("j/k move · x done · o open · a add · r reload"));
  }
}
