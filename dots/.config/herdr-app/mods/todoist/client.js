// A small Todoist API v1 client: the token from the Keychain, paginated reads, and the few
// writes the task list needs.
//
// The API token lives in the macOS Keychain:
//   security add-generic-password -a "$USER" -s todoist-api-token -w

import { exec } from "herdr";

const API = "https://api.todoist.com/api/v1";
const KEYCHAIN_SERVICE = "todoist-api-token";
const PAGE_LIMIT = 200;

export const TOKEN_HELP = `security add-generic-password -a "$USER" -s ${KEYCHAIN_SERVICE} -w`;

export async function readToken() {
  const r = await exec("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"]).catch(() => null);
  if (r?.code !== 0) throw new Error("no token in Keychain");
  return r.stdout.trim();
}

async function request(token, method, path, { params = {}, body } = {}) {
  const q = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}/${path}${q ? `?${q}` : ""}`, { method, headers, body: body && JSON.stringify(body) });
  if (!res.ok) throw new Error(res.status === 401 ? "invalid token" : `HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// Every item on every page of a cursor-paginated endpoint.
export async function all(token, path, params = {}) {
  const items = [];
  let cursor = null;
  do {
    const data = await request(token, "GET", path, { params: { ...params, limit: PAGE_LIMIT, ...(cursor ? { cursor } : {}) } });
    items.push(...data.results);
    cursor = data.next_cursor;
  } while (cursor);
  return items;
}

// Parses Todoist's quick add syntax: "Pay rent tomorrow p1 #Home".
export function quickAdd(token, text) {
  return request(token, "POST", "tasks/quick", { body: { text, meta: true } });
}

export function closeTask(token, id) {
  return request(token, "POST", `tasks/${id}/close`);
}

export function taskUrl(id) {
  return `https://app.todoist.com/app/task/${id}`;
}
