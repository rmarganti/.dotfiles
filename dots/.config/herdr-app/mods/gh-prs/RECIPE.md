# gh-prs

A side panel beside Changes that shows the pull request for the focused terminal's branch, the repository's open pull requests, and an inbox of pull requests waiting on me. Its tab bar button carries a badge with my pending review requests.

Everything goes through the `gh` CLI. Porcelain commands first; REST through `gh api` where porcelain has no answer. No GraphQL.

Structure borrows from [jankeesvw/herdr-issues](https://github.com/jankeesvw/herdr-issues).

## What you see

- **The button**, after Changes in the tab bar: a 26px pill with a pull request icon and "PRs", `selected` while the panel shows, `chrome` otherwise. When I have pending review requests, it reads `PRs · 4` with the count in `accent`. At zero, no count.
- **The panel**, in the side panel column as a card (10px radius, 1px `border`, `background`):
  - A 42px header: the pull request icon, "Pull requests", the repository (`owner/name`, 11px, `dim`, truncated) and a Refresh button (spinner while syncing).
  - A segmented control: **This repo | Inbox**.
- **This repo**:
  - **The branch card**: the pull request for the focused terminal's branch.
    - A state pill (Draft, Open, Merged, Closed), `#N` and the title.
    - `base ← head` and `+adds −dels`.
    - Checks: `✓ 12 passed · ✗ 2 failed · ● 1 running`, then each failing check by name. Clicking one opens its run.
    - Reviews: the review decision (Approved, Changes requested, Review required), each reviewer's latest verdict, and pending review requests.
    - Merge state: one line, only when something is wrong (conflicts, blocked, behind).
    - No pull request: "No pull request for `feature/foo`". On the default branch the card is hidden.
  - **In this terminal**: pull requests the focused terminal mentions, up to 8.
  - **Open pull requests**: a text filter (`#N`, title, branch) and **All | Mine | Needs my review**. Each row: `#N`, the title, the author's avatar, a Draft pill, a CI dot (green, red, amber) and a review glyph (✓ approved, ✗ changes requested).
  - Before any repository has been seen: "No repository yet" and "Focus a terminal inside a GitHub repository."
- **Inbox**, grouped:
  - **Review requested**: from me or a team I'm on.
  - **Changes requested**: my pull requests.
  - **Failing checks**: my pull requests.
  - A pull request in two groups shows once, under the first, with a tag for the other reason.
- **The pull request dialog**, 86% by 90% of the window:
  - Top bar: the repository, Back after following a link, the last error, a spinner, and Checkout, Review, Copy ▾, Open on GitHub and close.
  - Header: the title, `#N`, the state pill, `base ← head`, `+adds −dels · N files`.
  - Left, the timeline:
    - The description, then top-level comments as cards with reactions.
    - Reviews as cards whose header names the verdict ("approved these changes", "requested changes"), with the review's summary body.
    - Inline review threads under the review that started them: the file path, the `diff_hunk` as a code block, the thread's comments and a Reply box. Outdated threads collapse to one "Outdated" line.
    - Events between cards: pushed N commits, force-pushed, review requested, ready for review, converted to draft, merged, closed, labels.
  - Bottom, on open pull requests: the merge box (what's blocking, then **Merge ▾**). Then a Write/Preview comment box with **Comment**, **Submit review ▾** (Approve, Request changes, Comment; the box is the review body) and Close or Reopen. Approve and Request changes don't show on my own pull requests: GitHub refuses them.
  - Right, a 264px sidebar: Reviewers with verdicts and pending requests, Checks (counts, failing checks linked), linked issues, labels (read-only), and Ready for review or Convert to draft.
- **Merge ▾**: the merge methods the repository allows, squash first (or the last one picked there), plus "Enable auto-merge" when the repository allows it. Disabled on drafts. Picking one asks first, in the merge box: "Squash and merge #123 into main?" with what happens to the branch, then Cancel or Confirm.
- **The copy menu**: Copy link, Copy reference (`owner/repo#123`), Copy number, Copy branch name.

## How it behaves

### The branch card and This repo

- The panel follows the focused terminal's folder (`panes()[i].cwd`), resolved to a repository with `gh repo view`. Each space remembers its last repository, so a folder outside any repository keeps it.
- The branch card runs `gh pr view --json …` in the focused terminal's folder, which finds the pull request for that checkout's branch. Each worktree is its own folder, so each gets its own card. It refreshes every 30 seconds while the panel shows and at once when focus moves.
- The open list is one full `gh pr list -R owner/repo --state open --limit 100 --json number,title,author,isDraft,headRefName,reviewDecision,statusCheckRollup,updatedAt,url` every 60 seconds while the panel shows. No delta sync: a repository's open pull requests are few, and their rows need no bodies. Repositories with more than 100 open pull requests show the 100 most recently updated.
- Each repository's list is cached in `data/gh-prs/` so it shows at once after a restart or a space switch.
- The list is sorted by most recently updated. No sort menu.
- Every 3 seconds while This repo shows, the panel reads the focused terminal (`hc read --lines 300`) for `#123` and the repository's `/pull/N` links, newest line first. Numbers are looked up once with `gh pr view N` and remembered, including ones that aren't pull requests.
- While the panel isn't the shown side panel, the repository list, the branch card and the terminal scan don't run.

### Inbox

- Every 3 minutes, shown or not, three searches:
  - `gh search prs --review-requested=@me --state=open`
  - `gh search prs --author=@me --state=open --review=changes_requested`
  - `gh search prs --author=@me --state=open --checks=failure`
- The badge counts only the first: pull requests where someone is waiting on me. My own red or blocked pull requests are mine to deal with and only show in the inbox.
- Landing on Inbox (its tab or `cmd-shift-g`) searches at once.
- A review request that wasn't in the previous result posts a toast ("Review requested: owner/repo#766") that opens the dialog. The first search after startup posts none. No sound.
- The tab bar button runs the inbox, since it's always shown, and hands results to the panel through shared state (`gh-prs.inbox`).

### The dialog

- Opening a pull request shows what the list has at once, then loads three sources and merges them by time:
  - `gh pr view N -R owner/repo --json …`: description, comments, reviews, checks, reviewers, merge state, linked issues.
  - `gh api --paginate --slurp repos/{o}/{r}/pulls/{n}/comments`: inline review comments, grouped into threads by `in_reply_to_id` and placed under their review by `pull_request_review_id`. A comment with `line: null` is outdated (it keeps a `position`). A reply is a review of its own with no body; those empty reviews are left out of the timeline.
  - `gh api --paginate --slurp repos/{o}/{r}/issues/{n}/timeline`: events.
- `#123` and `owner/repo#123` links open in the dialog, with Back. Other links open in the browser.
- **Actions**:
  - Comment: `gh pr comment`.
  - Review: `gh pr review --approve | --request-changes | --comment -b`.
  - Reply to a thread: `gh api -X POST repos/{o}/{r}/pulls/{n}/comments/{id}/replies`.
  - Ready for review or Convert to draft: `gh pr ready [--undo]`.
  - Close or Reopen: `gh pr close | reopen`.
  - Merge: `gh pr merge N -R owner/repo --squash | --merge | --rebase --match-head-commit <sha> --delete-branch` (or `--auto` instead of `--delete-branch`), run from `$HOME`. `--match-head-commit` refuses the merge if someone pushed after the dialog loaded.
  - Each action reloads the pull request and tells the panel through shared state (`gh-prs.changed`).
- **Merge** always deletes the branch. It runs from `$HOME` with `-R` so `gh` deletes only the remote branch. Inside a checkout, `gh` would switch that checkout to the default branch to delete the local one, which fails when another worktree has `main` and yanks a running agent's branch when it doesn't. Local branches and worktrees are left for the `worktree` mod's Remove. This is intentional.
- **Merge methods** come from `gh api repos/{o}/{r}` (`allow_squash_merge`, `allow_merge_commit`, `allow_rebase_merge`, `allow_auto_merge`, `delete_branch_on_merge`), cached per repository. The last pick is remembered per repository (`gh-prs.mergeMethods`).
- **Auto-merge** hands the merge to GitHub, so `--delete-branch` can't apply then: the branch is deleted only if the repository deletes merged branches itself (`delete_branch_on_merge`), and the confirmation says which.
- **The confirmation lives in the dialog.** The `confirm` mod runs a Herdr command on Enter, and commands can't carry which pull request or which method.
- **Checkout** needs a local clone: the focused folder when it's in the repo, else any folder the panel has seen in it. Without one (an inbox pull request from a repo never visited) the button is disabled.
- **Checkout** never touches an existing checkout:
  1. If `git worktree list` has the pull request's branch, open (or switch to) a space on that folder.
  2. Otherwise `git worktree add --detach ~/.herdr/worktrees/<repo>/<branch slug>`, then `gh pr checkout N` inside it. That handles forks and sets the upstream.
  3. `run("space.new", { folder })`.

  It uses the `worktree` mod's root and slug, so that mod's Open and Remove see these checkouts. That mod can't be handed the branch directly: it makes a missing branch from `HEAD`, not from the pull request.
- **Review** opens a new tab named `Review #N` running `plannotator review <PR_URL>`: plannotator's browser review, which uses `gh`'s auth, works on its own temporary checkout, and posts the review (line comments included) to GitHub. A tab, not a split, so the layout stays as it is. The session blocks until the review is submitted or closed; then the tab closes. A terminal closes when its program exits, so whatever runs there must wait (a bare `gh pr diff` with no pager configured flashes and closes).

### Keys

- `cmd-g` → `gh-prs.toggle`: show or hide the panel on its last view.
- `cmd-shift-g` → `gh-prs.inbox`: with the panel hidden, show it on Inbox. With it shown, flip between Inbox and This repo.
- `gh-prs.repo` (unbound): show the panel on This repo.
- A toast's click action can't carry arguments to a mod command, so a review request toast opens Inbox rather than the pull request.

## Built from

- **Layout** (`layouts/neverforest.json`): the `tabs` block becomes a 42px `tab-bar` row of `tabs` and an 88px `gh-prs-button` block (`{ mod: "gh-prs", props: { button: true } }`, `window_drag`). `panel-body` gets a third child, `gh-prs` (`{ mod: "gh-prs" }`).
- **Mod** `mods/gh-prs/`:
  - `main.js`: the panel, the button (props `button`) and the overlays (the dialog, the copy and merge menus).
  - `sync.js`: every read through `gh` and `hc`: repository resolution, the branch card, the open list and its cache, the inbox, mention lookups.
  - `dialog.js`: the dialog.
  - `actions.js`: every write: comment, review, reply, ready, close, merge, checkout, review.
  - `assets.js`: icons and avatars, written to `data/gh-prs/`.
- **Dotfiles**: linked by `mise.toml` (`"~/.config/herdr-app/mods/gh-prs" = {}`). Keys in `keys.json`.
- **herdr**: `spaces`, `panes`, `focused`, `layout`, `theme`, `exec`, `hc`, `run` (`layout.select`, `layout.show`, `layout.hide`, `pane.split`, `space.new`), `openOverlay`, `closeOverlay`, `notify`, `props`, `shared` / `setShared` (`workspace.panels`, `gh-prs.inbox`, `gh-prs.view`, `gh-prs.changed`), `nextCommand`, `appHome`, `home`, `localStorage`, `fs/promises`.
- **gpui-base**: `TextView.markdown`, `TextareaState` / `Textarea`, `InputState` / `Input`.
- **Programs**: `gh`, `git`, `curl` (avatars), `plannotator` (Review).

## Watch out

- Herdr doesn't draw SVGs or images from a symlinked mod folder, and this one is symlinked from dotfiles. Icons and avatars live in `data/gh-prs/`, drawn only once they're on disk.
- `shared("workspace.panels")` is the list of panels the tab bar remembers per space. Append `gh-prs` to what's there; never reset it to the default `["files", "changes"]`. Mine has Files turned off.
- Key commands reach shown copies only, and `localStorage` is per copy. The button copy is always shown, so it owns the keys and the inbox; it talks to the panel through `shared`.
- `init`'s first argument isn't an overlay's props: read them with `props()`.
- `TextView.markdown` draws no images, and there's no inline styled text. Images are cut out of the markdown and drawn between its runs, except in table rows, where cutting breaks the table: there the alt text stands in.
- Saving a file in this symlinked mod doesn't hot reload it. Switch layouts and back (`herdr-app do layout.switch --name main`, then `--name neverforest`) to start it fresh.
- Saving a mod file reloads it; a dialog loading at that moment shows "interrupted".
- `statusCheckRollup` mixes `CheckRun` (`name`, `status`, `conclusion`, `detailsUrl`) and `StatusContext` (`context`, `state`, `targetUrl`). Count both. `SKIPPED` and `NEUTRAL` count as passed.
- `reviewDecision` is `""` on repositories without required reviews.
- REST has no "resolved" flag on review threads (GraphQL only), so resolved threads still show. Only outdated ones collapse.

## Not in v1

- Unread review comments on my pull requests and unresolved thread counts: both need GraphQL.
- An in-dialog diff viewer. Line comments happen in plannotator (Review).
- Editing labels, reviewers or assignees.
- Deleting local branches or worktrees after a merge.
- Remote-machine spaces. Every `gh` call goes through one helper, so passing `on` later is a small change.

## Build phases

1. **Skeleton**: the mod folder, the `mise.toml` link, the layout, the button and `workspace.panels`, the branch card and the open list with its cache.
2. **Inbox**: the three searches, the badge, the toast, `cmd-g` / `cmd-shift-g`, In this terminal.
3. **Dialog, read-only**: the timeline, the sidebar, the copy menu, links with Back, Review, Checkout.
4. **Actions**: comment, review, reply, ready, close and reopen, merge.

## Done when

- `herdr-app check ~/.config/herdr-app/mods/gh-prs` passes.
- The tab bar shows Changes and PRs. PRs opens and closes the panel, and switching spaces restores it.
- In a worktree with an open pull request, the branch card shows its checks and reviews. On `main`, there's no card.
- The open list matches `gh pr list`, and All, Mine, Needs my review and the filter change it.
- The badge matches `gh search prs --review-requested=@me --state=open`.
- `echo "#12"` in a terminal puts #12 under In this terminal within 3 seconds, when #12 is a pull request.
- A row opens the dialog at once, with inline threads under their reviews.
- Checkout opens a new space on a worktree in `~/.herdr/worktrees/`; a second click goes to the same one.
- A comment, a review, a reply and a merge show on github.com, and the merged branch is gone from the remote.
