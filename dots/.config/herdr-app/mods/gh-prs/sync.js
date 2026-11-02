// Every read through gh: repository resolution, the branch card, the open
// list and its cache. Runs locally; remote spaces would pass `on` through gh().

import { exec, appHome } from "herdr";
import * as fs from "fs/promises";

export const OPEN_LIMIT = 100;
const VERSION = 1;

const LIST_FIELDS = "number,title,author,isDraft,headRefName,reviewDecision,statusCheckRollup,updatedAt,url";
const CARD_FIELDS = [
  "number", "title", "state", "isDraft", "url", "author",
  "headRefName", "baseRefName", "additions", "deletions",
  "reviewDecision", "latestReviews", "reviewRequests",
  "statusCheckRollup", "mergeStateStatus",
].join(",");

const folder = () => `${appHome()}/data/gh-prs`;
const cacheFile = (repo) => `${folder()}/repo-${repo.replace("/", "__")}.json`;

/**
 * Runs gh and returns stdout, or throws with gh's own message.
 */
export async function gh(args, { cwd } = {}) {
  const r = await exec("gh", args, cwd ? { cwd } : {});
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim() || `gh ${args[0]} failed`);
  return r.stdout;
}

/**
 * The GitHub repository a folder belongs to, or null outside one.
 */
export async function repoFor(cwd) {
  const out = await gh(["repo", "view", "--json", "nameWithOwner,defaultBranchRef", "-q", "[.nameWithOwner, .defaultBranchRef.name] | @tsv"], { cwd })
    .catch(() => null);
  if (!out) return null;
  const [repo, defaultBranch] = out.trim().split("\t");
  return repo ? { repo, defaultBranch } : null;
}

export async function login() {
  return (await gh(["api", "user", "-q", ".login"])).trim();
}

export async function currentBranch(cwd) {
  const r = await exec("git", ["branch", "--show-current"], { cwd }).catch(() => null);
  return r?.code === 0 ? r.stdout.trim() : "";
}

/**
 * The pull request for the folder's checked-out branch, or null when it has none.
 */
export async function branchPr(cwd) {
  try {
    return JSON.parse(await gh(["pr", "view", "--json", CARD_FIELDS], { cwd }));
  } catch (e) {
    if (/no pull requests found/i.test(String(e.message))) return null;
    throw e;
  }
}

/**
 * The repository's open pull requests, most recently updated first, plus the
 * numbers that request my review (directly or through a team).
 */
export async function openPrs(repo) {
  const [list, requested] = await Promise.all([
    gh(["pr", "list", "-R", repo, "--state", "open", "--limit", String(OPEN_LIMIT), "--json", LIST_FIELDS]),
    gh(["pr", "list", "-R", repo, "--state", "open", "--limit", String(OPEN_LIMIT), "--search", "review-requested:@me", "--json", "number"]),
  ]);
  return {
    prs: JSON.parse(list).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    requested: JSON.parse(requested).map((p) => p.number),
    synced: Date.now(),
    version: VERSION,
  };
}

const INBOX_LIMIT = "50";
const INBOX_FIELDS = "number,title,repository,url,isDraft,updatedAt,author";

/**
 * The three inbox searches. Kept slim: the result lives in shared state.
 */
export async function inbox() {
  const search = async (args) => JSON.parse(await gh(["search", "prs", "--state=open", "--archived=false", "--limit", INBOX_LIMIT, "--json", INBOX_FIELDS, ...args]))
    .map((p) => ({ repo: p.repository.nameWithOwner, number: p.number, title: p.title, url: p.url, isDraft: p.isDraft, updatedAt: p.updatedAt, author: p.author?.login }));
  const [requested, changes, failing] = await Promise.all([
    search(["--review-requested=@me"]),
    search(["--author=@me", "--review=changes_requested"]),
    search(["--author=@me", "--checks=failure"]),
  ]);
  return { requested, changes, failing, at: Date.now(), error: null };
}

/**
 * A pull request's number, title and state, or null when the number isn't one.
 */
export async function lookup(repo, number) {
  try {
    return JSON.parse(await gh(["pr", "view", String(number), "-R", repo, "--json", "number,title,state,isDraft,url,author"]));
  } catch {
    return null;
  }
}

/**
 * #123 and links to this repo's pull requests on a terminal's screen: the
 * lowest line (the newest) first, each line read left to right.
 */
export function mentions(text, repo) {
  const found = [];
  const pattern = new RegExp(`(?:^|[^\\w&/#])#(\\d{1,6})(?![\\w-])|github\\.com/${repo.replace(/\./g, "\\.")}/pull/(\\d+)`, "g");
  for (const line of text.split("\n").reverse()) {
    for (const m of line.matchAll(pattern)) {
      const n = Number(m[1] ?? m[2]);
      if (!found.includes(n)) found.push(n);
    }
  }
  return found;
}

export async function readCache(repo) {
  const saved = await fs.readFile(cacheFile(repo), "utf8").then(JSON.parse).catch(() => null);
  return saved?.version === VERSION ? saved : null;
}

export async function writeCache(repo, store) {
  await fs.mkdir(folder(), { recursive: true });
  await fs.writeFile(cacheFile(repo), JSON.stringify(store));
}

const PASSED = new Set(["SUCCESS", "SKIPPED", "NEUTRAL"]);

/**
 * statusCheckRollup mixes CheckRun and StatusContext entries; both count.
 */
export function checks(rollup = []) {
  const out = { passed: 0, running: 0, failed: [] };
  for (const c of rollup ?? []) {
    if (c.__typename === "StatusContext") {
      if (c.state === "SUCCESS") out.passed++;
      else if (c.state === "PENDING" || c.state === "EXPECTED") out.running++;
      else out.failed.push({ name: c.context, url: c.targetUrl });
    } else if (c.status !== "COMPLETED") out.running++;
    else if (PASSED.has(c.conclusion)) out.passed++;
    else out.failed.push({ name: c.name, url: c.detailsUrl });
  }
  out.total = out.passed + out.running + out.failed.length;
  return out;
}
