import assert from "node:assert/strict";
import test from "node:test";

import { matchPositions, NO_MATCH, parseQuery, rank, rankIndexes, scoreCandidate } from "../lib/fuzzy.js";

const titles = (items, query) => rank(items, query, (s) => s);

test("fuzzy terms match in order, case-insensitively", () => {
  assert.ok(scoreCandidate(parseQuery("pca"), "Pi Coding Agent") > 0);
  assert.equal(scoreCandidate(parseQuery("acp"), "Pi Coding Agent"), NO_MATCH);
});

test("positions point at the matched characters", () => {
  assert.deepEqual(matchPositions("hd", "Hunk Diff"), [0, 5]);
  assert.deepEqual(matchPositions("dot files", "~/.dotfiles"), [3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(matchPositions("", "anything"), []);
});

test("a long gap between matched characters still matches", () => {
  const text = `a${"x".repeat(60)}b`;
  assert.notEqual(scoreCandidate(parseQuery("ab"), text), NO_MATCH);
});

test("word-boundary matches beat mid-word matches", () => {
  assert.deepEqual(titles(["xxdotyy", "~/.dotfiles"], "dot"), ["~/.dotfiles", "xxdotyy"]);
  assert.deepEqual(titles(["fooHunkDiff", "Hunk Diff"], "hd")[0], "Hunk Diff");
});

test("ties break by length, then by original order", () => {
  assert.deepEqual(titles(["amux-long", "amux", "amux2"], "amux"), ["amux", "amux2", "amux-long"]);
  assert.deepEqual(titles(["abc", "abd"], "ab"), ["abc", "abd"]);
});

test("an empty query keeps every item in order", () => {
  assert.deepEqual(titles(["b", "a", "c"], "  "), ["b", "a", "c"]);
});

test("space-separated terms must all match (AND)", () => {
  assert.deepEqual(titles(["herdr-pluck", "herdr-app", "pluck"], "herdr pluck"), ["herdr-pluck"]);
});

test("| makes an OR group", () => {
  assert.deepEqual(titles(["amux", "anno", "ish"], "amux | ish").sort(), ["amux", "ish"]);
});

test("'exact, ^prefix, suffix$ and !negation", () => {
  const items = ["~/code/rmarganti/amux", "~/code/amux-old", "amux"];
  assert.deepEqual(titles(items, "'mux-"), ["~/code/amux-old"]);
  assert.deepEqual(titles(items, "^amux"), ["amux"]);
  assert.deepEqual(titles(items, "amux$").sort(), ["amux", "~/code/rmarganti/amux"].sort());
  assert.deepEqual(titles(items, "amux !old").sort(), ["amux", "~/code/rmarganti/amux"].sort());
  assert.deepEqual(titles(["abc"], "^abc$"), ["abc"]);
  assert.deepEqual(titles(["abcd"], "^abc$"), []);
});

test("smart case: an uppercase letter makes the term case-sensitive", () => {
  assert.deepEqual(titles(["Diff", "diff"], "D"), ["Diff"]);
  assert.equal(titles(["Diff", "diff"], "d").length, 2);
});

test("rankIndexes returns candidate indexes in rank order", () => {
  const texts = ["zzz", "amux-long", "amux"];
  assert.deepEqual(rankIndexes("amux", texts, texts.map((t) => t.toLowerCase())), [2, 1]);
  assert.deepEqual(rankIndexes("", texts, texts), [0, 1, 2]);
});

test("ranking a few hundred rows is fast", () => {
  const items = Array.from({ length: 400 }, (_, i) => `~/code/org${i}/project-${i}/packages/some-long-name-${i}`);
  const start = performance.now();
  for (let k = 0; k < 10; k++) rank(items, "org pk name", (s) => s);
  assert.ok((performance.now() - start) / 10 < 30, "should rank 400 rows well under a frame");
});
