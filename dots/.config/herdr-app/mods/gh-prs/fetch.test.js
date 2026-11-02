// node --test fetch.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { reduce, Fetch, IDLE, DEADLINE } from "./fetch.js";

const request = (id, at, force = false) => ({ type: "request", id, at, force });

test("a request from idle starts loading", () => {
  assert.deepEqual(reduce(IDLE, request(1, 0)), { status: "loading", id: 1, startedAt: 0, queued: false });
});

test("only the current fetch settles it", () => {
  const loading = reduce(IDLE, request(2, 0));
  assert.equal(reduce(loading, { type: "resolve", id: 1, at: 5 }), loading);
  assert.deepEqual(reduce(loading, { type: "resolve", id: 2, at: 5 }), { status: "ok", at: 5 });
  assert.deepEqual(reduce(loading, { type: "reject", id: 2, message: "nope", at: 5 }), { status: "error", message: "nope", at: 5 });
});

test("a request mid-fetch queues instead of starting", () => {
  const loading = reduce(IDLE, request(1, 0));
  const queued = reduce(loading, request(2, 10));
  assert.equal(queued.id, 1);
  assert.equal(queued.queued, true);
});

test("a forced request replaces the running fetch", () => {
  const loading = reduce(IDLE, request(1, 0));
  assert.equal(reduce(loading, request(2, 10, true)).id, 2);
});

test("a stuck fetch expires, and a request after the deadline replaces it", () => {
  const loading = reduce(IDLE, request(1, 0));
  assert.equal(reduce(loading, { type: "expire", at: DEADLINE - 1 }), loading);
  assert.deepEqual(reduce(loading, { type: "expire", at: DEADLINE }), { status: "error", message: "Sync timed out", at: DEADLINE });
  assert.equal(reduce(loading, request(2, DEADLINE)).id, 2);
});

// A cx whose spawn runs the task now and hands back its promise.
function fakeCx() {
  const tasks = [];
  const cx = { notify() {}, spawn(fn) { tasks.push(fn(cx)); } };
  return { cx, settled: () => Promise.all(tasks) };
}

test("Fetch: a lost fetch doesn't block the next one past the deadline", async () => {
  const { cx } = fakeCx();
  const f = new Fetch();
  f.run(cx, () => new Promise(() => {}));        // never settles
  assert.equal(f.loading, true);
  f.state = { ...f.state, startedAt: Date.now() - DEADLINE };
  let ran = false;
  f.run(cx, async () => { ran = true; });
  assert.equal(ran, true);
});

test("Fetch: expire reports a timeout through onError", () => {
  const { cx } = fakeCx();
  const errors = [];
  const f = new Fetch({ onError: (m) => errors.push(m) });
  f.run(cx, () => new Promise(() => {}));
  assert.equal(f.expire(Date.now() + DEADLINE), true);
  assert.equal(f.error, "Sync timed out");
  assert.deepEqual(errors, ["Sync timed out"]);
  assert.equal(f.expire(Date.now() + DEADLINE), false);
});

test("Fetch: a superseded fetch is no longer live", async () => {
  const { cx, settled } = fakeCx();
  const f = new Fetch();
  let release, firstLive;
  f.run(cx, (live) => new Promise((r) => { release = () => { firstLive = live(); r(); }; }));
  f.run(cx, async () => {}, { force: true });
  release();
  await settled();
  assert.equal(firstLive, false);
  assert.equal(f.state.status, "ok");
});

test("Fetch: a queued request runs once the current one finishes", async () => {
  const { cx, settled } = fakeCx();
  const f = new Fetch();
  let runs = 0, release;
  const work = () => { runs++; return runs === 1 ? new Promise((r) => { release = r; }) : Promise.resolve(); };
  f.run(cx, work);
  f.run(cx, work);
  f.run(cx, work);
  assert.equal(runs, 1);
  release();
  await settled();
  await settled();
  assert.equal(runs, 2);
});
