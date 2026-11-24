import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { jumpToLink } from "./jump.js";

const link = { kind: "file", raw: "src/o'hare.js:12:4", path: "/repo/src/o'hare.js" };
const source = { machine: null, tab: "tab1", pane: "agent" };

function fake({ other = false, code = 0, stdout = "1\n", stderr = "", error } = {}) {
  const calls = [];
  return {
    calls,
    terminals: () => ["t1", "t2"].map((address) => ({ address, foreground: { name: "nvim" } })),
    panes: () => [{ pane: "editor", tab: "tab1", terminal: "t1" }, { pane: "second", tab: other ? "tab1" : "tab2", terminal: "t2" }],
    exec: async (...args) => {
      calls.push(args);
      if (error) throw error;
      return { code, stdout, stderr };
    },
    run: (...args) => calls.push(args),
  };
}

test("the manifest matches Herdr's resolved spelling without the diagnostic suffix", () => {
  const manifest = JSON.parse(readFileSync(new URL("./mod.json", import.meta.url), "utf8"));
  const rule = manifest.link_handlers.find((rule) => rule.kind === "file");
  assert.match("src/jump.js", new RegExp(rule.pattern));
});

test("jumps in the same tab with the resolved path and numeric coordinates", async () => {
  const api = fake();
  assert.equal(await jumpToLink({ link, source }, api), "handled");
  assert.equal(api.calls[0][1][3], "t1");
  assert.match(api.calls[0][1][4], /vim\.schedule\(function\(\) follow/);
  assert.match(api.calls[0][1][4], /\['\/repo\/src\/o''hare\.js', 12, 4\]/);
  assert.deepEqual(api.calls[1], ["pane.focus", { pane: "editor" }]);
});

test("prefers the clicked editor, but never guesses between two siblings", async () => {
  const api = fake({ other: true });
  assert.equal(await jumpToLink({ link, source }, api), "pass");
  assert.equal(api.calls.length, 0);
  assert.equal(await jumpToLink({ link, source: { ...source, pane: "second" } }, api), "handled");
  assert.deepEqual(api.calls[1], ["pane.focus", { pane: "second" }]);
});

test("leaves URLs, remote links, missing files and literal filenames to Herdr", async () => {
  const api = fake();
  for (const click of [
    { link: { kind: "url", raw: "https://example.org:443" }, source },
    { link, source: { ...source, machine: "remote" } },
    { link: { ...link, path: null }, source },
    { link: { ...link, path: "/repo/" + link.raw }, source },
  ]) assert.equal(await jumpToLink(click, api), "pass");
  assert.equal(api.calls.length, 0);
});

test("allows external opening only on a definite miss", async () => {
  for (const reply of [
    { stdout: "0" },
    { code: 2, stdout: "", stderr: "E247: Failed to connect to socket" },
  ]) {
    const api = fake(reply);
    assert.equal(await jumpToLink({ link, source }, api), "pass");
    assert.equal(api.calls.length, 1);
  }
});

test("reports an ambiguous RPC failure instead of opening the file externally", async () => {
  for (const reply of [
    { error: new Error("RPC timed out") },
    { code: 2, stdout: "", stderr: "Remote expression failed" },
    { stdout: "" },
  ]) {
    const api = fake(reply);
    await assert.rejects(jumpToLink({ link, source }, api), /timed out|did not acknowledge/);
    assert.equal(api.calls.length, 1);
  }
});
