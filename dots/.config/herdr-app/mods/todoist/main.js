// Todoist sync: polls the Todoist API and publishes task counts as shared("todoist")
// for other mods (the status bar) to read. `todoist.refresh` polls now.
// Draws nothing; it only needs a block in the layout so it runs and gets commands.
//
// The API token lives in the macOS Keychain:
//   security add-generic-password -a "$USER" -s todoist-api-token -w

import { View, div } from "gpui-kit";
import { exec, setShared, shared, nextCommand } from "herdr";

const API = "https://api.todoist.com/api/v1";
const KEYCHAIN_SERVICE = "todoist-api-token";
const POLL_MS = 5 * 60 * 1000;
const PAGE_LIMIT = 200;

async function readToken() {
  const r = await exec("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"]).catch(() => null);
  return r?.code === 0 ? r.stdout.trim() : null;
}

// Counts every task on every page of a cursor-paginated endpoint.
async function count(token, path, params = {}) {
  let total = 0;
  let cursor = null;
  do {
    const q = Object.entries({ ...params, limit: PAGE_LIMIT, ...(cursor ? { cursor } : {}) })
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    const res = await fetch(`${API}/${path}?${q}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(res.status === 401 ? "invalid token" : `HTTP ${res.status}`);
    const data = await res.json();
    total += data.results.length;
    cursor = data.next_cursor;
  } while (cursor);
  return total;
}

export default class Todoist extends View {
  init(_props, cx) {
    cx.timer.every(POLL_MS, (cx) => this.refresh(cx));
    this.refresh(cx);
    cx.spawn(async (cx) => {
      for (;;) {
        const command = await nextCommand();
        if (command === "refresh") this.refresh(cx);
        // Using cx lets a hot reload end this loop.
        cx.notify();
      }
    });
  }

  refresh(cx) {
    if (this.busy) return;
    this.busy = true;
    const previous = shared("todoist") ?? {};
    setShared("todoist", { ...previous, loading: true });
    cx.spawn(async (cx) => {
      try {
        const token = await readToken();
        if (!token) throw new Error("no token in Keychain");
        const [total, today, overdue] = await Promise.all([
          count(token, "tasks"),
          count(token, "tasks/filter", { query: "today" }),
          count(token, "tasks/filter", { query: "overdue" }),
        ]);
        setShared("todoist", { total, today, overdue, updated: Date.now(), loading: false, error: null });
      } catch (e) {
        // Keep the last good counts; the status bar marks them as stale.
        setShared("todoist", { ...previous, loading: false, error: String(e?.message ?? e) });
      } finally {
        this.busy = false;
        cx.notify();
      }
    });
  }

  render() {
    return div();
  }
}
