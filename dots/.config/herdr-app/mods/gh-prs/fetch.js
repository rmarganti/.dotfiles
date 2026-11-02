// One background fetch's life, as a reducer:
//
//   idle ─request─▶ loading ─resolve─▶ ok
//                      │    ─reject──▶ error
//                      └────expire───▶ error ("timed out")
//
// Every fetch carries an id, and only the current one's result counts. A fetch
// that never settles (its promise lost, its task cancelled) can't wedge the
// panel: past DEADLINE it expires, and the next request starts afresh.
// No herdr imports, so `node fetch.test.js` can check it.

export const DEADLINE = 30000;
export const IDLE = Object.freeze({ status: "idle" });

const stale = (state, at) => state.status === "loading" && at - state.startedAt >= DEADLINE;

export function reduce(state, event) {
  switch (event.type) {
    // A request while one runs queues one more run, unless forced or the
    // running one is past its deadline: then this one replaces it.
    case "request":
      if (state.status === "loading" && !event.force && !stale(state, event.at)) {
        return state.queued ? state : { ...state, queued: true };
      }
      return { status: "loading", id: event.id, startedAt: event.at, queued: false };
    case "resolve":
      if (state.status !== "loading" || state.id !== event.id) return state;
      return { status: "ok", at: event.at };
    case "reject":
      if (state.status !== "loading" || state.id !== event.id) return state;
      return { status: "error", message: event.message, at: event.at };
    case "expire":
      if (!stale(state, event.at)) return state;
      return { status: "error", message: "Sync timed out", at: event.at };
    default:
      return state;
  }
}

const messageOf = (e) => String(e?.message ?? e);

/**
 * Runs one kind of fetch through reduce(). `work(live, cx)` does the fetching and
 * stores what it gets only while `live()` is true; its throw is the failure.
 * `onError(message)` hears failures and timeouts, for state kept elsewhere.
 */
export class Fetch {
  constructor({ onError } = {}) {
    this.state = IDLE;
    this.seq = 0;
    this.onError = onError;
  }

  get loading() { return this.state.status === "loading"; }
  get error() { return this.state.status === "error" ? this.state.message : null; }

  dispatch(event) {
    const prev = this.state;
    this.state = reduce(prev, event);
    if (this.state !== prev && this.state.status === "error") this.onError?.(this.state.message);
    return prev;
  }

  run(cx, work, { force = false } = {}) {
    const id = ++this.seq;
    this.dispatch({ type: "request", id, at: Date.now(), force });
    if (this.state.id !== id) return;
    const live = () => this.state.status === "loading" && this.state.id === id;
    cx.spawn(async (cx) => {
      let event;
      try {
        await work(live, cx);
        event = { type: "resolve", id, at: Date.now() };
      } catch (e) {
        event = { type: "reject", id, message: messageOf(e), at: Date.now() };
      }
      const prev = this.dispatch(event);
      cx.notify();
      if (prev.status === "loading" && prev.id === id && prev.queued) this.run(cx, work);
    });
  }

  // True when a stuck fetch just timed out, so the caller re-renders.
  expire(at = Date.now()) {
    return this.dispatch({ type: "expire", at }) !== this.state;
  }
}
