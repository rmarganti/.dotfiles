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
export function loadAvatar(login) {
  if (!login || avatars[login] !== undefined) return null;
  if (/^app\/|\[bot\]$/.test(login)) { avatars[login] = "missing"; return null; }
  avatars[login] = "loading";
  return (async () => {
    const path = `${appHome()}/${avatarFile(login)}`;
    if (!(await fs.exists(path))) {
      await fs.mkdir(`${appHome()}/data/gh-prs/avatars`, { recursive: true });
      const r = await exec("curl", ["-sfL", "--max-time", "10", "-o", path, `https://github.com/${login}.png?size=80`]).catch(() => null);
      if (r?.code !== 0) { avatars[login] = "missing"; return false; }
    }
    avatars[login] = "ready";
    return true;
  })();
}
