// One pull request in a dialog: { repo, number, data?, local? } from the panel.
// With data (the list's copy) the header shows at once; the rest loads behind
// it. Links to other pull requests open here too, with Back to return.

import { div, svg, image } from "gpui-kit";
import { v_flex, h_flex, TextView } from "gpui-base";
import { exec, theme, openOverlay, closeOverlay, readTextFile, appHome, notify } from "herdr";
import { icons, icon, avatarPath, loadAvatar } from "./assets.js";
import { blocks, picture, failed, loadPicture } from "./pictures.js";
import { checks } from "./sync.js";
import { checkout, openReview } from "./actions.js";

const DETAIL = [
  "number", "title", "body", "author", "state", "isDraft", "url", "createdAt",
  "headRefName", "baseRefName", "additions", "deletions", "changedFiles",
  "reviewDecision", "latestReviews", "reviewRequests", "statusCheckRollup", "mergeStateStatus",
  "labels", "closingIssuesReferences", "reactionGroups",
].join(",");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GH_URL = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)(?:[/?#].*)?$/;
// GitHub's own colors, the same in every theme so they read as GitHub's.
const GITHUB = { open: "#238636", draft: "#6e7681", merged: "#8957e5", closed: "#da3633", link: "#4493f8" };
const EMOJI = {
  "+1": "👍", "-1": "👎", laugh: "😄", hooray: "🎉", confused: "😕", heart: "❤️", rocket: "🚀", eyes: "👀",
  THUMBS_UP: "👍", THUMBS_DOWN: "👎", LAUGH: "😄", HOORAY: "🎉", CONFUSED: "😕", HEART: "❤️", ROCKET: "🚀", EYES: "👀",
};
const ROLES = { OWNER: "Owner", MEMBER: "Member", COLLABORATOR: "Collaborator", CONTRIBUTOR: "Contributor" };
const VERDICT = {
  APPROVED: { text: "approved these changes", glyph: "check", color: GITHUB.open },
  CHANGES_REQUESTED: { text: "requested changes", glyph: "x", color: GITHUB.closed },
  COMMENTED: { text: "reviewed", glyph: "eye", color: null },
  DISMISSED: { text: "reviewed (dismissed)", glyph: "eye", color: null },
};
// A thread's code context: the last lines of its hunk, as GitHub shows it.
const HUNK_LINES = 8;
// The header's geometry, which the copy menu's position depends on.
const SIDE_PAD = 32;
const TOP_PAD = 14;
const BAR_HEIGHT = 32;

/**
 * As GitHub says it: "3h ago" this month, "on Sep 21" before that.
 */
export function ago(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  const d = new Date(iso), year = d.getFullYear() === new Date().getFullYear() ? "" : `, ${d.getFullYear()}`;
  return `on ${MONTHS[d.getMonth()]} ${d.getDate()}${year}`;
}

export const openUrl = (url) => url && exec("open", [url]).catch(() => null);

// 86% of the window, but never wider than MAX_WIDTH: on an ultrawide the
// timeline gets unreadably long lines. window() has no size, so the bounds
// Herdr saves for the window stand in; unreadable, it's just the share.
const SHARE = 0.86;
const MAX_WIDTH = 1400;

async function dialogWidth() {
  try {
    const bounds = JSON.parse(await readTextFile(`${appHome()}/window.json`))?.bounds;
    const w = Number(bounds?.[2]);
    return w > 0 ? Math.min(Math.round(w * SHARE), MAX_WIDTH) : SHARE;
  } catch {
    return SHARE;
  }
}

/**
 * Opens a pull request in the dialog.
 */
export async function openDialog(pr) {
  openOverlay({ mod: "gh-prs", kind: "dialog", width: await dialogWidth(), height: 0.9, props: { pr } });
}

/**
 * GitHub's Copy menu: a popup of this mod.
 */
export function copyMenu({ repo, number, title, url, branch }, at) {
  openOverlay({ mod: "gh-prs", kind: "popup", width: 300, height: branch ? 262 : 222, ...(at ? { at } : {}),
    props: { copyMenu: { url, ref: `${repo}#${number}`, number: `#${number}`, title: title ? `#${number} ${title}` : null, branch } } });
}

// #123 and owner/repo#123 outside code become links, as on GitHub.
function linkify(markdown, repo) {
  return markdown.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((part, n) => n % 2 ? part
    : part.replace(/(^|[\s(])(?:([\w.-]+\/[\w.-]+))?#(\d+)\b/g, (_m, pre, other, number) =>
      `${pre}[${other ?? ""}#${number}](https://github.com/${other ?? repo}/issues/${number})`)).join("");
}

// gh says app/name for apps, the REST API name[bot]; GitHub shows the name with a bot badge.
const login = (user) => user?.login ?? "ghost";
const shown = (name) => name.replace(/^app\//, "").replace(/\[bot\]$/, "");
const bot = (name) => /^app\/|\[bot\]$/.test(name);

function reactions(r) {
  if (Array.isArray(r)) return r.filter((g) => g.users?.totalCount > 0 && EMOJI[g.content]).map((g) => ({ emoji: EMOJI[g.content], count: g.users.totalCount }));
  return Object.entries(r ?? {}).filter(([k, n]) => EMOJI[k] && n > 0).map(([k, n]) => ({ emoji: EMOJI[k], count: n }));
}

// Inline review comments as threads: the first comment and its replies.
function threads(comments) {
  const roots = new Map();
  for (const c of [...comments].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))) {
    const entry = { login: login(c.user), avatar: c.user?.avatar_url, at: c.created_at, body: c.body, role: c.author_association, reactions: reactions(c.reactions), url: c.html_url };
    if (c.in_reply_to_id && roots.has(c.in_reply_to_id)) { roots.get(c.in_reply_to_id).comments.push(entry); continue; }
    roots.set(c.id, {
      id: c.id, review: c.pull_request_review_id, path: c.path, at: c.created_at,
      line: c.line ?? c.original_line, outdated: c.subject_type !== "file" && c.line == null,
      hunk: (c.diff_hunk ?? "").split("\n").slice(-HUNK_LINES).join("\n"), comments: [entry],
    });
  }
  return [...roots.values()];
}

// The REST timeline as GitHub draws a pull request: comments, reviews with
// their threads, and the events between them.
function timeline(raw, comments) {
  const items = [], reviews = new Map(), loose = [];
  for (const e of raw) {
    const who = e.actor ?? e.user, base = { login: login(who), avatar: who?.avatar_url, at: e.created_at ?? e.submitted_at };
    const last = items.at(-1);
    switch (e.event) {
      case "commented":
        items.push({ ...base, kind: "comment", body: e.body, role: e.author_association, reactions: reactions(e.reactions), url: e.html_url });
        break;
      case "reviewed": {
        const review = { ...base, kind: "review", id: e.id, state: String(e.state).toUpperCase(), body: e.body, role: e.author_association, url: e.html_url, threads: [] };
        reviews.set(e.id, review);
        items.push(review);
        break;
      }
      case "committed": {
        const commit = { sha: e.sha, message: (e.message ?? "").split("\n")[0], url: e.html_url };
        if (last?.kind === "commits") last.list.push(commit);
        else items.push({ kind: "commits", login: e.author?.name ?? "someone", at: e.author?.date ?? e.committer?.date, list: [commit] });
        break;
      }
      case "labeled": case "unlabeled": {
        const added = e.event === "labeled";
        if (last?.kind === "labels" && last.login === base.login && Date.parse(base.at) - Date.parse(last.at) < 60000) (added ? last.added : last.removed).push(e.label);
        else items.push({ ...base, kind: "labels", added: added ? [e.label] : [], removed: added ? [] : [e.label] });
        break;
      }
      case "review_requested": case "review_request_removed":
        items.push({ ...base, kind: "request", added: e.event === "review_requested", who: e.requested_reviewer?.login ?? e.requested_team?.name ?? "someone" });
        break;
      case "head_ref_force_pushed": items.push({ ...base, kind: "force" }); break;
      case "ready_for_review": items.push({ ...base, kind: "ready" }); break;
      case "convert_to_draft": items.push({ ...base, kind: "draft" }); break;
      case "merged": items.push({ ...base, kind: "merged", sha: e.commit_id }); break;
      case "closed": items.push({ ...base, kind: "closed" }); break;
      case "reopened": items.push({ ...base, kind: "reopened" }); break;
      case "head_ref_deleted": items.push({ ...base, kind: "deleted" }); break;
      case "renamed": items.push({ ...base, kind: "renamed", from: e.rename?.from, to: e.rename?.to }); break;
      case "cross-referenced": {
        const s = e.source?.issue;
        if (s) items.push({ ...base, kind: "mention", number: s.number, title: s.title, state: s.state, pr: Boolean(s.pull_request),
          merged: Boolean(s.pull_request?.merged_at), repo: s.repository?.full_name, url: s.html_url });
        break;
      }
    }
  }
  for (const t of threads(comments)) {
    const review = reviews.get(t.review);
    if (review) review.threads.push(t); else loose.push({ kind: "thread", at: t.at, thread: t });
  }
  // A reply on GitHub is a review of its own with nothing in it: leave those out.
  const kept = items.filter((e) => e.kind !== "review" || e.body?.trim() || e.threads.length || e.state !== "COMMENTED");
  return [...kept, ...loose].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export class Dialog {
  constructor({ repo, number, data, local }, overlay, cx) {
    this.repo = repo; this.number = number; this.local = local; this.overlay = overlay;
    this.history = []; this.cache = {}; this.timelines = {}; this.expanded = new Set();
    if (data) this.cache[`${repo}#${number}`] = data;
    cx.spawn(async (cx) => { await icons(); this.icons = true; cx.notify(); });
    this.load(cx);
  }

  id() { return `${this.repo}#${this.number}`; }

  load(cx) {
    const repo = this.repo, number = this.number, id = this.id(), current = () => this.id() === id;
    this.pr = this.cache[id] ?? null; this.error = null; this.loading = true;
    const gh = async (args) => {
      const r = await exec("gh", args);
      if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim());
      return JSON.parse(r.stdout);
    };
    const pages = (path) => gh(["api", "--paginate", "--slurp", `repos/${repo}/${path}?per_page=100`]).then((p) => p.flat()).catch(() => null);
    cx.spawn(async (cx) => {
      try {
        const [pr, events, comments] = await Promise.all([
          gh(["pr", "view", String(number), "-R", repo, "--json", DETAIL]),
          pages(`issues/${number}/timeline`),
          pages(`pulls/${number}/comments`),
        ]);
        this.cache[id] = pr;
        if (events) this.timelines[id] = timeline(events, comments ?? []);
        if (current()) this.pr = pr;
      } catch (e) {
        // An issue link from a body: GitHub can show it, the dialog can't.
        if (/Could not resolve to a PullRequest/i.test(String(e?.message)) && this.history.length) {
          openUrl(`https://github.com/${repo}/issues/${number}`);
          if (current()) { this.back(cx); return; }
        }
        if (current()) this.error = String(e?.message ?? e);
      } finally { if (current()) { this.loading = false; cx.notify(); } }
    });
  }

  go(repo, number, cx) {
    if (repo === this.repo && number === this.number) return;
    this.history.push({ repo: this.repo, number: this.number });
    if (repo !== this.repo) this.local = null;
    this.repo = repo; this.number = number;
    this.load(cx); cx.notify();
  }

  back(cx) {
    const prev = this.history.pop();
    if (!prev) return;
    this.repo = prev.repo; this.number = prev.number;
    this.load(cx); cx.notify();
  }

  link(url, cx) {
    const m = GH_URL.exec(url);
    if (m) this.go(m[1], Number(m[2]), cx); else openUrl(url);
  }

  checkout(cx) {
    const pr = this.pr;
    if (!pr || this.busy) return;
    this.busy = "Checking out"; this.error = null;
    cx.spawn(async (cx) => {
      try {
        await checkout({ number: pr.number, repo: this.repo, branch: pr.headRefName, local: this.local });
        closeOverlay(this.overlay);
      } catch (e) { this.error = String(e?.message ?? e); }
      finally { this.busy = null; cx.notify(); }
    });
    cx.notify();
  }

  // ---- drawing ----

  pic(name, url, size, t, cx) {
    const loading = loadAvatar(name, url);
    if (loading) cx.spawn(async (cx) => { if (await loading) cx.notify(); });
    const path = avatarPath(name);
    if (path) return image(path).size(size).flex_none().rounded(size / 2);
    const colors = [t.ansi1, t.ansi2, t.ansi3, t.ansi4, t.ansi5, t.ansi6];
    const color = colors[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % colors.length];
    return div().size(size).flex_none().rounded(size / 2).flex().items_center().justify_center().bg(color + "33")
      .text_size(Math.round(size * 0.5)).font_semibold().text_color(color).child(shown(name).slice(0, 1).toUpperCase());
  }

  glyph(name, size, color) { return div().size(size).flex_none().when(this.icons, (e) => e.child(svg(icon(name)).size(size).text_color(color))); }

  button(id, label, t, onClick, { enabled = true, glyph = null } = {}) {
    return h_flex().id(id).h(32).px(12).gap(6).flex_none().items_center().justify_center().rounded(6).text_size(13).font_medium()
      .bg(t.raised).border_1().border_color(t.border).text_color(enabled ? t.foreground : t.dim)
      .when(enabled, (e) => e.cursor_pointer().hover((s) => s.bg(t.hover)).on_click(onClick))
      .when(Boolean(glyph), (e) => e.child(this.glyph(glyph, 14, enabled ? t.muted : t.dim)))
      .when(label !== "", (e) => e.child(label));
  }

  badge(label, t) {
    return div().h(20).px(7).flex_none().flex().items_center().rounded(10).border_1().border_color(t.border).text_size(12).text_color(t.muted).child(label);
  }

  labelChip(l, t) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(l.color.slice(i, i + 2), 16));
    const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.35;
    return div().h(20).px(7).flex_none().flex().items_center().rounded(10).border_1().border_color(`#${l.color}66`).bg(`#${l.color}2e`)
      .text_size(12).font_semibold().text_color(light ? `#${l.color}` : t.foreground).child(l.name);
  }

  // Markdown with its images drawn in between the text.
  markdown(key, body, t, cx) {
    return v_flex().gap(12).children(blocks(body).map((b, n) => b.image ? this.picture(`${key}-${n}`, b, t, cx)
      : TextView.markdown(`${key}-${n}`, linkify(b.text, this.repo)).selectable(true).on_link_click((url, cx) => this.link(url, cx))));
  }

  picture(key, b, t, cx) {
    const loading = loadPicture(b.image);
    if (loading) cx.spawn(async (cx) => { await loading; cx.notify(); });
    const p = picture(b.image);
    if (!p) return div().h(failed(b.image) ? 36 : 120).w_full().flex_none().rounded(6).border_1().border_color(t.border).bg(t.raised)
      .flex().items_center().justify_center().px(12).text_size(12).text_color(t.muted).truncate()
      .child(failed(b.image) ? `Image could not be loaded${b.alt ? `: ${b.alt}` : ""}` : "Loading image…");
    const room = Math.max(240, (this.width ?? 1100) - 380), w = Math.min(b.width ?? p.width, room), h = Math.round(p.height * w / p.width);
    return div().id(key).flex_none().cursor_pointer().on_click(() => openUrl(p.file)).child(image(p.path).w(w).h(h).rounded(6));
  }

  header(c, t, cx, extra = []) {
    const author = login(this.pr.author);
    return h_flex().h(38).px(12).gap(8).items_center().bg(t.raised).border_b(1).border_color(t.border).text_size(13)
      .child(this.pic(c.login, c.avatar, 20, t, cx))
      .child(div().font_semibold().text_color(t.foreground).child(shown(c.login)))
      .when(bot(c.login), (e) => e.child(this.badge("bot", t)))
      .children(extra)
      .child(div().text_color(t.muted).child(c.first ? `opened ${ago(c.at)}` : ago(c.at)))
      .child(div().flex_1())
      .when(!c.first && c.login === author, (e) => e.child(this.badge("Author", t)))
      .when(Boolean(ROLES[c.role]), (e) => e.child(this.badge(ROLES[c.role], t)));
  }

  reactionsRow(list, t) {
    return h_flex().px(16).pb(14).gap(6).flex_wrap()
      .children(list.map((r) => h_flex().h(26).px(8).gap(5).items_center().rounded(13).border_1().border_color(t.border).bg(t.raised)
        .text_size(12).text_color(t.muted).child(div().text_size(14).child(r.emoji)).child(String(r.count))));
  }

  card(key, c, t, cx) {
    return v_flex().flex_none().rounded(6).border_1().border_color(t.border).overflow_hidden().bg(t.background)
      .child(this.header(c, t, cx))
      .child(div().px(16).py(14).text_size(14).child(c.body?.trim()
        ? this.markdown(key, c.body, t, cx)
        : div().text_color(t.muted).italic().child("No description provided.")))
      .when(c.reactions?.length > 0, (e) => e.child(this.reactionsRow(c.reactions, t)));
  }

  // A review: its verdict on the header, its summary, then its threads.
  review(key, r, t, cx) {
    const v = VERDICT[r.state] ?? VERDICT.COMMENTED;
    return v_flex().flex_none().rounded(6).border_1().border_color(v.color ? `${v.color}99` : t.border).overflow_hidden().bg(t.background)
      .child(this.header(r, t, cx, [
        h_flex().gap(4).items_center().text_color(v.color ?? t.muted).child(this.glyph(v.glyph, 14, v.color ?? t.muted)).child(v.text),
      ]))
      .when(Boolean(r.body?.trim()), (e) => e.child(div().px(16).py(14).text_size(14).child(this.markdown(key, r.body, t, cx))))
      .when(r.threads.length > 0, (e) => e.child(v_flex().px(12).py(12).gap(10).when(Boolean(r.body?.trim()), (el) => el.border_t(1).border_color(t.border))
        .children(r.threads.map((th, n) => this.thread(`${key}-t${n}`, th, t, cx)))));
  }

  // One inline thread: the file, the code it's about, the conversation.
  // Outdated ones fold to a line.
  thread(key, th, t, cx) {
    const open = !th.outdated || this.expanded.has(th.id);
    const head = h_flex().id(`${key}-head`).h(34).px(10).gap(8).items_center().bg(t.raised).text_size(12)
      .when(th.outdated, (e) => e.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => {
        if (this.expanded.has(th.id)) this.expanded.delete(th.id); else this.expanded.add(th.id);
        cx.notify();
      }))
      .child(this.glyph("file", 13, t.muted))
      .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(th.line ? `${th.path}:${th.line}` : th.path))
      .when(th.outdated, (e) => e.child(this.badge("Outdated", t)))
      .when(!open, (e) => e.child(div().text_color(t.muted).child(`${th.comments.length} comment${th.comments.length === 1 ? "" : "s"} ▸`)));
    return v_flex().flex_none().rounded(6).border_1().border_color(t.border).overflow_hidden()
      .child(head)
      .when(open, (e) => e
        .when(Boolean(th.hunk), (el) => el.child(div().px(10).py(6).border_t(1).border_color(t.border).text_size(12)
          .child(TextView.markdown(`${key}-hunk`, "```diff\n" + th.hunk + "\n```"))))
        .children(th.comments.map((c, n) => v_flex().px(12).py(10).gap(6).border_t(1).border_color(t.border)
          .child(h_flex().gap(8).items_center().text_size(13)
            .child(this.pic(c.login, c.avatar, 18, t, cx))
            .child(div().font_semibold().child(shown(c.login)))
            .when(bot(c.login), (el) => el.child(this.badge("bot", t)))
            .child(div().text_color(t.muted).child(ago(c.at))))
          .child(div().text_size(14).child(this.markdown(`${key}-c${n}`, c.body ?? "", t, cx)))
          .when(c.reactions?.length > 0, (el) => el.child(this.reactionsRow(c.reactions, t).px(0).pb(0))))));
  }

  // An event: a round icon on the line, then who did what, when.
  event(key, e, t, cx) {
    const strong = (text) => div().font_semibold().text_color(t.foreground).child(text);
    const muted = (text) => div().child(text);
    const FILL = { merged: GITHUB.merged, closed: GITHUB.closed, reopened: GITHUB.open, ready: GITHUB.open };
    const GLYPH = { labels: "tag", request: "eye", force: "branch", ready: "pull", draft: "draft", merged: "merged", closed: "closed",
      reopened: "pull", deleted: "branch", renamed: "pencil", mention: "link", commits: "commit" };
    const fill = FILL[e.kind] ?? null;
    const parts = [];
    switch (e.kind) {
      case "labels":
        if (e.added.length) parts.push(muted("added"), ...e.added.map((l) => this.labelChip(l, t)));
        if (e.added.length && e.removed.length) parts.push(muted("and"));
        if (e.removed.length) parts.push(muted("removed"), ...e.removed.map((l) => this.labelChip(l, t)));
        parts.push(muted(e.added.length + e.removed.length === 1 ? "label" : "labels"));
        break;
      case "request": parts.push(muted(e.added ? "requested a review from" : "removed the review request for"), strong(shown(e.who))); break;
      case "force": parts.push(muted("force-pushed the"), strong(this.pr.headRefName), muted("branch")); break;
      case "ready": parts.push(muted("marked this pull request as ready for review")); break;
      case "draft": parts.push(muted("marked this pull request as draft")); break;
      case "merged": parts.push(muted("merged commit"), strong((e.sha ?? "").slice(0, 7)), muted("into"), strong(this.pr.baseRefName)); break;
      case "closed": parts.push(muted("closed this")); break;
      case "reopened": parts.push(muted("reopened this")); break;
      case "deleted": parts.push(muted("deleted the"), strong(this.pr.headRefName), muted("branch")); break;
      case "renamed": parts.push(muted("changed the title"), div().line_through().child(e.from ?? ""), strong(e.to ?? "")); break;
      case "mention": parts.push(muted("mentioned this")); break;
      case "commits": parts.push(muted(`added ${e.list.length} commit${e.list.length === 1 ? "" : "s"}`)); break;
    }
    return v_flex().flex_none().gap(6)
      .child(h_flex().pl(6).gap(10).items_center()
        .child(div().size(28).flex_none().rounded(14).flex().items_center().justify_center().bg(fill ?? t.raised).border_1().border_color(fill ?? t.border)
          .child(this.glyph(GLYPH[e.kind] ?? "commit", 14, fill ? "#ffffff" : t.muted)))
        .child(h_flex().flex_1().min_w(0).gap(5).items_center().flex_wrap().text_size(13).text_color(t.muted)
          .when(e.kind !== "commits", (el) => el.child(this.pic(e.login, e.avatar, 16, t, cx)))
          .child(strong(shown(e.login))).children(parts)
          .when(Boolean(e.at), (el) => el.child(div().child(ago(e.at))))))
      .when(e.kind === "commits", (el) => el.child(v_flex().ml(44).gap(4).children(e.list.map((c, n) =>
        h_flex().id(`${key}-${n}`).gap(8).items_center().cursor_pointer().text_size(12).on_click(() => openUrl(c.url))
          .child(div().flex_1().min_w(0).truncate().text_color(t.muted).hover((s) => s.text_color(t.foreground)).child(c.message))
          .child(div().flex_none().px(6).py(1).rounded(5).bg(t.raised).border_1().border_color(t.border).text_color(t.muted).child(c.sha.slice(0, 7)))))))
      .when(e.kind === "mention", (el) => el.child(h_flex().id(key).ml(44).gap(8).items_start().cursor_pointer().text_size(13)
        .on_click((_ev, cx) => this.link(e.url, cx))
        .child(this.glyph(e.pr ? "pull" : "issue", 16, e.merged ? GITHUB.merged : e.state === "open" ? GITHUB.open : t.muted))
        .child(div().flex_1().min_w(0).child(h_flex().gap(6).flex_wrap()
          .child(div().font_semibold().text_color(t.foreground).hover((s) => s.text_color(GITHUB.link)).child(e.title ?? ""))
          .child(div().text_color(t.muted).child(`${e.repo === this.repo ? "" : e.repo}#${e.number}`))))));
  }

  joint(t) { return div().flex_none().ml(19).w(2).h(16).bg(t.border); }

  timelineItems(p, t, cx) {
    const items = this.timelines[this.id()] ?? [];
    const first = { kind: "comment", first: true, login: login(p.author), at: p.createdAt, body: p.body, reactions: reactions(p.reactionGroups) };
    return [this.card("pr-body", first, t, cx), ...items.flatMap((e, n) => [this.joint(t),
      e.kind === "comment" ? this.card(`pr-comment-${n}`, e, t, cx)
        : e.kind === "review" ? this.review(`pr-review-${n}`, e, t, cx)
        : e.kind === "thread" ? this.thread(`pr-thread-${n}`, e.thread, t, cx)
        : this.event(`pr-event-${n}`, e, t, cx)])];
  }

  section(title, t, body) {
    return v_flex().flex_none().gap(8).py(14).border_b(1).border_color(t.border)
      .child(div().text_size(12).font_semibold().text_color(t.muted).child(title))
      .child(body);
  }

  sidebar(p, t, cx) {
    const none = (text) => div().text_size(12).text_color(t.muted).child(text);
    const reviews = (p.latestReviews ?? []).filter((r) => r.state !== "PENDING");
    const pending = (p.reviewRequests ?? []).map((r) => r.login ?? r.name ?? r.slug).filter(Boolean);
    const c = checks(p.statusCheckRollup);
    const all = (p.statusCheckRollup ?? []).map((x) => x.__typename === "StatusContext"
      ? { name: x.context, url: x.targetUrl, state: x.state === "SUCCESS" ? "pass" : x.state === "PENDING" || x.state === "EXPECTED" ? "run" : "fail" }
      : { name: x.name, url: x.detailsUrl, state: x.status !== "COMPLETED" ? "run" : ["SUCCESS", "SKIPPED", "NEUTRAL"].includes(x.conclusion) ? "pass" : "fail" });
    const order = { fail: 0, run: 1, pass: 2 };
    all.sort((a, b) => order[a.state] - order[b.state]);
    const mark = { pass: ["✓", t.ansi2], fail: ["✗", t.ansi1], run: ["●", t.ansi3] };
    const issues = p.closingIssuesReferences ?? [];
    return v_flex().id("pr-sidebar").w(264).flex_none().min_h(0).overflow_y_scrollbar().pl(8).pr(24).pt(6)
      .child(this.section("Reviewers", t, reviews.length || pending.length
        ? v_flex().gap(8)
          .children(reviews.map((r) => {
            const v = VERDICT[r.state] ?? VERDICT.COMMENTED;
            return h_flex().gap(8).items_center().text_size(13)
              .child(this.pic(login(r.author), null, 20, t, cx))
              .child(div().flex_1().min_w(0).truncate().font_semibold().child(shown(login(r.author))))
              .child(this.glyph(v.glyph, 14, v.color ?? t.muted));
          }))
          .children(pending.map((name) => h_flex().gap(8).items_center().text_size(13)
            .child(this.pic(name, null, 20, t, cx))
            .child(div().flex_1().min_w(0).truncate().font_semibold().child(name))
            .child(div().text_size(11).text_color(t.ansi3).child("pending"))))
        : none("No reviews")))
      .child(this.section(c.total ? `Checks · ${c.passed}/${c.total} passed` : "Checks", t, all.length
        ? v_flex().gap(4).children(all.map((x, n) => h_flex().id(`pr-check-${n}`).gap(6).items_center().text_size(12).cursor_pointer()
          .text_color(t.muted).hover((s) => s.text_color(t.foreground)).on_click(() => openUrl(x.url))
          .child(div().w(12).flex_none().text_color(mark[x.state][1]).child(mark[x.state][0]))
          .child(div().flex_1().min_w(0).truncate().child(x.name))))
        : none("No checks")))
      .child(this.section("Linked issues", t, issues.length
        ? v_flex().gap(8).children(issues.map((i) => h_flex().id(`pr-issue-${i.number}`).gap(8).items_start().cursor_pointer().text_size(13)
          .on_click(() => openUrl(i.url))
          .child(div().pt(1).child(this.glyph("issue", 14, GITHUB.open)))
          .child(v_flex().child(div().font_semibold().hover((s) => s.text_color(GITHUB.link)).child(`#${i.number}`))
            .child(div().text_size(12).text_color(t.muted).child(`${i.repository?.owner?.login}/${i.repository?.name}`)))))
        : none("None")))
      .child(this.section("Labels", t, p.labels?.length
        ? h_flex().gap(4).flex_wrap().children(p.labels.map((l) => this.labelChip(l, t)))
        : none("No labels")));
  }

  render(cx) {
    const t = theme(), p = this.pr;
    const bar = h_flex().h(BAR_HEIGHT).gap(8).items_center()
      .when(this.history.length > 0, (e) => e.child(this.button("pr-back", "Back", t, (_e, cx) => this.back(cx), { glyph: "back" })))
      .child(div().flex_none().text_size(13).text_color(t.muted).child(this.repo))
      .child(div().flex_1().min_w(0).text_size(12).text_color(t.ansi1).truncate().child(p && this.error ? this.error : ""))
      .when(this.loading || Boolean(this.busy), (e) => e.child(h_flex().gap(6).items_center().text_size(12).text_color(t.muted)
        .child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900)).child(this.busy ?? "Refreshing")))
      .when(Boolean(p) && !this.loading && !this.busy, (e) => e.child(this.button("pr-refresh", "", t, (_e, cx) => { this.load(cx); cx.notify(); }, { glyph: "refresh" })))
      .when(Boolean(p), (e) => e
        .child(this.button("pr-checkout", "Checkout", t, (_e, cx) => this.checkout(cx), { glyph: "branch", enabled: Boolean(this.local) && !this.busy && p.state === "OPEN" }))
        .child(this.button("pr-review", "Review", t, () => { openReview({ number: p.number, repo: this.repo }); closeOverlay(this.overlay); }, { glyph: "eye" }))
        .child(this.button("pr-copy", "Copy ▾", t, (_e, cx) => this.toggleCopy(cx), { glyph: "copy" })))
      // Measured, so the copy menu can line up under Copy (see copyDropdown).
      .child(h_flex().id("pr-trailing").flex_none().gap(8).items_center()
        .on_size_change((size, cx) => { if (size.width !== this.trailing) { this.trailing = size.width; cx.notify(); } })
        .when(Boolean(p), (e) => e.child(this.button("pr-github", "Open on GitHub", t, () => openUrl(p.url), { glyph: "external" })))
        .child(this.button("pr-close", "", t, () => closeOverlay(this.overlay), { glyph: "x" })));
    if (!p) return v_flex().id("pr").size_full().bg(t.background).text_color(t.foreground).text_size(14).px(32).pt(16).gap(20)
      .child(bar)
      .child(this.loading ? div().text_color(t.muted).child(`Loading #${this.number}…`) : div().text_color(t.ansi1).child(this.error ?? ""));

    const kind = p.state === "OPEN" && p.isDraft ? "draft" : p.state === "OPEN" ? "open" : p.state === "MERGED" ? "merged" : "closed";
    const label = { draft: "Draft", open: "Open", merged: "Merged", closed: "Closed" }[kind];
    const glyph = { draft: "draft", open: "pull", merged: "merged", closed: "closed" }[kind];
    return v_flex().id("pr").relative().size_full().min_h(0).bg(t.background).text_color(t.foreground).text_size(14)
      .on_size_change((size, cx) => { if (size.width !== this.width) { this.width = size.width; cx.notify(); } })
      .child(v_flex().flex_none().px(SIDE_PAD).pt(TOP_PAD).pb(18).gap(14).border_b(1).border_color(t.border)
        .child(bar)
        // Word by word, so the title wraps like text with the number after its last word.
        .child(h_flex().flex_wrap().gap_x(8).text_size(28).children(p.title.split(/\s+/).filter(Boolean).map((w) => div().child(w)))
          .child(div().text_color(t.muted).child(`#${p.number}`)))
        .child(h_flex().gap(10).items_center().flex_wrap().text_size(13).text_color(t.muted)
          .child(h_flex().h(32).px(12).gap(6).items_center().rounded(16).bg(GITHUB[kind]).text_color("#ffffff").text_size(14).font_semibold()
            .child(this.glyph(glyph, 16, "#ffffff")).child(label))
          .child(this.pic(login(p.author), null, 20, t, cx))
          .child(div().font_semibold().text_color(t.foreground).child(shown(login(p.author))))
          .child(div().child("wants to merge into"))
          .child(div().px(6).py(1).rounded(5).bg(t.raised).text_color(t.foreground).child(p.baseRefName))
          .child(div().child("from"))
          .child(div().px(6).py(1).rounded(5).bg(t.raised).text_color(t.foreground).child(p.headRefName))
          .when(p.additions != null, (e) => e
            .child(div().text_color(t.ansi2).child(`+${p.additions}`))
            .child(div().text_color(t.ansi1).child(`−${p.deletions}`))
            .child(div().child(`· ${p.changedFiles} file${p.changedFiles === 1 ? "" : "s"}`)))))
      .child(h_flex().flex_1().min_h(0).items_start()
        .child(v_flex().id(`pr-thread-${this.id()}`).flex_1().min_w(0).h_full().overflow_y_scrollbar().pl(32).pr(24).py(20)
          .children(this.timelineItems(p, t, cx))
          .child(div().flex_none().h(24)))
        .child(this.sidebar(p, t, cx)))
      .when(Boolean(this.copyOpen), (e) => e.child(this.copyDropdown(p, t)));
  }

  toggleCopy(cx) {
    // The press that closed the menu (outside it) is also this click: leave it closed.
    if (Date.now() - (this.copyClosedAt ?? 0) < 300) return;
    this.copyOpen = !this.copyOpen;
    cx.notify();
  }

  // The copy menu, drawn in the dialog rather than as a popup: a popup's
  // pointer position is off by the dialog's offset. It's the root's last child
  // so it paints over the title and timeline, and sits under Copy by measuring
  // what's to Copy's right.
  copyDropdown(p, t) {
    const close = (cx) => { this.copyOpen = false; this.copyClosedAt = Date.now(); cx.notify(); };
    const items = [
      ["Copy link", p.url], ["Copy reference", `${this.repo}#${p.number}`], ["Copy number", `#${p.number}`],
      ["Copy number and title", `#${p.number} ${p.title}`], ["Copy branch name", p.headRefName],
    ];
    return v_flex().id("pr-copy-menu").absolute().top(TOP_PAD + BAR_HEIGHT + 6).right(SIDE_PAD + (this.trailing ?? 0) + 8).w(300)
      .p(6).gap(1).rounded(8).border_1().border_color(t.border).bg(t.popover).shadow_lg().text_color(t.foreground).text_size(12)
      .on_mouse_down_out((_e, cx) => close(cx))
      .children(items.map(([label, text], n) => v_flex().id(`pr-copy-${n}`).px(8).py(6).rounded(6).cursor_pointer().hover((e) => e.bg(t.hover))
        .on_click((_e, cx) => { cx.write_to_clipboard(text); notify({ title: "Copied", body: text, level: "success", timeout: 2500 }); close(cx); })
        .child(div().font_semibold().child(label))
        .child(div().text_size(11).text_color(t.muted).truncate().child(text))));
  }
}
