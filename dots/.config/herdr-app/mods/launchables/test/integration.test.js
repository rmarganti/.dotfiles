// Drives lib/launch.js against the running Herdr app, in a throwaway space it
// closes afterwards. Opt in: `npm run test:integration` (needs herdr-app and hc).

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { execute } from "../lib/launch.js";

const run = promisify(execFile);
const SPACE = "zz-launchables-it";
const enabled = process.env.LAUNCHABLES_INTEGRATION === "1";

async function cli(cmd, args) {
  try {
    const { stdout, stderr } = await run(cmd, args, { encoding: "utf8" });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

const ls = async () => JSON.parse((await cli("herdr-app", ["ls"])).stdout);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeApi(spaceIds) {
  return {
    do: async (name, args) => {
      const r = await cli("herdr-app", ["do", name, JSON.stringify(args ?? {})]);
      const out = JSON.parse(r.stdout || "{}");
      if (r.code !== 0 || out.error) throw new Error(out.error ?? r.stderr);
      if (name === "space.new") spaceIds.add(out.space);
      return out;
    },
    hc: (args) => cli("hc", args),
    ls,
    spaces: () => [],
    idleTerminals: async () => [],
    sleep,
  };
}

async function waitFor(check, what, ms = 8000) {
  const end = Date.now() + ms;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await sleep(100);
  }
}

const spaceNamed = async (name) => (await ls()).spaces.find((s) => s.name === name);
const labels = async (terminal) => JSON.parse((await cli("hc", ["get", terminal])).stdout).labels ?? {};

test("launches a real workspace, tab layout, split and background job", { skip: !enabled && "set LAUNCHABLES_INTEGRATION=1" }, async (t) => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "launchables-it-")));
  for (const sub of ["a", "b", "c", "d"]) fs.mkdirSync(path.join(dir, sub));
  const mark = (name) => `pwd > ${path.join(dir, `${name}.mark`)}`;
  const read = (name) => fs.readFileSync(path.join(dir, `${name}.mark`), "utf8").trim();
  const exists = (name) => fs.existsSync(path.join(dir, `${name}.mark`));

  const before = (await ls()).spaces.map((s) => s.id);
  const created = new Set();
  const api = makeApi(created);
  const background = [];
  t.after(async () => {
    for (const id of created) await cli("herdr-app", ["do", "space.close", JSON.stringify({ id, confirmed: true })]);
    for (const address of background) await cli("hc", ["rm", address]);
    // Closed terminals linger as finished (once closing has ended them); remove the ones this test made.
    await sleep(1000);
    const all = JSON.parse((await cli("hc", ["ls", "--json", "--all"])).stdout || "{}").terminals ?? [];
    for (const { address } of all) {
      const mine = created.has((await labels(address))["herdr.space"]);
      if (mine) await cli("hc", ["rm", address]);
    }
    if (before.length) await cli("herdr-app", ["do", "space.select", JSON.stringify({ id: before[0] })]);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // 1. A workspace: tab one = root + three panes to the right (balanced), tab two = mixed directions.
  const workspace = {
    type: "ensure-space",
    name: SPACE,
    matchName: SPACE,
    cwd: dir,
    machine: null,
    tabs: [
      {
        label: "grid",
        cwd: dir,
        panes: [
          { cwd: dir, command: `${mark("root")}`, commandMode: "keep-shell" },
          { cwd: path.join(dir, "a"), command: mark("a"), commandMode: "keep-shell", direction: "right" },
          { cwd: path.join(dir, "b"), command: `${mark("b")} && true`, direction: "right" }, // exit-on-success: closes
          { cwd: path.join(dir, "c"), command: `${mark("c")} && false`, direction: "right" }, // fails: stays as a shell
        ],
      },
      {
        label: "mixed",
        cwd: path.join(dir, "d"),
        panes: [{ cwd: path.join(dir, "d") }, { cwd: dir, direction: "right" }, { cwd: dir, direction: "down", command: "sleep 0.2", commandMode: "exit-always" }],
      },
    ],
  };
  const result = await execute(api, workspace);
  assert.equal(result.existed, false);

  const space = await waitFor(() => spaceNamed(SPACE), "the space");
  assert.deepEqual(space.tabs.map((tab) => tab.name), ["grid", "mixed"]);
  assert.equal(space.tabs.find((tab) => tab.active)?.name, "grid", "the first tab is shown at the end");

  // cwd per pane, root command typed into the fresh shell
  await waitFor(() => ["root", "a", "b", "c"].every(exists), "marker files");
  assert.equal(read("root"), dir);
  assert.equal(read("a"), path.join(dir, "a"));
  assert.equal(read("b"), path.join(dir, "b"));
  assert.equal(read("c"), path.join(dir, "c"));

  // commandMode: b exited on success (closed), c failed (kept), exit-always closed in tab two
  const grid = await waitFor(async () => {
    const s = await spaceNamed(SPACE);
    const g = s.tabs.find((tab) => tab.name === "grid");
    const m = s.tabs.find((tab) => tab.name === "mixed");
    return g.terminals.length === 3 && m.terminals.length === 2 ? g : null;
  }, "b and the exit-always pane to close");

  // 2. Idempotent: launching the workspace again focuses it, builds nothing.
  // (`herdr-app ls` has no `named`; the space was made with a name, so it is.)
  const live = (await ls()).spaces.map((s) => ({ ...s, named: true }));
  const spacesBefore = live.length;
  const again = await execute({ ...api, spaces: () => live }, workspace);
  assert.equal(again.existed, true);
  assert.equal((await ls()).spaces.length, spacesBefore);

  // 3. A top-level pane splits the source pane, in its own folder, and gets focus.
  const source = grid.terminals[0].pane;
  const split = await execute(api, { type: "split-pane", fromPane: source, pane: { cwd: path.join(dir, "d"), command: mark("split"), commandMode: "keep-shell", direction: "down" } });
  await waitFor(() => exists("split"), "the split's marker");
  assert.equal(read("split"), path.join(dir, "d"));
  const status = JSON.parse((await cli("herdr-app", ["status"])).stdout);
  assert.equal(status.focused_pane, split.pane);

  // 4. Background: a detached core terminal outside every space, with the person's shell.
  const job = await execute(api, { type: "run-background", command: mark("bg"), cwd: path.join(dir, "b"), machine: null, logName: "it" });
  if (job.address) background.push(job.address);
  await waitFor(() => exists("bg"), "the background marker");
  assert.equal(read("bg"), path.join(dir, "b"));
  const inSpaces = (await ls()).spaces.flatMap((s) => s.tabs.flatMap((tab) => tab.terminals.map((x) => x.terminal)));
  assert.ok(job.address && !inSpaces.includes(job.address), "background jobs stay out of the window");
});
