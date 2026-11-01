// GitHub pull requests beside Changes: the focused terminal's branch PR and
// the repository's open PRs. The tab bar button is this mod with props
// { button: true }. See RECIPE.md.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, panes, focused, exec, run, layout, theme, props, shared, setShared } from "herdr";
import { repoFor, login, currentBranch, branchPr, openPrs, readCache, writeCache, checks, OPEN_LIMIT } from "./sync.js";
import { icons, icon, avatarPath, loadAvatar } from "./assets.js";

const MOD = "gh-prs";
const CARD_EVERY = 30000;
const LIST_EVERY = 60000;

// GitHub's own state colors, the same in every theme.
const STATE = {
  OPEN: { label: "Open", color: "#238636", icon: "pull" },
  DRAFT: { label: "Draft", color: "#6e7681", icon: "draft" },
  MERGED: { label: "Merged", color: "#8957e5", icon: "merged" },
  CLOSED: { label: "Closed", color: "#da3633", icon: "closed" },
};
const DECISION = { APPROVED: "Approved", CHANGES_REQUESTED: "Changes requested", REVIEW_REQUIRED: "Review required" };
const VERDICT = { APPROVED: "approved", CHANGES_REQUESTED: "requested changes", COMMENTED: "commented", DISMISSED: "dismissed" };
const MERGE_PROBLEM = { DIRTY: "Merge conflicts", BEHIND: "Behind the base branch" };

const stop = (_e, cx) => cx.stop_propagation();
const openUrl = (url) => url && exec("open", [url]).catch(() => null);
const stateOf = (pr) => (pr.state === "OPEN" && pr.isDraft ? "DRAFT" : pr.state);

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// As one of the side panels, only the shown one syncs.
function hidden() {
  const root = layout(), body = find(root, "panel-body");
  if (!body?.children?.some((c) => c.content?.mod === MOD)) return false;
  return find(root, "panel")?.hidden || find(body, body.active)?.content?.mod !== MOD;
}

function panelShown() {
  const root = layout(), panel = find(root, "panel");
  return Boolean(panel && !panel.hidden && find(root, "panel-body")?.active === MOD);
}

// Where the focused terminal is. A focused mod pane has no folder: keep the last.
function location(last) {
  const space = spaces().find((s) => s.active), f = focused();
  const pane = f?.pane ? panes().find((p) => p.pane === f.pane) : null;
  if (pane && !pane.terminal && last) return last;
  return pane?.cwd || f?.cwd || space?.folder || null;
}

function remembered(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}

function remember(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* best effort */ }
}

export default class PullRequests extends View {
  init(_props, cx) {
    const { button } = props() ?? {};
    cx.spawn(async (cx) => { await icons(); this.icons = true; cx.notify(); });
    if (button) {
      // The tab bar restores each space's panel only if it's listed here.
      const panels = shared("workspace.panels") ?? ["files", "changes"];
      if (!panels.includes(MOD)) setShared("workspace.panels", [...panels, MOD]);
      this.button = true;
      return;
    }
    this.repos = remembered("repos");           // cwd -> { repo, defaultBranch }
    this.spaceRepos = remembered("spaces");     // space -> { repo, defaultBranch }
    this.stores = {};                           // repo -> openPrs() result
    this.cards = {};                            // cwd -> { branch, pr, hidden, error }
    this.repo = null;
    this.query = ""; this.filter = "all";
    this.input = InputState.new({ placeholder: "Filter pull requests" });
    this.input.on("change", (_e, cx) => { this.query = this.input.value(); cx.notify(); });
    this.input.on("focus", (_e, cx) => { this.typing = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.typing = false; cx.notify(); });
    cx.spawn(async (cx) => { this.me = await login().catch(() => null); cx.notify(); });
    cx.timer.every(CARD_EVERY, (cx) => { if (!hidden()) this.refreshCard(cx); });
    cx.timer.every(LIST_EVERY, (cx) => { if (!hidden()) this.refreshList(cx); });
  }

  where() { return (this.cwd = location(this.cwd)); }

  context() { return JSON.stringify([this.where(), focused()?.space]); }

  // Each space shows the repo its terminals were last in: a folder outside any
  // GitHub repo keeps it, and a space never in one shows none.
  pick(found, space) {
    if (found) { this.spaceRepos[space] = found; remember("spaces", this.spaceRepos); }
    const choice = this.spaceRepos[space] ?? null;
    if ((choice?.repo ?? null) !== this.repo) this.error = null;
    this.repo = choice?.repo ?? null;
    this.defaultBranch = choice?.defaultBranch ?? null;
  }

  async resolve(cwd) {
    if (!cwd) return null;
    if (!this.repos[cwd]) {
      const found = await repoFor(cwd);
      if (found) { this.repos[cwd] = found; remember("repos", this.repos); }
    }
    return this.repos[cwd] ?? null;
  }

  // Focus moved, or the panel came back: show what's cached, then fetch.
  refresh(cx) {
    const cwd = this.where(), space = focused()?.space;
    this.ctx = this.context();
    this.pick(cwd ? this.repos[cwd] : null, space);
    cx.spawn(async (cx) => {
      const found = await this.resolve(cwd).catch(() => null);
      if (this.where() !== cwd) return;
      this.pick(found, space);
      cx.notify();
      this.refreshCard(cx);
      this.refreshList(cx);
    });
  }

  // One fetch at a time each; a request while busy runs once it finishes, so
  // moving focus to another repo mid-fetch isn't dropped.
  refreshCard(cx) {
    const cwd = this.cwd, defaultBranch = this.defaultBranch;
    if (!cwd || !this.repo) return;
    if (this.cardBusy) { this.cardAgain = true; return; }
    this.cardBusy = true;
    cx.spawn(async (cx) => {
      try {
        const branch = await currentBranch(cwd);
        // Detached HEAD, or the default branch: nothing to show.
        if (!branch || branch === defaultBranch) this.cards[cwd] = { branch, hidden: true };
        else this.cards[cwd] = { branch, pr: await branchPr(cwd) };
      } catch (e) {
        this.cards[cwd] = { ...this.cards[cwd], error: String(e?.message ?? e) };
      } finally {
        this.cardBusy = false;
        cx.notify();
        if (this.cardAgain) { this.cardAgain = false; this.refreshCard(cx); }
      }
    });
  }

  refreshList(cx) {
    const repo = this.repo;
    if (!repo) return;
    if (this.listBusy) { this.listAgain = true; return; }
    this.listBusy = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        this.stores[repo] ??= await readCache(repo);
        cx.notify();
        const store = await openPrs(repo);
        this.stores[repo] = store;
        this.error = null;
        await writeCache(repo, store).catch(() => null);
      } catch (e) {
        if (repo === this.repo) this.error = String(e?.message ?? e);
      } finally {
        this.listBusy = false;
        cx.notify();
        if (this.listAgain) { this.listAgain = false; this.refreshList(cx); }
      }
    });
  }

  avatar(login, size, cx) {
    const loading = loadAvatar(login);
    if (loading) cx.spawn(async (cx) => { if (await loading) cx.notify(); });
    const path = avatarPath(login);
    if (path) return image(path).size(size).flex_none().rounded(size / 2);
    // No picture (yet, or ever for some bots): the login's initial.
    const t = theme();
    return div().size(size).flex_none().rounded(size / 2).bg(t.selected).text_color(t.muted)
      .flex().items_center().justify_center().text_size(Math.round(size * 0.6)).font_semibold()
      .child((login ?? "?").replace(/^app\//, "").slice(0, 1).toUpperCase());
  }

  glyph(name, size, color) {
    return div().size(size).flex_none().when(this.icons, (e) => e.child(svg(icon(name)).size(size).text_color(color)));
  }

  // The tab bar button: opens and closes the panel.
  toolbar(t) {
    const on = panelShown(), count = shared("gh-prs.inbox")?.requested?.length ?? 0;
    return h_flex().size_full().pr(10).items_center().justify_end().bg(t.chrome).border_b(1).border_color(t.border)
      .child(h_flex().id("panel-gh-prs").h(26).px(8).gap(5).flex_none().items_center().rounded(6)
        .text_size(12).bg(on ? t.selected : t.chrome).text_color(on ? t.foreground : t.muted)
        .hover((s) => s.bg(t.hover)).on_mouse_down("left", stop)
        .on_click(() => {
          if (on) run("layout.hide", { id: "panel" });
          else { run("layout.select", { stack: "panel-body", child: MOD }); run("layout.show", { id: "panel" }); }
        })
        .child(this.glyph("pull", 14, on ? t.foreground : t.muted))
        .child("PRs")
        .when(count > 0, (e) => e.child(div().text_color(t.accent).font_semibold().child(`· ${count}`))));
  }

  pill(pr, t) {
    const s = STATE[stateOf(pr)] ?? STATE.OPEN;
    return h_flex().flex_none().h(22).px(8).gap(4).items_center().rounded(11).bg(s.color).text_color("#ffffff").text_size(11).font_semibold()
      .child(this.glyph(s.icon, 12, "#ffffff")).child(s.label);
  }

  checksLine(pr, t) {
    const c = checks(pr.statusCheckRollup);
    if (!c.total) return null;
    const parts = [];
    if (c.passed) parts.push(div().text_color(t.ansi2).child(`✓ ${c.passed} passed`));
    if (c.failed.length) parts.push(div().text_color(t.ansi1).child(`✗ ${c.failed.length} failed`));
    if (c.running) parts.push(div().text_color(t.ansi3).child(`● ${c.running} running`));
    return v_flex().gap(3)
      .child(h_flex().gap(8).flex_wrap().text_size(12).children(parts))
      .children(c.failed.map((f, n) => h_flex().id(`failed-${n}`).gap(6).items_center().pl(2).text_size(12).text_color(t.muted).cursor_pointer()
        .hover((s) => s.text_color(t.foreground)).on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); openUrl(f.url); })
        .child(this.glyph("x", 12, t.ansi1)).child(div().min_w(0).truncate().child(f.name))));
  }

  reviewsBlock(pr, t, cx) {
    const reviews = (pr.latestReviews ?? []).filter((r) => r.state !== "PENDING");
    const pending = (pr.reviewRequests ?? []).map((r) => r.login ?? r.name ?? r.slug).filter(Boolean);
    const decision = DECISION[pr.reviewDecision];
    if (!decision && !reviews.length && !pending.length) return null;
    const color = pr.reviewDecision === "APPROVED" ? t.ansi2 : pr.reviewDecision === "CHANGES_REQUESTED" ? t.ansi1 : t.muted;
    return v_flex().gap(4).text_size(12)
      .when(Boolean(decision), (e) => e.child(div().font_semibold().text_color(color).child(decision)))
      .children(reviews.map((r) => {
        const who = r.author?.login ?? "someone";
        const c = r.state === "APPROVED" ? t.ansi2 : r.state === "CHANGES_REQUESTED" ? t.ansi1 : t.dim;
        return h_flex().gap(6).items_center()
          .child(this.avatar(who, 16, cx))
          .child(div().min_w(0).truncate().text_color(t.foreground).child(who))
          .child(div().flex_none().text_color(c).child(VERDICT[r.state] ?? r.state.toLowerCase()));
      }))
      .when(pending.length > 0, (e) => e.child(div().text_color(t.dim).child(`Awaiting ${pending.join(", ")}`)));
  }

  card(t, cx) {
    const c = this.cards[this.cwd];
    if (!c || c.hidden) return null;
    const box = v_flex().id("branch-card").flex_none().m(6).p(10).gap(8).rounded(8).border_1().border_color(t.border).bg(t.raised);
    if (!c.pr) {
      return box.child(h_flex().gap(6).items_center().text_size(12).text_color(c.error ? t.ansi1 : t.dim)
        .child(this.glyph("branch", 12, t.dim))
        .child(div().min_w(0).child(c.error ?? `No pull request for ${c.branch}`)));
    }
    const pr = c.pr, problem = pr.state === "OPEN" ? MERGE_PROBLEM[pr.mergeStateStatus] : null;
    return box.cursor_pointer().hover((s) => s.border_color(t.input)).on_click(() => openUrl(pr.url))
      .child(h_flex().gap(8).items_start()
        .child(this.pill(pr, t))
        .child(div().flex_1().min_w(0).font_semibold().child(pr.title)))
      .child(h_flex().gap(8).items_center().text_size(11).text_color(t.dim)
        .child(div().flex_none().text_color(t.muted).child(`#${pr.number}`))
        .child(div().min_w(0).truncate().child(`${pr.baseRefName} ← ${pr.headRefName}`))
        .child(div().flex_none().text_color(t.ansi2).child(`+${pr.additions}`))
        .child(div().flex_none().text_color(t.ansi1).child(`−${pr.deletions}`)))
      .child(this.checksLine(pr, t) ?? div())
      .child(this.reviewsBlock(pr, t, cx) ?? div())
      .when(Boolean(problem), (e) => e.child(h_flex().gap(6).items_center().text_size(12).text_color(t.ansi3)
        .child(this.glyph("alert", 12, t.ansi3)).child(problem)));
  }

  shown() {
    const store = this.stores[this.repo];
    if (!store) return [];
    const q = this.query.trim().toLowerCase(), requested = new Set(store.requested);
    return store.prs.filter((p) =>
      (this.filter !== "mine" || p.author?.login === this.me)
      && (this.filter !== "review" || requested.has(p.number))
      && (!q || `#${p.number} ${p.title} ${p.headRefName}`.toLowerCase().includes(q)));
  }

  row(p, t, cx) {
    const c = checks(p.statusCheckRollup);
    const dot = c.failed.length ? t.ansi1 : c.running ? t.ansi3 : c.total ? t.ansi2 : null;
    return h_flex().id(`pr-${p.number}`).flex_none().px(10).py(6).gap(8).items_start().rounded(7).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(() => openUrl(p.url))
      .child(div().flex_none().w(40).text_color(t.dim).child(`#${p.number}`))
      .child(this.avatar(p.author?.login, 16, cx).mt(1))
      .child(div().flex_1().min_w(0).text_color(p.isDraft ? t.muted : t.foreground).child(p.title))
      .child(h_flex().flex_none().gap(6).items_center().mt(2)
        .when(p.isDraft, (e) => e.child(div().px(5).rounded(4).border_1().border_color(t.border).text_size(10).text_color(t.dim).child("Draft")))
        .when(p.reviewDecision === "APPROVED", (e) => e.child(this.glyph("check", 12, t.ansi2)))
        .when(p.reviewDecision === "CHANGES_REQUESTED", (e) => e.child(this.glyph("x", 12, t.ansi1)))
        .child(div().size(8).rounded(4).when(Boolean(dot), (e) => e.bg(dot))));
  }

  segment(id, label, on, t, onClick) {
    return div().id(id).h(24).px(9).flex().items_center().rounded(6).text_size(12).cursor_pointer()
      .bg(on ? t.selected : t.background).text_color(on ? t.foreground : t.muted).when(on, (e) => e.font_semibold())
      .hover((s) => s.bg(on ? t.selected : t.hover)).on_click(onClick).child(label);
  }

  heading(label, t) {
    return div().flex_none().px(10).pt(8).pb(4).text_size(11).font_semibold().text_color(t.dim).child(label);
  }

  render(cx) {
    const t = theme();
    if (this.button) return this.toolbar(t);

    const away = hidden();
    if (!away && (this.away || this.context() !== this.ctx)) this.refresh(cx);
    this.away = away;

    const panel = v_flex().id("gh-prs").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background)
      .border_1().border_color(t.border).text_color(t.foreground).text_size(13);
    if (!this.repo) {
      return panel.child(v_flex().flex_1().items_center().justify_center().gap(10).px(36)
        .child(this.glyph("pull", 28, t.dim))
        .child(div().font_semibold().text_color(t.muted).child("No repository yet"))
        .child(div().text_size(12).text_color(t.dim).text_center().child("Focus a terminal inside a GitHub repository.")));
    }

    const store = this.stores[this.repo], list = this.shown();
    const empty = this.error || (!store ? "Loading pull requests…"
      : this.query.trim() ? "No pull requests match"
      : this.filter === "mine" ? "No open pull requests of yours"
      : this.filter === "review" ? "No open pull requests need your review"
      : "No open pull requests");
    const count = store ? ` ${store.prs.length >= OPEN_LIMIT ? `${OPEN_LIMIT}+` : store.prs.length}` : "";

    return panel
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(this.glyph("pull", 14, t.ansi2))
        .child(div().font_semibold().flex_none().child("Pull requests"))
        .child(div().flex_1().min_w(0).text_size(11).text_color(t.dim).text_right().truncate().child(this.repo))
        .child(h_flex().id("gh-prs-refresh").h(26).px(8).gap(5).flex_none().items_center().rounded(7).border_1().border_color(t.border)
          .text_size(12).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => { this.refreshCard(cx); this.refreshList(cx); })
          .child(this.listBusy
            ? svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900)
            : this.glyph("refresh", 12, t.muted))
          .child(this.listBusy ? "Syncing" : "Refresh")))
      .child(v_flex().id("gh-prs-body").flex_1().min_h(0).overflow_y_scrollbar()
        .child(this.card(t, cx) ?? div())
        .child(v_flex().flex_none().px(8).pt(4).pb(6).gap(6)
          .child(this.heading(`Open pull requests${count}`, t).px(2))
          .child(div().id("gh-prs-filter").h(28).px(9).flex().items_center().rounded(7).border_1()
            .border_color(this.typing ? t.accent : t.border).cursor_text().on_mouse_down("left", stop)
            .child(Input.new(this.input).h_full().text_size(12).text_color(t.foreground)))
          .child(h_flex().flex_none().p(2).gap(2).rounded(8).border_1().border_color(t.border).self_start()
            .child(this.segment("filter-all", "All", this.filter === "all", t, (_e, cx) => { this.filter = "all"; cx.notify(); }))
            .child(this.segment("filter-mine", "Mine", this.filter === "mine", t, (_e, cx) => { this.filter = "mine"; cx.notify(); }))
            .child(this.segment("filter-review", "Needs my review", this.filter === "review", t, (_e, cx) => { this.filter = "review"; cx.notify(); }))))
        .child(v_flex().flex_none().px(6).pb(6).gap(1)
          .when(Boolean(this.error) && list.length > 0, (e) => e.child(div().px(10).py(4).text_size(11).text_color(t.ansi1).child(this.error)))
          .children(list.map((p) => this.row(p, t, cx)))
          .when(!list.length, (e) => e.child(div().px(16).py(28).text_size(12).text_center().text_color(this.error ? t.ansi1 : t.dim).child(empty)))));
  }
}
