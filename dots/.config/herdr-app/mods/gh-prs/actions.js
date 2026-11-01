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
