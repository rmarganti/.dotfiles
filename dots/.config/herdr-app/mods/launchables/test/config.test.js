import assert from "node:assert/strict";
import test from "node:test";

import { mergeConfigEntries, parseLaunchablesFile, validateLaunchable } from "../lib/config.js";
import { basename, dirname, normalize, resolve, shortenHome } from "../lib/path.js";

test("path helpers", () => {
  assert.equal(normalize("/a/./b/../c/"), "/a/c");
  assert.equal(resolve("/a/b", "../c"), "/a/c");
  assert.equal(resolve("/a/b", "/x"), "/x");
  assert.equal(resolve("/a/b", undefined), "/a/b");
  assert.equal(dirname("/a/b/.launchables.json"), "/a/b");
  assert.equal(dirname("/a"), "/");
  assert.equal(basename("/a/b/"), "b");
  assert.equal(shortenHome("/Users/me/code", "/Users/me"), "~/code");
  assert.equal(shortenHome("/Users/me", "/Users/me"), "~");
  assert.equal(shortenHome("/Users/meow", "/Users/me"), "/Users/meow");
});

test("valid launchables of every type", () => {
  const ok = (value) => assert.deepEqual(validateLaunchable("k", value).errors, []);
  ok({ type: "background", command: "x", cwd: "." });
  ok({ type: "idle-panes", command: "clear" });
  ok({ type: "pane", command: "pi", commandMode: "loop", direction: "down", name: "agent" });
  ok({ type: "tab" });
  ok({ type: "tab", panes: [{ type: "pane", command: "a" }, { type: "pane", direction: "down" }] });
  ok({ type: "workspace", tabs: [{ type: "tab", name: "one" }] });
});

test("invalid launchables are explained", () => {
  const errs = (value) => validateLaunchable("k", value).errors.join("\n");
  assert.match(errs({ type: "split", command: "x" }), /use type "pane"/);
  assert.match(errs({ type: "tab", command: "x" }), /tab.command is no longer supported/);
  assert.match(errs({ type: "tab", panes: [] }), /non-empty array/);
  assert.match(errs({ type: "tab", panes: [{ type: "pane", direction: "right" }] }), /first\/root pane/);
  assert.match(errs({ type: "tab", panes: [{ command: "x" }] }), /type must be "pane"/);
  assert.match(errs({ type: "workspace", tabs: [] }), /workspace.tabs must be a non-empty array/);
  assert.match(errs({ type: "pane", commandMode: "loop" }), /requires pane.command/);
  assert.match(errs({ type: "pane", command: "x", commandMode: "nope" }), /commandMode must be/);
  assert.match(errs({ type: "background", command: "x", name: "n" }), /background must not define name/);
  assert.match(errs({ type: "idle-panes", command: "x", cwd: "." }), /idle-panes must not define cwd/);
  assert.match(errs({ type: "rocket" }), /unsupported type/);
  assert.match(errs("nope"), /expected object/);
});

test("a file's invalid entries are skipped and its valid ones kept", () => {
  const text = JSON.stringify({ Good: { type: "pane", command: "pi" }, Bad: { type: "split" } });
  const { entries, errors } = parseLaunchablesFile(text, { path: "/p/.launchables.json", source: "project" });
  assert.deepEqual(entries.map((e) => e.name), ["Good"]);
  assert.equal(entries[0].configDir, "/p");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^\/p\/.launchables.json: Bad:/);
});

test("unparseable JSON is one error and no entries", () => {
  const { entries, errors } = parseLaunchablesFile("{ nope", { path: "/x.json", source: "global" });
  assert.deepEqual(entries, []);
  assert.equal(errors.length, 1);
});

test("project entries override global ones by key and sort first", () => {
  const g = [{ name: "B", source: "global" }, { name: "Same", source: "global" }];
  const p = [{ name: "Same", source: "project" }, { name: "A", source: "project" }];
  assert.deepEqual(mergeConfigEntries(g, p).map((e) => `${e.source}:${e.name}`), ["project:A", "project:Same", "global:B"]);
});
