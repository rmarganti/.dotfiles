import assert from "node:assert/strict";
import test from "node:test";

import { buildRows, compileConfigEntry, findMatchingSpace } from "../lib/plan.js";

const ctx = { space: "s1", tab: "t1", pane: "p1", machine: null, cwd: "/work/here", home: "/home/me" };
const project = (name, launchable) => ({ name, source: "project", configDir: "/repo", launchable });
const global = (name, launchable) => ({ name, source: "global", configDir: "/home/me/.config", launchable });

const space = (id, name, extra = {}) => ({ id, name, named: true, folder: `/f/${name}`, machine: null, status: null, tabs: [], ...extra });
const tab = (id, name, extra = {}) => ({ id, name, status: null, ...extra });

test("cwd: project entries default to their config folder, global ones to the source pane's", () => {
  assert.equal(compileConfigEntry(project("p", { type: "pane" }), ctx).pane.cwd, "/repo");
  assert.equal(compileConfigEntry(global("g", { type: "pane" }), ctx).pane.cwd, "/work/here");
  assert.equal(compileConfigEntry(project("p", { type: "pane", cwd: "web" }), ctx).pane.cwd, "/repo/web");
});

test("cwd composes: pane > tab > workspace > source default", () => {
  const action = compileConfigEntry(
    project("W", {
      type: "workspace",
      cwd: "app",
      tabs: [
        { type: "tab", panes: [{ type: "pane" }, { type: "pane", cwd: "api" }, { type: "pane", cwd: "/abs" }] },
        { type: "tab", cwd: "docs", name: "docs" },
      ],
    }),
    ctx,
  );
  assert.equal(action.type, "ensure-space");
  assert.equal(action.cwd, "/repo/app");
  assert.deepEqual(action.tabs[0].panes.map((p) => p.cwd), ["/repo/app", "/repo/app/api", "/abs"]);
  assert.equal(action.tabs[1].cwd, "/repo/app/docs");
  assert.equal(action.tabs[1].label, "docs");
  assert.equal(action.tabs[0].label, undefined, "nested tabs without a name are left to Herdr");
});

test("names: a top-level tab or workspace falls back to the key", () => {
  assert.equal(compileConfigEntry(global("Diff", { type: "tab" }), ctx).tab.label, "Diff");
  assert.equal(compileConfigEntry(global("Diff", { type: "tab", name: "d" }), ctx).tab.label, "d");
  assert.equal(compileConfigEntry(global("W", { type: "workspace", tabs: [{ type: "tab" }] }), ctx).name, "W");
});

test("direction defaults to right for top-level and non-root panes, never on a tab's root", () => {
  assert.equal(compileConfigEntry(global("P", { type: "pane" }), ctx).pane.direction, "right");
  const t = compileConfigEntry(global("T", { type: "tab", panes: [{ type: "pane" }, { type: "pane", direction: "down" }, { type: "pane" }] }), ctx).tab;
  assert.deepEqual(t.panes.map((p) => p.direction), [undefined, "down", "right"]);
});

test("a tab without panes gets one shell pane", () => {
  assert.deepEqual(compileConfigEntry(global("T", { type: "tab" }), ctx).tab.panes, [{ cwd: "/work/here" }]);
});

test("findMatchingSpace: named, then Herdr's own name, then folder, on the same machine only", () => {
  const spaces = [
    space("a", "amux", { named: false, folder: "/x" }),
    space("b", "amux", { named: true, folder: "/y" }),
    space("c", "other", { folder: "/code/proj" }),
    space("d", "amux", { machine: "nas" }),
  ];
  assert.equal(findMatchingSpace(spaces, { matchName: "amux", cwd: "/z", machine: null }).id, "b");
  assert.equal(findMatchingSpace(spaces.filter((s) => s.id !== "b"), { matchName: "amux", cwd: "/z", machine: null }).id, "a");
  assert.equal(findMatchingSpace(spaces, { matchName: "proj", cwd: "/code/proj/", machine: null }).id, "c");
  assert.equal(findMatchingSpace(spaces, { matchName: "amux", cwd: "/z", machine: "nas" }).id, "d");
  assert.equal(findMatchingSpace(spaces, { matchName: "nope", cwd: "/nope", machine: null }), undefined);
  // A space's live location beats the folder it was made in.
  const moved = [space("e", "other", { folder: "/made/here", location: "/code/now" })];
  assert.equal(findMatchingSpace(moved, { matchName: "x", cwd: "/code/now", machine: null }).id, "e");
  assert.equal(findMatchingSpace(moved, { matchName: "x", cwd: "/made/here", machine: null }), undefined);
});

test("buildRows orders attention tabs, config, open tabs, spaces, new, zoxide", () => {
  const spaces = [
    space("s1", "here", { tabs: [tab("t1", "1"), tab("t2", "2")] }),
    space("s2", "busy", { tabs: [tab("t3", "1", { status: "done" }), tab("t4", "2", { status: "blocked" })] }),
    space("s3", "remote", { machine: "nas", tabs: [tab("t5", "1")] }),
  ];
  const rows = buildRows({
    ctx,
    configEntries: [global("Pi", { type: "pane", command: "pi" })],
    spaces,
    agents: [{ tab: "t4", program: { name: "Claude Code" } }],
    machines: ["nas"],
    zoxide: ["/home/me/code/a"],
    home: "/home/me",
  });
  assert.deepEqual(rows.map((r) => r.id), [
    "tab:t4",
    "tab:t3",
    "config:global:Pi",
    "tab:t2",
    "tab:t5",
    "space:s2",
    "space:s3",
    "new:tab",
    "new:space",
    "new:space:nas",
    "zoxide:/home/me/code/a",
  ]);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId["tab:t4"].title, "busy / 2");
  assert.equal(byId["tab:t4"].search, "busy / 2 Claude Code");
  assert.equal(byId["tab:t5"].title, "nas: remote / 1");
  assert.equal(byId["zoxide:/home/me/code/a"].title, "~/code/a");
  assert.equal(byId["zoxide:/home/me/code/a"].folder, "/home/me/code/a");
  assert.equal(byId["config:global:Pi"].command, "pi");
});

test("buildRows: a configured workspace replaces its running space, and hides when it's the focused one", () => {
  const spaces = [space("s1", "here"), space("s2", "amux", { folder: "/code/amux" })];
  const ws = (name, cwd) => global(name, { type: "workspace", cwd, tabs: [{ type: "tab" }] });
  const rows = buildRows({
    ctx,
    configEntries: [ws("amux", "/code/amux"), ws("here", "/f/here"), ws("new-one", "/code/new")],
    spaces,
    zoxide: ["/code/amux", "/code/new", "/code/other"],
  });
  const ids = rows.map((r) => r.id);
  assert.ok(ids.includes("config:global:amux"));
  assert.ok(!ids.includes("space:s2"), "the configured workspace stands in for its running space");
  assert.ok(!ids.includes("config:global:here"), "the focused space's workspace is a no-op");
  assert.ok(!ids.includes("zoxide:/code/amux") && !ids.includes("zoxide:/code/new"), "zoxide drops configured folders");
  assert.ok(ids.includes("zoxide:/code/other"));
});
