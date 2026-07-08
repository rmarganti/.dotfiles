#!/usr/bin/env node
// Vendored from https://github.com/markhuot/herdr-equalize-splits/blob/80aabe0cee79a870b81029d389feeaccc03fb58d/equalize.mjs
// Equalize every split in the current herdr tab so each pane gets an equal
// share within its row/column (tmux `select-layout` even, scoped to herdr).
//
// How it works
// ------------
// herdr models a tab as a binary BSP tree: each `split` node has a `direction`
// ("right" = side-by-side columns, "down" = stacked rows), a `ratio` (the share
// given to its `first` child), and two children that are either panes or nested
// splits. There is no "three-way" container — three columns are really
// `p1 | (p2 | p3)`.
//
// Each divider should split its space evenly among the columns (or rows) it
// separates. We weight each side by its number of same-axis "slots": a pane is
// one slot, nested same-axis splits flatten into the group, and a cross-axis
// subtree counts as a single slot. ratio = slots(first) / slots(first+second):
//
//   p1 | (p2 | p3)   ->  root = 1/3, inner = 1/2   ->  33% | 33% | 33% columns
//   p1 / p2          ->  root = 1/2                 ->  50% top / 50% bottom
//   p1 | (p2 / p3)   ->  root = 1/2 (two columns), inner = 1/2 (two rows)
//                        ->  50/50 left-right, right column 50/50 up-down
//
// We read the tree with `layout.export`, compute a target ratio + boundary pane
// for every split, then move each existing divider with `pane.resize`. Do not use
// `layout.apply` here: in current Herdr it can recreate panes instead of only
// moving dividers.
//
// Environment (provided by herdr when it runs a plugin action):
//   HERDR_SOCKET_PATH  unix socket for the running server (required)
//   HERDR_PANE_ID      the focused pane; scopes us to its tab
//   HERDR_TAB_ID       fallback scope if no pane id is present
//
// Flags:
//   --dry-run   print the planned ratios without changing anything

import net from "node:net";

const SOCKET = process.env.HERDR_SOCKET_PATH;
const PANE_ID = process.env.HERDR_PANE_ID || null;
const TAB_ID = process.env.HERDR_TAB_ID || null;
const DRY_RUN = process.argv.includes("--dry-run");

function fail(message) {
  process.stderr.write(`equalize: ${message}\n`);
  process.exit(1);
}

if (!SOCKET) {
  fail("HERDR_SOCKET_PATH is not set — run this inside a herdr session.");
}

// One request per connection: the server answers with a single newline-framed
// JSON object and then closes, so we open a fresh socket for each call.
let seq = 0;
function call(method, params) {
  return new Promise((resolve, reject) => {
    const id = `equalize-${++seq}`;
    const conn = net.connect(SOCKET, () => {
      conn.write(JSON.stringify({ id, method, params }) + "\n");
    });
    let buf = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      conn.destroy();
      reject(new Error(`timed out calling ${method}`));
    }, 5000);
    conn.on("data", (chunk) => {
      buf += chunk;
      const nl = buf.indexOf("\n");
      if (nl < 0 || settled) return;
      settled = true;
      clearTimeout(timer);
      conn.end();
      let msg;
      try {
        msg = JSON.parse(buf.slice(0, nl));
      } catch {
        return reject(new Error(`bad response for ${method}: ${buf.slice(0, 160)}`));
      }
      if (msg.error) {
        return reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      }
      resolve(msg.result);
    });
    conn.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Scope every call to the focused pane's tab (or an explicit tab id).
function scope() {
  if (PANE_ID) return { pane_id: PANE_ID };
  if (TAB_ID) return { tab_id: TAB_ID };
  return {};
}

// How many slots a node occupies along a given axis. A pane is one slot. A
// split on the SAME axis contributes all of its slots, so three nested columns
// read as one 3-column group. A split on the OTHER axis is a single unit — a
// column that happens to contain stacked rows is still just one column.
function axisSpan(node, axis) {
  if (node.type === "pane") return 1;
  if (node.direction === axis) {
    return axisSpan(node.first, axis) + axisSpan(node.second, axis);
  }
  return 1;
}

function opposite(direction) {
  return direction === "right" ? "left" : "up";
}

// Pick a pane on the far edge of a subtree in `direction`. Resizing this pane in
// that direction moves the divider bordering the subtree, preserving processes.
function edgePane(node, direction) {
  if (node.type === "pane") return node.pane_id;
  if (node.direction === direction) return edgePane(node.second, direction);
  if (opposite(node.direction) === direction) return edgePane(node.first, direction);
  return edgePane(node.first, direction);
}

// Walk the tree, recording a target ratio + boundary pane for every split. Each
// divider splits its space evenly among the columns (or rows) it separates,
// weighting each side by how many same-axis slots it holds. Path is read from
// the root: false descends into `first`, true into `second`.
function collectTargets(node, path, out) {
  if (node.type !== "split") return;
  const first = axisSpan(node.first, node.direction);
  const second = axisSpan(node.second, node.direction);
  const ratio = first / (first + second);
  out.push({
    path: [...path],
    ratio,
    current: node.ratio,
    first,
    second,
    pane_id: edgePane(node.first, node.direction),
    grow_direction: node.direction,
    shrink_direction: opposite(node.direction),
  });
  collectTargets(node.first, [...path, false], out);
  collectTargets(node.second, [...path, true], out);
}

async function main() {
  const exported = await call("layout.export", scope());
  const root = exported?.layout?.root;
  if (!root) fail("could not read the current tab layout.");

  if (root.type !== "split") {
    process.stdout.write("equalize: only one pane in this tab — nothing to do.\n");
    return;
  }

  const targets = [];
  collectTargets(root, [], targets);

  if (DRY_RUN) {
    process.stdout.write(`equalize: ${targets.length} split(s) (dry run)\n`);
    for (const t of targets) {
      const where = t.path.length ? t.path.map((b) => (b ? "second" : "first")).join(">") : "root";
      process.stdout.write(
        `  ${where}: ${t.first}:${t.second} slots -> ratio ${t.ratio.toFixed(4)}\n`
      );
    }
    return;
  }

  try {
    await Promise.all(
      targets.map((t) => call("layout.set_split_ratio", { ...scope(), path: t.path, ratio: t.ratio }))
    );
  } catch (err) {
    if (!String(err.message).includes("layout.set_split_ratio")) throw err;
    for (const t of targets) {
      const delta = t.ratio - t.current;
      if (Math.abs(delta) < 0.001) continue;
      await call("pane.resize", {
        pane_id: t.pane_id,
        direction: delta > 0 ? t.grow_direction : t.shrink_direction,
        amount: Math.abs(delta),
      });
    }
  }
  process.stdout.write(`equalize: balanced ${targets.length} split(s).\n`);
}

main().catch((err) => fail(err.message));
