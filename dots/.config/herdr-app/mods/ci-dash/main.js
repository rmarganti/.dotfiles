// Locally owned GitHub Actions dashboard. See README.md and LICENSE.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState } from "gpui-base";
import { spaces, panes, focused, theme, notify, props, layout, run, shared, setShared } from "herdr";
import { Gh, resolveRepo, errorHint } from "./gh.js";
import { relTime, duration, stateOf, GLYPH } from "./format.js";
import { Dispatch } from "./dispatch.js";
import { icon, pill, searchBox, filterChip, busy } from "./ui.js";

const POLL_MS = 5000;

// Runs are grouped by what the person has to do about them.
const RUN_GROUPS = [
  { id: "live", label: "IN PROGRESS", filter: "Running", color: (t) => t.working },
  { id: "attention", label: "NEEDS ATTENTION", filter: "Failed", color: (t) => t.ansi1 },
  { id: "passed", label: "PASSED", filter: "Passed", color: (t) => t.ansi2 },
  { id: "other", label: "OTHER", filter: "Other", color: (t) => t.dim },
];
const groupOf = (run) => {
  const kind = stateOf(run).kind;
  if (kind === "running" || kind === "queued") return "live";
  if (kind === "failure" || kind === "warning") return "attention";
  return kind === "success" ? "passed" : "other";
};

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function panelShown() {
  const root = layout();
  return !find(root, "panel")?.hidden && find(root, "panel-body")?.active === "ci-dash";
}

function togglePanel() {
  if (panelShown()) run("layout.hide", { id: "panel" });
  else {
    run("layout.select", { stack: "panel-body", child: "ci-dash" });
    run("layout.show", { id: "panel" });
  }
}

// gh's and git's own wording for the common "nothing to show here" cases, said plainly.
function friendlyError(text) {
  if (/not a git repository/i.test(text)) return { title: "This folder is not a git repository.", hint: "Focus a terminal inside a repository that has a GitHub remote, and CI runs follows it." };
  if (/no git remotes|none of the git remotes|could not determine.*repo/i.test(text)) return { title: "This repository has no GitHub remote.", hint: "Add one with git remote add origin <url>, or focus a terminal in another repository." };
  if (/Could not resolve to a Repository/i.test(text)) return { title: "None of your GitHub logins can see this repository.", hint: "Log in with an account that has access: gh auth login, then press ⟳." };
  if (/not logged in|gh auth login/i.test(text) && !/Could not start gh/.test(text)) return { title: "GitHub CLI is not logged in.", hint: "Run gh auth login in a terminal, then press ⟳." };
  return null;
}

export default class CiDash extends View {
  init(given, cx) {
    // Read props once, here, and keep them: props() inside a later callback can
    // answer for another copy. Fall back to props() when the argument is empty.
    this.props = (given && Object.keys(given).length ? given : props()) || {};
    const panels = shared("workspace.panels") ?? ["files", "changes"];
    if (!panels.includes("ci-dash")) setShared("workspace.panels", [...panels, "ci-dash"]);
    if (this.props.button) return;
    this.tab = this.props.tab === "dispatch" ? "dispatch" : "runs";
    this.key = null; this.context = null;
    this.repo = null; this.gh = null; this.error = null;
    this.runFilter = this.makeFilter("Filter runs…");
    this.reset();
    cx.timer.every(POLL_MS, (cx) => this.tick(cx));
  }

  makeFilter(placeholder) {
    const state = InputState.new({ placeholder });
    state.on("change", (_e, cx) => cx.notify());
    return state;
  }

  reset() {
    this.runs = []; this.runsLoading = false; this.runsError = null; this.runsLoaded = false;
    this.lastRunsFetch = 0;
    this.detail = null; this.confirm = null; this.actionBusy = false;
    this.note = ""; this.announced = new Set();
    this.runStatus = RUN_GROUPS.some((g) => g.id === this.props.status) ? this.props.status : "all";
    this.runFilter.set_value(String(this.props.filter || ""));
    if (this.dsp) this.dsp.reset();
    else this.dsp = new Dispatch(this);
  }

  enterTab(cx) {
    if (this.tab === "dispatch") this.dsp.load(cx);
    else this.loadRuns(cx, true);
  }

  visible() {
    return !this.props.panel || panelShown();
  }

  location() {
    const f = focused();
    const space = spaces().find((s) => s.id === f?.space) || spaces().find((s) => s.active);
    const all = panes(), tabs = new Set((space?.tabs ?? []).map((t) => t.id));
    const pane = all.find((p) => p.pane === f?.pane && p.cwd)
      || (f?.cwd ? { cwd: f.cwd, terminal: f.terminal } : null)
      || all.find((p) => p.tab === f?.tab && p.cwd)
      || all.find((p) => tabs.has(p.tab) && p.cwd);
    const on = f?.pane === null
      ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null)
      : space?.machine ?? null;
    if (pane) {
      this.lastLocation = { cwd: pane.cwd, on, branch: pane.branch || null, space: space?.id };
    }
    const last = this.lastLocation?.space === space?.id ? this.lastLocation : null;
    return pane ? this.lastLocation : last || { cwd: space?.folder, on, branch: null };
  }

  ensureContext(cx) {
    const context = this.location();
    this.branch = context.branch;
    const key = JSON.stringify([context.on, context.cwd, this.props.repo]);
    if (key === this.key) return;
    this.key = key; this.context = context;
    // Invalidate controls immediately, before the new repository resolves.
    this.repo = null; this.gh = null; this.error = null;
    this.reset();
    cx.spawn(async (cx) => {
      try {
        if (!context.cwd && !this.props.repo) throw new Error("No folder to look for a repository in.");
        const repo = await resolveRepo({ ...context, override: this.props.repo });
        const gh = new Gh({ repo, ...context });
        repo.login = await gh.getLogin();
        if (this.context !== context) return;
        this.repo = repo; this.gh = gh;
        this.loadRuns(cx);
        this.enterTab(cx);
      } catch (e) {
        if (this.context === context) this.error = e;
      }
      cx.notify();
    });
  }

  // ---- polling -----------------------------------------------------------

  tick(cx) {
    if (!this.visible() || !this.gh) return;
    if (this.dsp.locate) this.dsp.tryLocate(cx);
    const d = this.detail;
    if (d && this.tab === "runs") {
      d.tick += 1;
      const live = !stateOf(d.run).done || (d.hold && Date.now() < d.hold);
      const due = d.tick <= 12 || (d.tick <= 60 ? d.tick % 2 === 0 : d.tick % 6 === 0);
      if (live && due) this.pollDetail(cx);
      else cx.notify();
    }
    const live = this.runs.some((r) => !stateOf(r).done);
    const interval = live ? POLL_MS : 30000;
    if (Date.now() - this.lastRunsFetch >= interval) this.loadRuns(cx, true);
  }

  // ---- runs --------------------------------------------------------------

  loadRuns(cx, silent = false) {
    const gh = this.gh;
    if (!gh || this.runsLoading) return;
    this.runsLoading = true;
    this.lastRunsFetch = Date.now();
    if (!silent) this.runsError = null;
    cx.spawn(async (cx) => {
      try {
        const runs = await gh.listRuns(30);
        if (this.gh !== gh) return;
        if (this.runsLoaded) {
          const before = new Map(this.runs.map((r) => [r.id, stateOf(r).done]));
          for (const r of runs) if (before.get(r.id) === false && stateOf(r).done) this.announce(r);
        }
        this.runs = runs; this.runsLoaded = true; this.runsError = null;
      } catch (e) {
        if (this.gh === gh) this.runsError = e;
      } finally {
        if (this.gh === gh) this.runsLoading = false;
        cx.notify();
      }
    });
    cx.notify();
  }

  announce(run) {
    const key = `${run.id}:${run.run_attempt ?? 1}`;
    if (this.announced.has(key)) return;
    this.announced.add(key);
    const st = stateOf(run);
    notify({
      title: `CI ${st.label}: ${run.name || "workflow"}`,
      body: `#${run.run_number ?? "?"} · ${run.head_branch || ""} · ${duration(run.run_started_at || run.created_at, run.updated_at)}`,
      level: st.kind === "success" ? "success" : st.kind === "failure" ? "error" : "info",
    });
  }

  openRun(id, cx) {
    this.confirm = null;
    this.detail = { id, run: this.runs.find((r) => r.id === id) || null, jobs: [], error: null, tick: 0, inFlight: false, live: false, hold: 0, attempt: 0 };
    this.tab = "runs";
    this.note = "";
    this.pollDetail(cx);
    cx.notify();
  }

  pollDetail(cx) {
    const d = this.detail, gh = this.gh;
    if (!d || !gh || d.inFlight) return;
    d.inFlight = true;
    cx.spawn(async (cx) => {
      try {
        const [run, jobs] = await Promise.all([gh.getRun(d.id), gh.listJobs(d.id)]);
        if (this.detail !== d || this.gh !== gh) return;
        // Right after a rerun GitHub can still answer with the old attempt.
        const stale = d.hold && Date.now() < d.hold && run.run_attempt === d.attempt;
        d.run = stale ? { ...run, status: "queued", conclusion: null } : run;
        d.jobs = stale ? [] : jobs;
        d.error = null;
        const st = stateOf(d.run);
        if (!st.done) d.live = true;
        if (st.done) {
          if (d.live) { d.live = false; this.announce(run); }
        }
      } catch (e) {
        if (this.detail === d) d.error = e;
      } finally {
        d.inFlight = false;
        cx.notify();
      }
    });
  }

  requestAction(label, cx) {
    if (!this.detail || !this.gh || this.actionBusy) return;
    this.confirm = { label, detail: this.detail, gh: this.gh };
    cx.notify();
  }

  confirmAction(cx) {
    const action = this.confirm;
    if (!action || this.actionBusy || action.detail !== this.detail || action.gh !== this.gh) return;
    const { label, detail: d, gh } = action;
    this.confirm = null; this.actionBusy = true; this.note = `${label}…`;
    cx.spawn(async (cx) => {
      try {
        if (label === "Cancel") await gh.cancelRun(d.id);
        else await gh.rerunRun(d.id);
        if (this.gh !== gh || this.detail !== d) return;
        if (label === "Rerun") {
          Object.assign(d, { tick: 0, live: true, hold: Date.now() + 20000, attempt: d.run?.run_attempt ?? 0 });
          d.run = { ...d.run, status: "queued", conclusion: null };
        }
        this.note = `${label} requested.`;
        this.pollDetail(cx);
        this.loadRuns(cx, true);
      } catch (e) {
        if (this.gh === gh) this.note = `${label} failed: ${e.message || e}`;
      } finally {
        if (this.gh === gh) this.actionBusy = false;
        cx.notify();
      }
    });
    cx.notify();
  }

  openWeb(cx) {
    const d = this.detail, gh = this.gh;
    if (!d || !gh) return;
    cx.spawn(async (cx) => {
      try { await gh.openRunWeb(d.id); }
      catch (e) { if (this.gh === gh) this.note = `Open failed: ${e.message || e}`; }
      cx.notify();
    });
  }

  // ---- UI pieces ---------------------------------------------------------

  color(kind, t) {
    return { success: t.ansi2, failure: t.ansi1, warning: t.ansi3, running: t.working, queued: t.blocked, neutral: t.dim }[kind] ?? t.dim;
  }

  icon(state, t) {
    if (state.kind === "running") return svg(icon("spinner")).size(14).flex_none().text_color(t.working).spin(900);
    return div().w(14).flex_none().text_center().text_size(13).text_color(this.color(state.kind, t)).child(GLYPH[state.kind] ?? "•");
  }

  /** The tinted status pill: `passed`, `failed`, `running`… */
  statePill(state, t) {
    const label = state.label === "success" ? "passed" : state.label;
    return pill(t, { label, color: this.color(state.kind, t), glyph: state.kind === "running" ? undefined : GLYPH[state.kind], spin: state.kind === "running" });
  }

  button(id, label, onClick, t, { primary = false, active = false, disabled = false } = {}) {
    return div().id(id).h(26).px(10).flex_none().flex().items_center().rounded(7).text_size(12)
      .border_1().border_color(active || primary ? t.accent : t.border)
      .text_color(disabled ? t.dim : active || primary ? t.accent : t.muted)
      .when(!disabled, (e) => e.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => onClick(cx)))
      .child(label);
  }

  header(t, cx) {
    const tab = (id, label, count) => {
      const active = this.tab === id;
      return h_flex().id(`tab-${id}`).h(28).px(10).gap(6).flex_none().items_center().rounded(8).text_size(12)
        .bg(active ? t.raised : t.background).border_1().border_color(active ? t.border : t.background)
        .text_color(active ? t.foreground : t.muted).cursor_pointer().hover((s) => s.bg(active ? t.raised : t.hover))
        .on_click((_e, cx) => {
          this.tab = id; this.note = "";
          if (id === "runs") { this.detail = null; this.confirm = null; }
          this.enterTab(cx);
          cx.notify();
        })
        .child(label)
        .when(count != null, (e) => e.child(div().h(16).px(6).rounded(8).flex().items_center().text_size(10)
          .bg(active ? t.hover : t.raised).text_color(t.dim).child(String(count))));
    };
    return v_flex().flex_none()
      .child(h_flex().h(38).flex_none().px(12).gap(8).items_center()
        .child(div().font_semibold().flex_none().child("CI runs"))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(this.repo ? this.repo.slug : ""))
        .child(this.button("refresh", "⟳", (cx) => {
          if (!this.gh) { this.key = null; this.ensureContext(cx); }
          else if (this.tab === "dispatch") { this.dsp = new Dispatch(this); this.dsp.load(cx); }
          else if (this.detail) this.pollDetail(cx);
          else this.loadRuns(cx);
        }, t)))
      .when(Boolean(this.repo), (e) => e.child(div().px(12).pb(5).text_size(11).text_color(t.dim)
        .child(`Account: ${this.repo.login} · ${this.repo.host}`)))
      .child(h_flex().h(40).flex_none().px(10).gap(4).items_center().border_b(1).border_color(t.border)
        .child(tab("runs", "Runs", this.runsLoaded ? this.runs.length : null))
        .child(tab("dispatch", "Dispatch", this.dsp.loaded ? this.dsp.workflows.length : null)));
  }

  message(t, title, detail) {
    return v_flex().flex_1().min_h(0).p(16).gap(6).child(div().text_color(t.foreground).child(title)).when(Boolean(detail), (e) => e.child(div().text_size(12).text_color(t.dim).child(detail)));
  }

  errorView(t, error) {
    const text = error?.message || String(error);
    const friendly = friendlyError(text);
    return friendly ? this.message(t, friendly.title, friendly.hint) : this.message(t, text, errorHint(error));
  }

  /** Title and #number on top, then pills: branch, status, duration, trigger. */
  runRow(r, t) {
    const st = stateOf(r), now = Date.now();
    const dur = duration(r.run_started_at || r.created_at, st.done ? r.updated_at : now);
    const by = [r.name, r.actor?.login].filter(Boolean).join(" · ");
    return v_flex().id(`run-${r.id}`).w_full().flex_none().px(14).py(8).gap(6).cursor_pointer().hover((s) => s.bg(t.hover))
      .on_click((_e, cx) => this.openRun(r.id, cx))
      .child(h_flex().gap(10).items_center()
        .child(this.icon(st, t))
        .child(div().flex_1().min_w(0).truncate().text_size(14).child(r.display_title || r.name || `Run ${r.id}`))
        .child(div().flex_none().text_size(11).text_color(t.dim).child(`#${r.run_number}`))
        .child(div().flex_none().text_size(11).text_color(t.dim).child(relTime(r.created_at, now))))
      .child(h_flex().pl(24).flex_wrap().gap(6).items_center()
        .when(Boolean(r.head_branch), (e) => e.child(pill(t, { label: r.head_branch, symbol: "branch", code: true })))
        .child(this.statePill(st, t))
        .when(Boolean(dur), (e) => e.child(pill(t, { label: dur })))
        .when(Boolean(r.event) && r.event !== "push", (e) => e.child(pill(t, { label: r.event.replace(/_/g, " "), color: t.accent })))
        .when((r.run_attempt ?? 1) > 1, (e) => e.child(pill(t, { label: `attempt ${r.run_attempt}` })))
        .when(Boolean(by), (e) => e.child(div().min_w(0).truncate().text_size(11).text_color(t.dim).child(by))));
  }

  clearRunFilters(cx) { this.runFilter.set_value(""); this.runStatus = "all"; cx.notify(); }

  runsView(t) {
    if (this.runsError && !this.runs.length) return this.errorView(t, this.runsError);
    if (!this.runsLoaded) return busy(t, "Loading runs…");
    if (!this.runs.length) return this.message(t, "No workflow runs yet.", "Runs appear here after a workflow executes.");

    const q = this.runFilter.value().trim().toLowerCase();
    const matches = this.runs.filter((r) => !q || [r.display_title, r.name, r.head_branch, r.actor?.login, r.event, `#${r.run_number}`]
      .filter(Boolean).join(" ").toLowerCase().includes(q));
    const count = (id) => matches.filter((r) => groupOf(r) === id).length;
    const shown = this.runStatus === "all" ? matches : matches.filter((r) => groupOf(r) === this.runStatus);

    const chips = [filterChip(t, "rf-all", "All", matches.length, this.runStatus === "all", (cx) => { this.runStatus = "all"; cx.notify(); })];
    for (const g of RUN_GROUPS) {
      if (count(g.id) > 0 || this.runStatus === g.id) {
        chips.push(filterChip(t, `rf-${g.id}`, g.filter, count(g.id), this.runStatus === g.id, (cx) => { this.runStatus = g.id; cx.notify(); }, g.color(t)));
      }
    }

    // One list, newest first (the filter chips above narrow it by state).
    const when = (r) => Date.parse(r.run_started_at || r.created_at) || 0;
    const rows = [...shown].sort((x, y) => when(y) - when(x) || (y.id ?? 0) - (x.id ?? 0)).map((r) => this.runRow(r, t));

    return v_flex().flex_1().min_h(0)
      .child(v_flex().flex_none().px(12).pt(10).pb(2).gap(8)
        .child(searchBox(t, "run-filter", this.runFilter, { right: q || this.runStatus !== "all" ? `${shown.length}/${this.runs.length}` : `${this.runs.length}`, onClear: (cx) => { this.runFilter.set_value(""); cx.notify(); } }))
        .child(h_flex().flex_wrap().gap(4).children(chips)))
      .when(Boolean(this.runsError), (e) => e.child(div().px(12).py(6).text_size(11).text_color(t.ansi1).child(`Update failed: ${this.runsError.message || this.runsError}`)))
      .child(v_flex().id("runs-scroll").flex_1().min_h(0).overflow_y_scrollbar().pb(8).children(rows)
        .when(!shown.length, (e) => e.child(v_flex().p(16).gap(8).items_start()
          .child(div().text_size(12).text_color(t.dim).child("No run matches the filters."))
          .child(this.button("clear-run-filters", "Clear filters", (cx) => this.clearRunFilters(cx), t)))));
  }

  stepRow(s, t) {
    const st = stateOf(s);
    return h_flex().h(22).flex_none().pl(32).pr(14).gap(8).items_center().text_size(12).text_color(st.done ? t.muted : t.foreground)
      .child(this.icon(st, t))
      .child(div().flex_1().min_w(0).truncate().child(s.name))
      .child(div().flex_none().text_size(11).text_color(t.dim).child(s.started_at && s.completed_at ? duration(s.started_at, s.completed_at) : ""));
  }

  jobBlock(j, t) {
    const st = stateOf(j), now = Date.now();
    return v_flex().flex_none().pb(4)
      .child(h_flex().h(28).flex_none().px(14).gap(8).items_center().font_semibold()
        .child(this.icon(st, t))
        .child(div().flex_1().min_w(0).truncate().child(j.name))
        .child(div().flex_none().text_size(11).text_color(t.muted).child(j.started_at ? duration(j.started_at, j.completed_at ? Date.parse(j.completed_at) : now) : "")))
      .children((j.steps || []).map((s) => this.stepRow(s, t)));
  }

  detailView(t) {
    const d = this.detail, run = d.run;
    if (!run) return d.error ? this.errorView(t, d.error) : busy(t, "Loading run…");
    const st = stateOf(run), now = Date.now();
    const dur = duration(run.run_started_at || run.created_at, st.done ? run.updated_at : now);
    return v_flex().flex_1().min_h(0)
      .child(h_flex().flex_none().px(12).py(8).gap(8).items_center().border_b(1).border_color(t.border)
        .child(this.button("back", "‹ Runs", (cx) => { this.detail = null; this.confirm = null; cx.notify(); }, t))
        .child(div().flex_1())
        .child(this.button("web", "Open", (cx) => this.openWeb(cx), t))
        .when(!st.done, (e) => e.child(this.button("cancel", "Cancel", (cx) => this.requestAction("Cancel", cx), t, { disabled: this.actionBusy })))
        .when(st.done, (e) => e.child(this.button("rerun", "Rerun", (cx) => this.requestAction("Rerun", cx), t, { primary: true, disabled: this.actionBusy }))))
      .when(Boolean(this.confirm), (e) => e.child(v_flex().px(12).py(10).gap(8).bg(t.raised)
        .child(div().text_size(12).child(`${this.confirm.label} #${run.run_number} in ${this.repo.slug} as ${this.repo.login}?`))
        .child(h_flex().gap(8)
          .child(this.button("confirm-action", `Confirm ${this.confirm.label}`, (cx) => this.confirmAction(cx), t, { primary: true }))
          .child(this.button("dismiss-action", "Go back", (cx) => { this.confirm = null; cx.notify(); }, t)))))
      .child(v_flex().id("detail-scroll").flex_1().min_h(0).overflow_y_scrollbar()
        .child(v_flex().flex_none().px(14).py(12).gap(8)
          .child(h_flex().gap(10).items_center().child(this.icon(st, t))
            .child(div().flex_1().min_w(0).truncate().text_size(15).font_semibold().child(run.display_title || run.name))
            .child(div().flex_none().text_size(11).text_color(t.dim).child(`#${run.run_number}`)))
          .child(h_flex().pl(24).flex_wrap().gap(6).items_center()
            .child(this.statePill(st, t))
            .when(Boolean(dur), (e) => e.child(pill(t, { label: dur })))
            .when(Boolean(run.head_branch), (e) => e.child(pill(t, { label: run.head_branch, symbol: "branch", code: true })))
            .when(Boolean(run.event), (e) => e.child(pill(t, { label: run.event.replace(/_/g, " "), color: t.accent })))
            .when((run.run_attempt ?? 1) > 1, (e) => e.child(pill(t, { label: `attempt ${run.run_attempt}` }))))
          .child(div().pl(24).text_size(11).text_color(t.dim).child([run.name, run.actor?.login, relTime(run.created_at, now)].filter(Boolean).join(" · "))))
        .when(d.error, (e) => e.child(div().px(12).pb(6).text_size(11).text_color(t.ansi1).child(`Update failed: ${d.error.message || d.error}`)))
        .children(d.jobs.map((j) => this.jobBlock(j, t)))
        .when(!d.jobs.length && !d.error, (e) => e.child(div().px(12).py(6).text_size(12).text_color(t.dim).child("Waiting for jobs…"))));
  }

  render(cx) {
    const t = theme();
    if (this.props.button) {
      const on = panelShown();
      return h_flex().size_full().items_center().justify_center().bg(t.chrome).border_b(1).border_color(t.border).child(
        h_flex().id("ci-toggle").h(26).px(8).gap(5).flex_none().items_center().rounded(6).text_size(12)
          .bg(on ? t.selected : t.chrome).text_color(on ? t.foreground : t.muted).cursor_pointer().hover((s) => s.bg(t.hover))
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click(() => togglePanel()).child(svg(icon("ci")).size(14).flex_none()).child("CI"));
    }
    if (this.visible()) this.ensureContext(cx);
    let body;
    if (!this.repo) body = this.error ? this.errorView(t, this.error) : this.message(t, "Looking for a GitHub repository…");
    else if (this.tab === "dispatch") body = this.dsp.view(t);
    else body = this.detail ? this.detailView(t) : this.runsView(t);

    return v_flex().id("ci-dash").size_full().min_h(0).rounded(this.props.panel ? 0 : 10).overflow_hidden().bg(t.background).when(!this.props.panel, (el) => el.border_1().border_color(t.border)).when(Boolean(this.props.panel), (el) => el.border_t(1).border_b(1).border_color(t.border)).text_color(t.foreground).text_size(13)
      .child(this.header(t, cx))
      .child(body)
      .when(Boolean(this.note), (e) => e.child(div().flex_none().px(12).py(6).border_t(1).border_color(t.border).text_size(11).text_color(t.blocked).truncate().child(this.note)));
  }
}
