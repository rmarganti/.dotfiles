import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { execute, splitArgv, typedCommand } from "../lib/launch.js";

/** A fake Herdr that records calls and hands out ids. */
function fakeApi({ spaces = [] } = {}) {
  const calls = [];
  const model = { spaces: [{ id: "s0", tabs: [{ id: "tab0", terminals: [{ terminal: "t0", pane: "p0" }] }] }] };
  let n = 0;
  const next = (prefix) => `${prefix}${++n}`;
  const addTerminal = (tabId) => {
    const terminal = next("t");
    const pane = next("p");
    let tab = model.spaces.flatMap((s) => s.tabs).find((t) => t.id === tabId);
    if (!tab) model.spaces[0].tabs.push((tab = { id: tabId, terminals: [] }));
    tab.terminals.push({ terminal, pane });
    return { terminal, pane };
  };
  return {
    calls,
    do: async (name, args) => {
      calls.push(["do", name, args]);
      if (name === "pane.split") return addTerminal("tab0");
      if (name === "tab.new") {
        const tab = next("tab");
        return { tab, terminal: addTerminal(tab).terminal };
      }
      if (name === "space.new") {
        const tab = next("tab");
        return { space: next("s"), tab, terminal: addTerminal(tab).terminal };
      }
      return { ok: true };
    },
    hc: async (args) => {
      calls.push(["hc", ...args]);
      return { code: 0, stdout: "{}", stderr: "" };
    },
    ls: async () => model,
    spaces: () => spaces,
    idleTerminals: async () => ["t7", "t8"],
  };
}

const names = (calls) => calls.map((c) => (c[0] === "do" ? c[1] : `hc ${c[1]}`));

test("typedCommand keeps the TUI plugin's commandMode semantics", () => {
  assert.equal(typedCommand("make"), "make && exit");
  assert.equal(typedCommand("make", "keep-shell"), "make");
  assert.equal(typedCommand("make", "exit-always"), "make; exit");
  assert.match(typedCommand("make", "loop"), /^while true; do make; rc=\$\?/);
});

// Runs the generated argv for real (with SHELL=/bin/sh) to check each mode's exit behavior.
function runArgv(argv, { shellExit = false } = {}) {
  const out = execFileSync(argv[0], argv.slice(1), {
    env: { ...process.env, SHELL: "/bin/sh", ENV: "" },
    input: shellExit ? "echo FELL-THROUGH-TO-SHELL; exit\n" : "",
    encoding: "utf8",
  });
  return out;
}

test("splitArgv cds to the folder, runs the command, and honors commandMode", () => {
  const dir = execFileSync("mktemp", ["-d"], { encoding: "utf8" }).trim();
  assert.match(runArgv(splitArgv(dir, "pwd -P", "exit-always")), new RegExp(execFileSync("realpath", [dir], { encoding: "utf8" }).trim()));
  // exit-on-success: success ends; failure falls through to an interactive shell
  assert.doesNotMatch(runArgv(splitArgv(dir, "true", "exit-on-success"), { shellExit: true }), /FELL-THROUGH/);
  assert.match(runArgv(splitArgv(dir, "false", "exit-on-success"), { shellExit: true }), /FELL-THROUGH/);
  // keep-shell: always falls through
  assert.match(runArgv(splitArgv(dir, "true", "keep-shell"), { shellExit: true }), /FELL-THROUGH/);
  // the command is passed as one argument, never re-quoted
  assert.match(runArgv(splitArgv(dir, `printf '%s\\n' "a b" 'c"d'`, "exit-always")), /a b\nc"d/);
  // no command: just a shell in the folder
  assert.match(runArgv(splitArgv(dir), { shellExit: true }), /FELL-THROUGH/);
});

test("a gated splitArgv waits for Enter before it runs anything", () => {
  const dir = execFileSync("mktemp", ["-d"], { encoding: "utf8" }).trim();
  const argv = splitArgv(dir, "echo RAN", "exit-always", true);
  const out = execFileSync(argv[0], argv.slice(1), { env: { ...process.env, SHELL: "/bin/sh", ENV: "" }, input: "\n", encoding: "utf8" });
  assert.match(out, /RAN/);
  assert.match(argv[2], /read -r _;/);
  assert.doesNotMatch(splitArgv(dir, "x")[2], /read/);
});

test("nothing in a tab runs until every pane exists", async () => {
  const api = fakeApi();
  const panes = [{ cwd: "/w", command: "root" }, { cwd: "/w", command: "b", direction: "right" }, { cwd: "/w", command: "c", direction: "down" }];
  await execute(api, { type: "create-tab", space: "s0", tab: { cwd: "/w", panes } });
  const order = names(api.calls);
  const lastSplit = order.lastIndexOf("pane.split");
  const firstSend = order.indexOf("hc send");
  assert.ok(firstSend > lastSplit, "commands start only after the last split");
  const splitArgs = api.calls.filter((c) => c[1] === "pane.split").map((c) => c[2].argv[2]);
  assert.ok(splitArgs.every((script) => script.includes("read -r _;")), "split panes are gated");
  const sends = api.calls.filter((c) => c[0] === "hc" && c[1] === "send").map((c) => c.slice(2));
  assert.deepEqual(sends, [["t4", ""], ["t6", ""], ["t2", "root && exit"]], "gates open, then the root's command is typed");
});

test("split-pane splits the source pane with an argv and focuses it", async () => {
  const api = fakeApi();
  await execute(api, { type: "split-pane", fromPane: "p0", pane: { cwd: "/w", command: "pi", direction: "down" } });
  assert.deepEqual(names(api.calls), ["pane.split", "pane.focus"]);
  const [, , args] = api.calls[0];
  assert.equal(args.pane, "p0");
  assert.equal(args.direction, "down");
  assert.deepEqual(args.argv.slice(-2), ["launchables", "pi"]);
});

test("create-tab types the root command and splits the rest in a balanced tree", async () => {
  const api = fakeApi();
  const panes = ["a", "b", "c", "d"].map((id, i) => ({ cwd: "/w", command: `cmd-${id}`, ...(i ? { direction: "right" } : {}) }));
  await execute(api, { type: "create-tab", space: "s0", tab: { label: "T", cwd: "/w", panes } });
  const splits = api.calls.filter((c) => c[1] === "pane.split").map((c) => [c[2].pane, c[2].argv.at(-1)]);
  // root p? shows a; split root → c (right half), root → b, c's pane → d: four equal quarters, in order
  const rootPane = api.calls.find((c) => c[1] === "tab.new") && "p3";
  assert.deepEqual(splits, [[rootPane, "cmd-c"], [rootPane, "cmd-b"], ["p5", "cmd-d"]]);
  assert.ok(api.calls.some((c) => c[0] === "hc" && c[1] === "send" && c[3] === "cmd-a && exit"));
  assert.deepEqual(names(api.calls).slice(-2), ["pane.focus", "tab.select"]);
});

test("mixed split directions chain from the previous pane, as the TUI plugin does", async () => {
  const api = fakeApi();
  const panes = [{ cwd: "/w" }, { cwd: "/w", direction: "right" }, { cwd: "/w", direction: "down" }];
  await execute(api, { type: "create-tab", space: "s0", tab: { cwd: "/w", panes } });
  const splits = api.calls.filter((c) => c[1] === "pane.split").map((c) => [c[2].pane, c[2].direction]);
  assert.deepEqual(splits, [["p3", "right"], ["p5", "down"]]);
});

test("ensure-space focuses a matching space instead of rebuilding it", async () => {
  const api = fakeApi({ spaces: [{ id: "sX", name: "amux", named: true, folder: "/a", machine: null }] });
  await execute(api, { type: "ensure-space", name: "amux", matchName: "amux", cwd: "/a", machine: null, tabs: [{ cwd: "/a", panes: [{ cwd: "/a", command: "x" }] }] });
  assert.deepEqual(api.calls, [["do", "space.select", { id: "sX" }]]);
});

test("ensure-space builds every tab, then shows the first", async () => {
  const api = fakeApi();
  await execute(api, {
    type: "ensure-space",
    name: "W",
    matchName: "W",
    cwd: "/w",
    machine: "nas",
    tabs: [{ label: "one", cwd: "/w", panes: [{ cwd: "/w" }] }, { label: "two", cwd: "/w/b", panes: [{ cwd: "/w/b" }] }],
  });
  assert.deepEqual(api.calls[0], ["do", "space.new", { name: "W", folder: "/w", tab: "one", machine: "nas" }]);
  assert.deepEqual(names(api.calls), ["space.new", "tab.new", "tab.select"]);
  assert.deepEqual(api.calls[1][2], { space: "s2", name: "two", folder: "/w/b" });
  assert.deepEqual(api.calls[2][2], { id: "tab1" });
});

test("run-background starts a detached core terminal with the person's shell", async () => {
  const api = fakeApi();
  await execute(api, { type: "run-background", command: "killall x || true", cwd: "/w", machine: null, logName: "Kill" });
  const [, ...args] = api.calls[0];
  assert.deepEqual(args.slice(0, 9), ["run", "--bg", "--json", "--no-parent", "--cwd", "/w", "--label", "launchables.background=Kill", "--"]);
  assert.equal(args.at(-1), "killall x || true");
});

test("run-in-idle-panes sends the command to each idle shell", async () => {
  const api = fakeApi();
  await execute(api, { type: "run-in-idle-panes", command: "clear" });
  assert.deepEqual(api.calls, [["hc", "send", "t7", "clear"], ["hc", "send", "t8", "clear"]]);
});

test("split-pane without a source pane fails clearly", async () => {
  await assert.rejects(execute(fakeApi(), { type: "split-pane", fromPane: null, pane: { cwd: "/" } }), /no focused pane/);
});
