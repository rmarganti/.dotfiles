// The layout copy: polls Todoist and publishes task counts as shared("todoist") for other
// mods (the status bar) to read. `todoist.refresh` polls now.

import { div } from "gpui-kit";
import { setShared, shared, nextCommand } from "herdr";
import { readToken, all } from "./client.js";

const POLL_MS = 5 * 60 * 1000;

export default class Sync {
  init(cx) {
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
        const [total, today, overdue] = await Promise.all([
          all(token, "tasks"),
          all(token, "tasks/filter", { query: "today" }),
          all(token, "tasks/filter", { query: "overdue" }),
        ]);
        setShared("todoist", { total: total.length, today: today.length, overdue: overdue.length, updated: Date.now(), loading: false, error: null });
      } catch (e) {
        // Keep the last good counts; the status bar marks them as stale.
        setShared("todoist", { ...previous, loading: false, error: String(e?.message ?? e) });
      } finally {
        this.busy = false;
        cx.notify();
      }
    });
  }

  // Draws nothing; it only needs a block in the layout so it runs and gets commands.
  render() {
    return div();
  }
}
