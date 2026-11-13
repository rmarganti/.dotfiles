// node --test main.test.js — no GitHub requests or workflow mutations.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";

const env = globalThis.__ci = {};
const mocks = {
  "gpui-kit": `
    export class View {}
    export function div() {
      let p; p = new Proxy({}, {get(_, key) {
        if (key === 'when') return (yes, fn) => { if (yes) fn(p); return p; };
        return () => p;
      }}); return p;
    }
    export const svg = div;
  `,
  "gpui-base": `
    import { div } from 'gpui-kit';
    export const v_flex = div, h_flex = div;
    export const Input = {new: div};
    export const InputState = {new() { let value = ''; return {
      value: () => value, set_value: v => {value = v;}, on() {}
    }; }};
  `,
  herdr: `
    export const exec = (...a) => globalThis.__ci.exec(...a);
    export const focused = () => globalThis.__ci.focus;
    export const spaces = () => globalThis.__ci.spaces;
    export const panes = () => globalThis.__ci.panes;
    export const layout = () => globalThis.__ci.layout;
    export const notify = a => globalThis.__ci.notifications.push(a);
    export const props = () => ({});
    export const theme = () => new Proxy({}, {get: () => '#123456'});
    export const settings = () => ({});
    export const run = (...a) => globalThis.__ci.commands.push(a);
    export const shared = k => globalThis.__ci.shared[k];
    export const setShared = (k,v) => {globalThis.__ci.shared[k] = v;};
  `,
};
registerHooks({resolve(specifier, context, next) {
  return specifier in mocks
    ? {url: `data:text/javascript,${encodeURIComponent(mocks[specifier])}`, shortCircuit: true}
    : next(specifier, context);
}});
const { default: CiDash } = await import("./main.js");
const { Gh, resolveRepo, dispatchArgs } = await import("./gh.js");
const { parseWorkflowInputs } = await import("./workflow-inputs.js");

beforeEach(() => {
  Object.assign(env, {
    focus: {space: "s", tab: "t", pane: "p"},
    spaces: [{id: "s", active: true, machine: null, folder: "/repo", tabs: [{id: "t"}]}],
    panes: [{pane: "p", tab: "t", cwd: "/repo", branch: "main"}],
    layout: {id: "panel", hidden: false, children: [{id: "panel-body", active: "ci-dash"}]},
    notifications: [], commands: [], shared: {},
    exec: async () => { throw new Error("Unexpected external command"); },
  });
});
function context() {
  const tasks = [];
  const cx = {notify() {}, timer: {every() {}}, spawn(fn) {tasks.push(Promise.resolve().then(() => fn(cx)));}};
  return {cx, async drain() {while (tasks.length) await Promise.all(tasks.splice(0));}};
}
function setup(props = {}) {
  const task = context(), app = new CiDash();
  app.init(props, task.cx);
  app.repo = {host: "github.com", owner: "o", name: "r", slug: "o/r", login: "alice", defaultBranch: "main"};
  app.gh = {listRuns: async () => []};
  return {app, ...task};
}
const run = (status = "in_progress", attempt = 1) => ({id: 1, run_number: 2, status, conclusion: status === "completed" ? "success" : null, run_attempt: attempt});
const defer = () => {let resolve; const promise = new Promise(r => {resolve = r;}); return {promise, resolve};};

test("detail polling keeps advancing through both backoff stages", async () => {
  const {app, cx, drain} = setup();
  let requests = 0;
  app.gh.getRun = async () => {requests++; return run();};
  app.gh.listJobs = async () => [];
  app.runs = [run()];
  app.openRun(1, cx); await drain();
  for (let i = 0; i < 120; i++) {app.tick(cx); await drain();}
  assert.equal(app.detail.tick, 120);
  assert.equal(requests, 1 + 12 + 24 + 10);
});

test("failed detail requests do not stall scheduling", async () => {
  const {app, cx, drain} = setup();
  let requests = 0;
  app.gh.getRun = async () => {requests++; throw new Error("offline");};
  app.gh.listJobs = async () => [];
  app.openRun(1, cx); await drain();
  for (let i = 0; i < 70; i++) {app.tick(cx); await drain();}
  assert.equal(app.detail.tick, 70);
  assert.ok(requests > 13);
  assert.match(app.detail.error.message, /offline/);
});

test("idle and empty lists discover new runs every 30 seconds", async () => {
  const {app, cx, drain} = setup();
  let requests = 0;
  app.gh.listRuns = async () => {requests++; return [run()];};
  app.lastRunsFetch = Date.now() - 30001;
  app.tick(cx); await drain();
  assert.equal(requests, 1);
  assert.equal(app.runs[0].status, "in_progress");
  app.runs = [run("completed")]; app.lastRunsFetch = Date.now();
  app.tick(cx); await drain();
  assert.equal(requests, 1);
});

test("hidden sidebar instances perform no polling", async () => {
  const {app, cx, drain} = setup({panel: true});
  env.layout.hidden = true;
  app.gh.listRuns = async () => assert.fail("hidden panel polled");
  app.tick(cx); await drain();
});

test("one in-flight detail request at a time", async () => {
  const {app, cx, drain} = setup();
  const pending = defer(); let requests = 0;
  app.gh.getRun = async () => {requests++; return pending.promise;};
  app.gh.listJobs = async () => [];
  app.openRun(1, cx); app.pollDetail(cx);
  pending.resolve(run()); await drain();
  assert.equal(requests, 1);
});

test("completion notifications are deduplicated per run attempt", () => {
  const {app} = setup();
  app.announce(run("completed")); app.announce(run("completed"));
  app.announce(run("completed", 2));
  assert.equal(env.notifications.length, 2);
});

test("Cancel and Rerun require confirmation and reject double submissions", async () => {
  for (const label of ["Cancel", "Rerun"]) {
    const {app, cx, drain} = setup(); let writes = 0;
    app.detail = {id: 1, run: run("completed")};
    app.gh.cancelRun = app.gh.rerunRun = async () => {writes++;};
    app.pollDetail = () => {}; app.loadRuns = () => {};
    app.requestAction(label, cx);
    assert.equal(writes, 0);
    app.confirmAction(cx); app.confirmAction(cx); await drain();
    assert.equal(writes, 1);
    assert.equal(app.actionBusy, false);
    if (label === "Rerun") assert.equal(app.detail.run.status, "queued");
  }
});

test("a confirmation cannot act on a different repository", async () => {
  const {app, cx, drain} = setup();
  app.detail = {id: 1}; app.requestAction("Cancel", cx);
  app.gh = {cancelRun: () => assert.fail("wrong repository")};
  app.confirmAction(cx); await drain();
});

test("stale repository resolution cannot replace a newer context", async () => {
  const {app, cx, drain} = setup(); const pending = defer();
  env.exec = async (_cmd, args) => {
    if (args[0] === "repo") return pending.promise;
    return {code: 0, stdout: '{"login":"alice"}'};
  };
  app.ensureContext(cx);
  assert.equal(app.gh, null);
  const oldContext = app.context;
  app.context = {}; app.repo = {slug: "new/repo"};
  pending.resolve({code: 0, stdout: '{"nameWithOwner":"o/r","url":"https://github.com/o/r"}'});
  await drain();
  assert.notEqual(app.context, oldContext);
  assert.equal(app.repo.slug, "new/repo");
});

test("input states survive repository resets", () => {
  const {app} = setup();
  const filter = app.dsp.filter, version = app.dsp.version;
  app.reset();
  assert.equal(app.dsp.filter, filter);
  assert.equal(app.dsp.version, version + 1);
});

test("Dispatch needs an explicit final click and only submits once", async () => {
  const {app, cx, drain} = setup(); const d = app.dsp; let writes = 0;
  d.workflow = {id: 5}; d.ref = "main"; d.login = "alice";
  app.gh.listDispatchRuns = async () => [];
  app.gh.dispatch = async () => {writes++; return {runId: 3};};
  app.openRun = id => {assert.equal(id, 3);}; app.loadRuns = () => {};
  d.review(cx); await drain(); assert.equal(writes, 0);
  d.dispatch(cx); d.dispatch(cx); await drain(); assert.equal(writes, 1);
});

test("switching repositories before dispatch preflight finishes prevents the write", async () => {
  const {app, cx, drain} = setup(); const pending = defer(), d = app.dsp;
  d.workflow = {id: 5}; d.ref = "main";
  app.gh.listDispatchRuns = () => pending.promise;
  app.gh.dispatch = () => assert.fail("stale dispatch");
  d.dispatch(cx); app.reset(); pending.resolve([]); await drain();
});

test("stale dispatch results cannot open a run in a new repository", async () => {
  const {app, cx, drain} = setup(), d = app.dsp; const pending = defer();
  d.workflow = {id: 5}; d.ref = "main";
  app.gh.listDispatchRuns = async () => [];
  app.gh.dispatch = () => pending.promise;
  app.openRun = () => assert.fail("stale run opened");
  d.dispatch(cx);
  await new Promise(r => setImmediate(r));
  app.reset(); pending.resolve({runId: 3}); await drain();
});

test("run lookup gives up after repeated transient errors, without redispatching", async () => {
  const {app, cx, drain} = setup(), d = app.dsp;
  d.locate = {workflowId: 1, attempts: 17, inFlight: false};
  app.gh.listDispatchRuns = async () => {throw new Error("offline");};
  d.tryLocate(cx); await drain();
  assert.equal(d.locate, null);
  assert.match(d.notice, /not dispatched again/);
});

test("dispatch fields stay strings and shell metacharacters remain argv data", () => {
  const args = dispatchArgs({host: "github.com", owner: "o", name: "r"}, 5, "feature/branch", {flag: "true", n: "12", text: '$(touch /tmp/no); "hi"'});
  assert.ok(args.includes("inputs[flag]=true"));
  assert.ok(args.includes("inputs[n]=12"));
  assert.ok(args.includes('inputs[text]=$(touch /tmp/no); "hi"'));
  assert.deepEqual(args.slice(-2), ["-F", "return_run_details=true"]);
});

test("workflow YAML parses typed inputs without treating on as a boolean", () => {
  const parsed = parseWorkflowInputs(`name: CI\non:\n  workflow_dispatch:\n    inputs:\n      enabled:\n        type: boolean\n        default: true\n      target:\n        type: choice\n        options: [staging, production]\n`);
  assert.equal(parsed.dispatchable, true);
  assert.equal(parsed.inputs[0].default, "true");
  assert.equal(parsed.inputs[1].default, "staging");
  assert.throws(() => parseWorkflowInputs("on: [broken"), /Could not parse/);
});

test("API requests use explicit hostname and separate argv", async () => {
  const calls = []; env.exec = async (...args) => {calls.push(args); return {code: 0, stdout: '{"workflow_runs":[]}'};};
  const gh = new Gh({repo: {host: "github.example.com", owner: "o", name: "r"}, cwd: "/repo", on: "remote"});
  await gh.listRuns();
  assert.deepEqual(calls[0][1].slice(0, 3), ["api", "--hostname", "github.example.com"]);
  assert.deepEqual(calls[0][2], {cwd: "/repo", on: "remote"});
});

test("login fallback uses a one-call token wrapper without switching accounts", async () => {
  const calls = [];
  env.exec = async (cmd, args) => {
    calls.push([cmd, args]);
    if (args[0] === "repo") return {code: 1, stderr: "HTTP 404 Not Found"};
    if (args[0] === "auth") return {code: 0, stdout: "Logged in to github.com account work\nActive account: false"};
    return {code: 0, stdout: '{"nameWithOwner":"o/r","url":"https://github.com/o/r"}'};
  };
  assert.equal((await resolveRepo({cwd: "/repo"})).account, "work");
  assert.equal(calls[2][0], "sh");
  assert.ok(calls[2][1][1].includes('exec gh "$@"'));
  assert.equal(calls.some(([,args]) => args.includes("switch")), false);
});

test("button instances do not create a repository client", () => {
  const {app, cx} = setup({button: true});
  assert.ok(env.shared["workspace.panels"].includes("ci-dash"));
  app.render(cx);
});

test("renders list, detail, confirmation, and every Dispatch state", () => {
  const {app, cx} = setup(); app.ensureContext = () => {};
  app.runs = [run()]; app.runsLoaded = true; app.render(cx);
  app.detail = {id: 1, run: run(), jobs: []}; app.render(cx);
  app.confirm = {label: "Cancel"}; app.render(cx);
  app.tab = "dispatch"; app.dsp.loaded = true;
  app.dsp.workflow = {id: 2, name: "CI", path: ".github/workflows/ci.yml"};
  app.dsp.ref = "main";
  for (const step of ["workflows", "refs", "inputs", "confirm", "notice"]) {
    app.dsp.step = step; app.render(cx);
  }
});

test("artifact API and filesystem commands are absent", () => {
  for (const file of ["main.js", "gh.js", "dispatch.js"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /artifact|downloadArtifact|rev-parse|xdg-open|explorer\.exe/i);
  }
});
