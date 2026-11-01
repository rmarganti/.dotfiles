// Herdr draws images only from real folders, and this mod's folder is a
// symlink into dotfiles: icons and avatars go to its data folder instead.

import * as fs from "fs/promises";
import { appHome, exec } from "herdr";

const SVG = (paths) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
  pull: SVG(`<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/>`),
  draft: SVG(`<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><line x1="6" x2="6" y1="9" y2="21"/>`),
  merged: SVG(`<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>`),
  closed: SVG(`<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>`),
  refresh: SVG(`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>`),
  check: SVG(`<path d="M20 6 9 17l-5-5"/>`),
  x: SVG(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),
  branch: SVG(`<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`),
  copy: SVG(`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`),
  external: SVG(`<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`),
  back: SVG(`<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`),
  commit: SVG(`<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>`),
  tag: SVG(`<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>`),
  eye: SVG(`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`),
  link: SVG(`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`),
  pencil: SVG(`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`),
  file: SVG(`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>`),
  terminal: SVG(`<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>`),
  issue: SVG(`<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>`),
  alert: SVG(`<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`),
};

let written = null;

/**
 * Resolves once the icons are on disk; draw them only after that.
 */
export function icons() {
  written ??= (async () => {
    const dir = `${appHome()}/data/gh-prs/icons`;
    await fs.mkdir(dir, { recursive: true });
    for (const [name, svg] of Object.entries(ICONS)) await fs.writeFile(`${dir}/${name}.svg`, svg);
  })();
  return written;
}

export const icon = (name) => `data/gh-prs/icons/${name}.svg`;

const avatars = {};
const avatarFile = (login) => `data/gh-prs/avatars/${login.replace(/[^\w-]/g, "_")}.png`;

/**
 * The picture to draw, or null while there's none (yet).
 */
export const avatarPath = (login) => (avatars[login] === "ready" ? avatarFile(login) : null);

/**
 * Starts the download the first time a login is asked for. Resolves true once
 * its picture is ready; null when already known. Bots get none.
 */
export function loadAvatar(login, url) {
  if (!login || avatars[login] !== undefined) return null;
  if (!url && /^app\/|\[bot\]$/.test(login)) { avatars[login] = "missing"; return null; }
  avatars[login] = "loading";
  return (async () => {
    const path = `${appHome()}/${avatarFile(login)}`;
    if (!(await fs.exists(path))) {
      await fs.mkdir(`${appHome()}/data/gh-prs/avatars`, { recursive: true });
      const r = await exec("curl", ["-sfL", "--max-time", "10", "-o", path, url ?? `https://github.com/${login}.png?size=80`]).catch(() => null);
      if (r?.code !== 0) { avatars[login] = "missing"; return false; }
    }
    avatars[login] = "ready";
    return true;
  })();
}
