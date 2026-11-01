// Everything that changes something: in Herdr (checkout, open diff) or, from
// phase 4, on GitHub. Runs locally.

import { exec, run, spaces, home } from "herdr";

// The worktree mod's conventions, so its Open and Remove see these checkouts.
const ROOT = () => `${home()}/.herdr/worktrees`;
const slug = (branch) => branch.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

async function git(cwd, args) {
  const r = await exec("git", args, { cwd });
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim() || `git ${args[0]} failed`);
  return r.stdout.trim();
}

// The main checkout of the repo a folder is in (also from inside a linked worktree).
async function mainCheckout(folder) {
  const common = await git(folder, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  return common.endsWith("/.git") ? common.slice(0, -5) : common;
}

async function worktreeFor(main, branch) {
  const list = await git(main, ["worktree", "list", "--porcelain"]);
  for (const block of list.split(/\n\n+/)) {
    const lines = block.split("\n");
    const path = lines.find((l) => l.startsWith("worktree "))?.slice(9);
    const b = lines.find((l) => l.startsWith("branch "))?.slice(7).replace(/^refs\/heads\//, "");
    if (path && b === branch && !lines.some((l) => l.startsWith("prunable"))) return path;
  }
  return null;
}

function openSpace(folder) {
  const existing = spaces().find((s) => s.folder === folder && !s.machine);
  if (existing) run("space.select", { id: existing.id });
  else run("space.new", { folder });
}

/**
 * Opens a space on the pull request's branch without touching any existing
 * checkout: an existing worktree for the branch is reused, otherwise a new one
 * goes in ~/.herdr/worktrees/<repo>/<branch>. `local` is any folder inside a
 * clone of the repository.
 */
export async function checkout({ number, repo, branch, local }) {
  if (!local) throw new Error(`No local clone of ${repo} to check out into`);
  const main = await mainCheckout(local);
  const existing = await worktreeFor(main, branch);
  if (existing) { openSpace(existing); return existing; }

  const path = `${ROOT()}/${main.split("/").pop()}/${slug(branch)}`;
  await exec("mkdir", ["-p", path.slice(0, path.lastIndexOf("/"))]);
  await git(main, ["worktree", "add", "--detach", path]);
  // gh handles forks and sets the upstream.
  const r = await exec("gh", ["pr", "checkout", String(number), "-R", repo], { cwd: path });
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim() || "gh pr checkout failed");
  openSpace(path);
  return path;
}

/**
 * Plannotator's PR review (browser UI; uses gh's auth, posts the review to
 * GitHub) in a tab of its own, so the layout stays as it is. The session
 * blocks until the review is submitted or closed, then the tab goes with it.
 */
export function openReview({ number, repo }) {
  run("terminal.open", { argv: ["plannotator", "review", `https://github.com/${repo}/pull/${number}`], folder: home(), place: "tab", name: `Review #${number}` });
}

// ---- writes on GitHub ----

async function gh(args, { cwd } = {}) {
  const r = await exec("gh", args, { cwd: cwd ?? home() });
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim() || `gh ${args.slice(0, 2).join(" ")} failed`);
  return r.stdout;
}

/**
 * A top-level comment.
 */
export const comment = ({ repo, number, body }) => gh(["pr", "comment", String(number), "-R", repo, "--body", body]);

const VERDICT_FLAG = { approve: "--approve", changes: "--request-changes", comment: "--comment" };

/**
 * A review with a verdict. Request changes and comment need a body; approve doesn't.
 */
export const review = ({ repo, number, verdict, body }) =>
  gh(["pr", "review", String(number), "-R", repo, VERDICT_FLAG[verdict], ...(body ? ["--body", body] : [])]);

/**
 * A reply in an inline review thread (REST: gh has no porcelain for it).
 */
export const reply = ({ repo, number, id, body }) =>
  gh(["api", "-X", "POST", `repos/${repo}/pulls/${number}/comments/${id}/replies`, "-f", `body=${body}`]);

export const ready = ({ repo, number, undo }) => gh(["pr", "ready", String(number), "-R", repo, ...(undo ? ["--undo"] : [])]);

/**
 * Close or reopen, taking the comment box's text along as a comment.
 */
export const setOpen = ({ repo, number, open, body }) =>
  gh(["pr", open ? "reopen" : "close", String(number), "-R", repo, ...(body ? ["--comment", body] : [])]);

const methodCache = {};

/**
 * What the repository allows: merge methods, auto-merge, and whether GitHub
 * deletes head branches by itself.
 */
export async function mergeOptions(repo) {
  methodCache[repo] ??= gh(["api", `repos/${repo}`]).then((out) => {
    const r = JSON.parse(out);
    return {
      methods: [["squash", r.allow_squash_merge], ["merge", r.allow_merge_commit], ["rebase", r.allow_rebase_merge]].filter(([, ok]) => ok).map(([m]) => m),
      auto: Boolean(r.allow_auto_merge),
      deletesBranches: Boolean(r.delete_branch_on_merge),
    };
  }).catch((e) => { delete methodCache[repo]; throw e; });
  return methodCache[repo];
}

/**
 * Merges and deletes the remote branch. Runs from $HOME with -R so gh never
 * touches a local checkout (inside one it would switch it to the default
 * branch to delete the local branch). --match-head-commit refuses the merge
 * if someone pushed after the dialog loaded. With auto, GitHub merges later
 * and --delete-branch can't apply; the repository setting decides.
 */
export function merge({ repo, number, method, auto, head }) {
  const args = ["pr", "merge", String(number), "-R", repo, `--${method}`, "--match-head-commit", head];
  args.push(auto ? "--auto" : "--delete-branch");
  return gh(args);
}
