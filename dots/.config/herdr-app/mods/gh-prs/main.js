// GitHub pull requests beside Changes: the focused terminal's branch PR and
// the repository's open PRs. The tab bar button is this mod with props
// { button: true }. See RECIPE.md.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, panes, focused, exec, hc, run, layout, theme, props, shared, setShared, notify, nextCommand, openOverlay, closeOverlay } from "herdr";
import { repoFor, login, currentBranch, branchPr, openPrs, readCache, writeCache, checks, inbox, lookup, mentions, OPEN_LIMIT } from "./sync.js";
import { icons, icon, avatarPath, loadAvatar } from "./assets.js";
import { Dialog, copyMenu, openUrl, openDialog } from "./dialog.js";

const MOD = "gh-prs";
const CARD_EVERY = 30000;
const LIST_EVERY = 60000;
const INBOX_EVERY = 3 * 60000;
const SCAN_EVERY = 3000;
const MENTIONS = 8;

// Shared state: the button copy owns the inbox; the panel asks it to refresh.
const INBOX = "gh-prs.inbox";
const INBOX_REQUEST = "gh-prs.inbox.request";
const VIEW = "gh-prs.view";
const view = () => (shared(VIEW) === "inbox" ? "inbox" : "repo");

const GROUPS = [
  { key: "requested", label: "Review requested", tag: "review" },
  { key: "changes", label: "Changes requested", tag: "changes" },
  { key: "failing", label: "Failing checks", tag: "failing" },
];

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

function showPanel() {
  run("layout.select", { stack: "panel-body", child: MOD });
  run("layout.show", { id: "panel" });
}

function togglePanel() {
  if (panelShown()) run("layout.hide", { id: "panel" });
  else showPanel();
}

// Each pull request once, under the first group it's in, tagged with the others.
function inboxGroups(data) {
  const seen = new Map();
  return GROUPS.map((g) => ({
    ...g,
    items: (data?.[g.key] ?? []).filter((p) => {
      const id = `${p.repo}#${p.number}`;
      if (seen.has(id)) { seen.get(id).also.push(g.tag); return false; }
      seen.set(id, p);
      p.also = [];
      return true;
    }),
  }));
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
    const { button, pr, copyMenu: copying, overlay } = props() ?? {};
    if (pr) { this.dialog = new Dialog(pr, overlay, cx); return; }
    if (copying) { this.copying = { ...copying, overlay }; return; }
    cx.spawn(async (cx) => { await icons(); this.icons = true; cx.notify(); });
    if (button) {
      // The tab bar restores each space's panel only if it's listed here.
      const panels = shared("workspace.panels") ?? ["files", "changes"];
      if (!panels.includes(MOD)) setShared("workspace.panels", [...panels, MOD]);
      this.button = true;
      // The button is always shown, so it gets the keys and runs the inbox.
      this.seen = null;
      this.request = shared(INBOX_REQUEST);
      this.fetchInbox(cx);
      cx.timer.every(INBOX_EVERY, (cx) => this.fetchInbox(cx));
      cx.spawn(async (cx) => {
        for (;;) {
          const command = await nextCommand();
          if (command === "toggle") togglePanel();
          else if (command === "inbox") {
            // Hidden: open on Inbox. Shown: flip between Inbox and This repo.
            const next = panelShown() && view() === "inbox" ? "repo" : "inbox";
            setShared(VIEW, next);
            showPanel();
            if (next === "inbox") this.fetchInbox(cx);
          }
          else if (command === "repo") { setShared(VIEW, "repo"); showPanel(); }
          cx.notify();
        }
      });
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
    this.known = {};                            // repo -> { number: lookup() result or null }
    this.mentioned = [];
    cx.spawn(async (cx) => { this.me = await login().catch(() => null); cx.notify(); });
    cx.timer.every(CARD_EVERY, (cx) => { if (!hidden()) this.refreshCard(cx); });
    cx.timer.every(LIST_EVERY, (cx) => { if (!hidden()) this.refreshList(cx); });
    cx.timer.every(SCAN_EVERY, (cx) => { if (!hidden() && view() === "repo") this.scan(cx); });
  }

  // Button copy only. The first result after startup posts no toasts.
  fetchInbox(cx) {
    if (this.inboxBusy) return;
    this.inboxBusy = true;
    cx.spawn(async (cx) => {
      try {
        const data = await inbox();
        const ids = data.requested.map((p) => `${p.repo}#${p.number}`);
        if (this.seen) {
          for (const p of data.requested.filter((p) => !this.seen.has(`${p.repo}#${p.number}`))) {
            notify({ title: "Review requested", body: `${p.repo}#${p.number}: ${p.title}`, level: "info", timeout: 8000, action: { name: "gh-prs.inbox" } });
          }
        }
        this.seen = new Set(ids);
        setShared(INBOX, data);
      } catch (e) {
        setShared(INBOX, { ...(shared(INBOX) ?? {}), error: String(e?.message ?? e) });
      } finally {
        this.inboxBusy = false;
        cx.notify();
      }
    });
  }

  // The focused terminal's screen and recent history, for the pull requests it
  // mentions. A focused mod pane has no terminal: the last one stays.
  scan(cx) {
    const terminal = (this.terminal = focused()?.terminal ?? this.terminal), repo = this.repo;
    if (this.scanning || !terminal || !repo) return;
    this.scanning = true;
    cx.spawn(async (cx) => {
      try {
        const r = await hc(["read", terminal, "--lines", "300"]);
        if (r.code !== 0 || repo !== this.repo) return;
        const known = (this.known[repo] ??= {});
        const numbers = mentions(r.stdout, repo).filter((n) => known[n] !== null);
        for (const n of numbers.slice(0, MENTIONS)) {
          if (!(n in known)) known[n] = await lookup(repo, n);
        }
        if (repo !== this.repo) return;
        const mentioned = numbers.map((n) => known[n]).filter(Boolean).slice(0, MENTIONS);
        if (JSON.stringify(mentioned) !== JSON.stringify(this.mentioned)) { this.mentioned = mentioned; cx.notify(); }
      } catch { /* the terminal closed, or gh is missing: try again next time */ }
      finally { this.scanning = false; }
    });
  }

  where() { return (this.cwd = location(this.cwd)); }

  context() { return JSON.stringify([this.where(), focused()?.space]); }

  // Each space shows the repo its terminals were last in: a folder outside any
  // GitHub repo keeps it, and a space never in one shows none.
  pick(found, space) {
    if (found) { this.spaceRepos[space] = found; remember("spaces", this.spaceRepos); }
    const choice = this.spaceRepos[space] ?? null;
    if ((choice?.repo ?? null) !== this.repo) { this.error = null; this.mentioned = []; }
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
        .on_click(() => togglePanel())
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
    return box.cursor_pointer().hover((s) => s.border_color(t.input)).on_click(() => this.open(this.repo, pr.number))
      .on_mouse_down("right", () => copyMenu({ repo: this.repo, number: pr.number, title: pr.title, url: pr.url, branch: pr.headRefName }, "pointer"))
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

  row(p, t, cx, where = "pr") {
    const c = checks(p.statusCheckRollup);
    const dot = c.failed.length ? t.ansi1 : c.running ? t.ansi3 : c.total ? t.ansi2 : null;
    const number = p.state === "MERGED" ? t.ansi5 : p.state === "CLOSED" ? t.ansi1 : t.dim;
    return h_flex().id(`${where}-${p.number}`).flex_none().px(10).py(6).gap(8).items_start().rounded(7).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(() => this.open(this.repo, p.number))
      .on_mouse_down("right", () => copyMenu({ repo: this.repo, number: p.number, title: p.title, url: p.url, branch: p.headRefName }, "pointer"))
      .child(div().flex_none().w(40).text_color(number).child(`#${p.number}`))
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

  inboxRow(p, t, cx) {
    const tags = { review: "review requested", changes: "changes requested", failing: "failing checks" };
    return h_flex().id(`inbox-${p.repo}-${p.number}`).flex_none().px(10).py(6).gap(8).items_start().rounded(7).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(() => this.open(p.repo, p.number))
      .on_mouse_down("right", () => copyMenu({ repo: p.repo, number: p.number, title: p.title, url: p.url }, "pointer"))
      .child(this.avatar(p.author, 16, cx).mt(1))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(h_flex().gap(6).items_center().text_size(11).text_color(t.dim)
          .child(div().min_w(0).truncate().child(`${p.repo} #${p.number}`))
          .when(p.isDraft, (e) => e.child(div().flex_none().px(5).rounded(4).border_1().border_color(t.border).text_size(10).child("Draft")))
          .children((p.also ?? []).map((tag) => div().flex_none().px(5).rounded(4).bg(t.selected).text_size(10).text_color(t.muted).child(tags[tag]))))
        .child(div().text_color(t.foreground).child(p.title)));
  }

  inboxView(t, cx) {
    const data = shared(INBOX);
    const groups = inboxGroups(data), total = groups.reduce((n, g) => n + g.items.length, 0);
    return v_flex().id("gh-prs-inbox").flex_1().min_h(0).overflow_y_scrollbar().p(6).gap(1)
      .when(Boolean(data?.error), (e) => e.child(div().px(10).py(4).text_size(11).text_color(t.ansi1).child(data.error)))
      .when(!data?.at, (e) => e.child(div().px(16).py(28).text_size(12).text_center().text_color(t.dim).child("Loading inbox…")))
      .when(Boolean(data?.at) && total === 0, (e) => e.child(div().px(16).py(28).text_size(12).text_center().text_color(t.dim).child("Nothing waiting on you")))
      .children(groups.filter((g) => g.items.length).flatMap((g) => [
        this.heading(`${g.label} ${g.items.length}`, t),
        ...g.items.map((p) => this.inboxRow(p, t, cx)),
      ]));
  }

  // A folder inside a clone of the repo, for Checkout: the focused one when it
  // matches, else any folder this panel has seen in that repo.
  localFor(repo) {
    if (this.repos[this.cwd]?.repo === repo) return this.cwd;
    return Object.entries(this.repos).find(([, r]) => r.repo === repo)?.[0] ?? null;
  }

  // The list's rows have no bodies, so the dialog loads the pull request itself.
  open(repo, number) {
    openDialog({ repo, number, local: this.localFor(repo) });
  }

  copyMenuView(t) {
    const { url, ref, number, title, branch, overlay } = this.copying;
    const items = [["Copy link", url], ["Copy reference", ref], ["Copy number", number], ["Copy number and title", title], ["Copy branch name", branch]].filter(([, text]) => text);
    return v_flex().id("gh-prs-copy").size_full().p(6).gap(1).bg(t.popover).text_color(t.foreground).text_size(12)
      .children(items.map(([label, text], n) => v_flex().id(`copy-${n}`).px(8).py(6).rounded(6).cursor_pointer().hover((e) => e.bg(t.hover))
        .on_click((_e, cx) => { cx.write_to_clipboard(text); notify({ title: "Copied", body: text, level: "success", timeout: 2500 }); closeOverlay(overlay); })
        .child(div().font_semibold().child(label))
        .child(div().text_size(11).text_color(t.muted).truncate().child(text))));
  }

  render(cx) {
    if (this.dialog) return this.dialog.render(cx);
    const t = theme();
    if (this.copying) return this.copyMenuView(t);
    if (this.button) {
      // The panel's Refresh and Inbox tab ask through shared state.
      const request = shared(INBOX_REQUEST);
      if (request !== this.request) { this.request = request; this.fetchInbox(cx); }
      return this.toolbar(t);
    }


    const away = hidden();
    if (!away && (this.away || this.context() !== this.ctx)) this.refresh(cx);
    this.away = away;

    const inboxShown = view() === "inbox";
    const busy = !inboxShown && this.listBusy;
    const requested = shared(INBOX)?.requested?.length ?? 0;
    const showView = (v) => (_e, cx) => {
      setShared(VIEW, v);
      if (v === "inbox") setShared(INBOX_REQUEST, Date.now());
      cx.notify();
    };

    return v_flex().id("gh-prs").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background)
      .border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(this.glyph("pull", 14, t.ansi2))
        .child(div().font_semibold().flex_none().child("Pull requests"))
        .child(div().flex_1().min_w(0).text_size(11).text_color(t.dim).text_right().truncate().child(inboxShown ? "" : this.repo ?? ""))
        .child(h_flex().id("gh-prs-refresh").h(26).px(8).gap(5).flex_none().items_center().rounded(7).border_1().border_color(t.border)
          .text_size(12).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => {
            if (inboxShown) setShared(INBOX_REQUEST, Date.now());
            else { this.refreshCard(cx); this.refreshList(cx); }
          })
          .child(busy
            ? svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900)
            : this.glyph("refresh", 12, t.muted))
          .child(busy ? "Syncing" : "Refresh")))
      .child(h_flex().flex_none().px(8).py(6).border_b(1).border_color(t.border)
        .child(h_flex().flex_1().p(2).gap(2).rounded(8).border_1().border_color(t.border)
          .child(this.segment("view-repo", "This repo", !inboxShown, t, showView("repo")).flex_1().justify_center())
          .child(this.segment("view-inbox", requested ? `Inbox · ${requested}` : "Inbox", inboxShown, t, showView("inbox")).flex_1().justify_center())))
      .child(inboxShown ? this.inboxView(t, cx) : this.repoView(t, cx));
  }

  repoView(t, cx) {
    if (!this.repo) {
      return v_flex().flex_1().items_center().justify_center().gap(10).px(36)
        .child(this.glyph("pull", 28, t.dim))
        .child(div().font_semibold().text_color(t.muted).child("No repository yet"))
        .child(div().text_size(12).text_color(t.dim).text_center().child("Focus a terminal inside a GitHub repository."));
    }

    const store = this.stores[this.repo], list = this.shown();
    const empty = this.error || (!store ? "Loading pull requests…"
      : this.query.trim() ? "No pull requests match"
      : this.filter === "mine" ? "No open pull requests of yours"
      : this.filter === "review" ? "No open pull requests need your review"
      : "No open pull requests");
    const count = store ? ` ${store.prs.length >= OPEN_LIMIT ? `${OPEN_LIMIT}+` : store.prs.length}` : "";

    return v_flex().id("gh-prs-body").flex_1().min_h(0).overflow_y_scrollbar()
      .child(this.card(t, cx) ?? div())
      .when(this.mentioned.length > 0, (e) => e.child(v_flex().flex_none().px(6).gap(1)
        .child(this.heading("In this terminal", t))
        .children(this.mentioned.map((p) => this.row(p, t, cx, "mentioned")))))
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
        .when(!list.length, (e) => e.child(div().px(16).py(28).text_size(12).text_center().text_color(this.error ? t.ansi1 : t.dim).child(empty))));
  }
}
