import test from "node:test";
import assert from "node:assert/strict";
import { tabShortcuts } from "../tab-shortcuts.js";

const tab = (id, settled = false) => ({ id, settled });
const labels = tabs => [...tabShortcuts(tabs)];

test("labels follow the current tab order", () => {
  assert.deepEqual(labels([tab("a"), tab("b")]), [["a", "1"], ["b", "2"]]);
  assert.deepEqual(labels([tab("b"), tab("a")]), [["b", "1"], ["a", "2"]]);
});

test("settled tabs remain unlabelled and do not consume shortcut numbers", () => {
  assert.deepEqual(labels([tab("a", true), tab("b"), tab("c", true), tab("d")]),
    [["b", "1"], ["d", "2"]]);
  assert.deepEqual(labels([tab("a", true)]), []);
  assert.deepEqual(labels([]), []);
});

test("only the first nine selectable tabs get labels; zero is not a tab shortcut", () => {
  const tabs = [tab("settled", true), ...Array.from({ length: 11 }, (_, i) => tab(`tab${i}`))];
  const shortcuts = tabShortcuts(tabs);
  assert.equal(shortcuts.size, 9);
  assert.equal(shortcuts.get("tab8"), "9");
  assert.equal(shortcuts.has("tab9"), false);
  assert.equal(shortcuts.has("tab10"), false);
  assert.deepEqual([...shortcuts.values()], ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
});

test("closing or settling a tab updates the remaining labels without mutating tabs", () => {
  const tabs = [tab("a"), tab("b"), tab("c")];
  const before = structuredClone(tabs);
  labels(tabs);
  assert.deepEqual(tabs, before);
  assert.deepEqual(labels(tabs.slice(1)), [["b", "1"], ["c", "2"]]);
  assert.deepEqual(labels(tabs.map(t => ({ ...t, settled: t.id === "b" }))),
    [["a", "1"], ["c", "2"]]);
});
