import test from "node:test";
import assert from "node:assert/strict";
import { tabName } from "../tab-name.js";

const tab = { id: "tab1", name: "2", named: false };
const pane = (cwd, extra = {}) => ({ tab: tab.id, terminal: "t1", cwd, ...extra });

test("manual names win, including numeric names", () => {
  for (const name of ["fix login", "2", "tb123"]) {
    assert.equal(tabName({ ...tab, named: true, name }, [pane("/repo")]), name);
  }
});

test("unnamed tabs follow the focused terminal's directory", () => {
  const panes = [pane("/repo/api"), pane("/repo/web", { focused: true })];
  assert.equal(tabName(tab, panes), "web");
  assert.equal(tabName(tab, panes.map(p => ({ ...p, focused: false }))), "api");
});

test("ignore other tabs, mod panes, and missing directories", () => {
  assert.equal(tabName(tab, [
    pane("/wrong", { tab: "other", focused: true }),
    pane("/mod", { terminal: null, focused: true }),
    pane(null),
    pane("/repo/right"),
  ]), "right");
  assert.equal(tabName(tab, []), "2");
  assert.equal(tabName(tab, [pane(null), pane("", { focused: true })]), "2");
});

test("directory labels handle home, roots, trailing separators, Unicode, and Windows", () => {
  for (const [cwd, home, expected] of [
    ["/Users/me", "/Users/me", "~"],
    ["/Users/me/", "/Users/me/", "~"],
    ["/", "/Users/me", "/"],
    ["/repo/web///", null, "web"],
    ["/repo/你好 world", null, "你好 world"],
    ["C:\\Users\\me\\project\\", null, "project"],
    ["C:\\", null, "C:"],
    ["/Users/me", null, "me"],
  ]) assert.equal(tabName(tab, [pane(cwd)], home), expected);
});

test("rendering labels does not modify names or manual-name flags", () => {
  const before = { ...tab };
  tabName(tab, [pane("/repo")]);
  assert.deepEqual(tab, before);
});
