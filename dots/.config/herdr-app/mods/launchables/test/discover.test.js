import assert from "node:assert/strict";
import test from "node:test";

import { discoverConfig, discoverZoxide } from "../lib/discover.js";

function fakeIo(files, execs = {}) {
  return {
    readTextFile: async (path) => files[path] ?? null,
    exec: async (cmd, args) => {
      const key = [cmd, ...args].join(" ");
      for (const [prefix, result] of Object.entries(execs)) if (key.startsWith(prefix)) return result;
      return { code: 1, stdout: "", stderr: "" };
    },
  };
}

const json = (value) => JSON.stringify(value);

test("merges global and the nearest project config; project wins by key", async () => {
  const io = fakeIo({
    "/home/me/.config/.launchables.json": json({ Pi: { type: "pane", command: "pi" }, Shared: { type: "tab" } }),
    "/repo/.launchables.json": json({ Shared: { type: "tab", name: "project" } }),
  });
  const { entries, errors } = await discoverConfig(io, { cwd: "/repo/packages/web", machine: null, home: "/home/me" });
  assert.deepEqual(errors, []);
  assert.deepEqual(entries.map((e) => `${e.source}:${e.name}`), ["project:Shared", "global:Pi"]);
  assert.equal(entries[0].configDir, "/repo");
});

test("invalid entries come back as errors", async () => {
  const io = fakeIo({ "/home/me/.config/.launchables.json": json({ Bad: { type: "split" } }) });
  const { entries, errors } = await discoverConfig(io, { cwd: "/x", machine: null, home: "/home/me" });
  assert.deepEqual(entries, []);
  assert.equal(errors.length, 1);
});

test("a linked worktree borrows the primary checkout's config, resolved from the worktree", async () => {
  const io = fakeIo(
    { "/repo/.launchables.json": json({ Dev: { type: "pane", cwd: "web" } }) },
    {
      "git -C /wt/feat/src rev-parse --show-toplevel": { code: 0, stdout: "/wt/feat\n", stderr: "" },
      "git -C /wt/feat/src worktree list": { code: 0, stdout: "worktree /repo\0HEAD abc\0\0worktree /wt/feat\0", stderr: "" },
    },
  );
  const { entries } = await discoverConfig(io, { cwd: "/wt/feat/src", machine: null, home: "/home/me" });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].configPath, "/repo/.launchables.json");
  assert.equal(entries[0].configDir, "/wt/feat");
});

test("the primary checkout itself doesn't borrow from anywhere", async () => {
  const io = fakeIo(
    {},
    {
      "git -C /repo rev-parse": { code: 0, stdout: "/repo\n", stderr: "" },
      "git -C /repo worktree list": { code: 0, stdout: "worktree /repo\0", stderr: "" },
    },
  );
  assert.deepEqual((await discoverConfig(io, { cwd: "/repo", machine: null, home: "/h" })).entries, []);
});

test("zoxide: absolute folders in rank order; missing zoxide or a dead machine gives none", async () => {
  const io = fakeIo({}, { "/bin/sh -c": { code: 0, stdout: "/a\n/b\nnot-absolute\n", stderr: "" } });
  assert.deepEqual(await discoverZoxide(io, { machine: null }), ["/a", "/b"]);
  const dead = { exec: async () => Promise.reject(new Error("unreachable")) };
  assert.deepEqual(await discoverZoxide(dead, { machine: "nas" }), []);
});
