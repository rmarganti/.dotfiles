// POSIX path helpers. Mods have no `node:path`, and launch folders may live on
// another machine, so these never touch the filesystem.

export function isAbsolute(p) {
  return p.startsWith("/");
}

export function normalize(p) {
  if (!p) return ".";
  const absolute = isAbsolute(p);
  const out = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (out.length && out[out.length - 1] !== "..") out.pop();
      else if (!absolute) out.push("..");
      continue;
    }
    out.push(part);
  }
  const joined = out.join("/");
  return absolute ? `/${joined}` : joined || ".";
}

export function join(...parts) {
  return normalize(parts.filter(Boolean).join("/"));
}

/** Resolves `p` against `base`; an absolute `p` wins. */
export function resolve(base, p) {
  if (!p) return normalize(base);
  return isAbsolute(p) ? normalize(p) : join(base, p);
}

export function dirname(p) {
  const n = normalize(p);
  if (n === "/") return "/";
  const i = n.lastIndexOf("/");
  if (i < 0) return ".";
  return i === 0 ? "/" : n.slice(0, i);
}

export function basename(p) {
  const n = normalize(p);
  if (n === "/") return "";
  return n.slice(n.lastIndexOf("/") + 1);
}

/** `/Users/me/code` → `~/code` for display. */
export function shortenHome(p, home) {
  if (!home) return p;
  if (p === home) return "~";
  return p.startsWith(`${home}/`) ? `~${p.slice(home.length)}` : p;
}
