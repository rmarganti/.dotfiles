import * as fs from "fs/promises";
import { appHome, exec } from "herdr";

// The markdown view draws no images, so the screenshots in pull requests are cut out
// of the text and drawn between its runs, from a copy in the data folder.
const IMAGE = /(```[\s\S]*?```)|\[?!\[([^\]]*)\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)(?:\]\([^)]*\))?|<img\b([^>]*)>/g;

// The body as markdown runs and the images between them; code is left alone.
export function blocks(markdown) {
  // Cutting an image out of a table row breaks the table: there, the alt text stands in.
  markdown = markdown.split("\n").map((line) => /^\s*\|/.test(line)
    ? line.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<img\b[^>]*?\balt=["']([^"']*)["'][^>]*>/g, "$1").replace(/<img\b[^>]*>/g, "")
    : line).join("\n");
  const out = [];
  let last = 0, m;
  IMAGE.lastIndex = 0;
  while ((m = IMAGE.exec(markdown))) {
    if (m[1]) continue;
    const attrs = m[4] ?? "", src = m[3] ?? /\bsrc=["']([^"']+)["']/.exec(attrs)?.[1];
    if (!src || !/^https?:\/\//.test(src)) continue;
    out.push({ text: markdown.slice(last, m.index) });
    out.push({ image: src, alt: m[2] ?? /\balt=["']([^"']*)["']/.exec(attrs)?.[1] ?? "", width: Number(/\bwidth=["']?(\d+)/.exec(attrs)?.[1]) || null });
    last = m.index + m[0].length;
  }
  out.push({ text: markdown.slice(last) });
  return out.filter((b) => b.image || b.text.trim());
}

// Width and height from the file's own header.
function dimensions(b) {
  const u16 = (i) => (b[i] << 8) | b[i + 1], u32 = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return { width: u32(16), height: u32(20) };
  if (ascii(0, 4) === "GIF8") return { width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff || b[i + 1] === 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: u16(i + 7), height: u16(i + 5) };
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    const kind = ascii(12, 16);
    if (kind === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (kind === "VP8 ") return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
    if (kind === "VP8L") {
      const bits = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0;
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
  }
  const text = ascii(0, Math.min(b.length, 2000));
  if (/<svg\b/.test(text)) {
    const w = /<svg[^>]*\bwidth="([\d.]+)/.exec(text)?.[1], h = /<svg[^>]*\bheight="([\d.]+)/.exec(text)?.[1];
    if (w && h) return { width: Math.round(+w), height: Math.round(+h) };
  }
  return null;
}

const pictures = {};
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 2166136261).toString(16);

// { path (for image()), file, width, height } once downloaded; null before.
export const picture = (url) => typeof pictures[url] === "object" ? pictures[url] : null;
export const failed = (url) => pictures[url] === "missing";

// Starts the download the first time a URL is asked for: a promise that
// resolves once it's ready or failed.
export function loadPicture(url) {
  if (pictures[url] !== undefined) return null;
  pictures[url] = "loading";
  return (async () => {
    const path = `data/gh-prs/images/${hash(url)}.png`, file = `${appHome()}/${path}`;
    try {
      if (!await fs.exists(file)) {
        await fs.mkdir(`${appHome()}/data/gh-prs/images`, { recursive: true });
        // Attachments of private repositories need the gh token. It goes only to
        // github.com, through stdin so it's never on a command line, and curl
        // drops it when GitHub redirects to its storage host.
        const r = await exec("sh", ["-c", /^https:\/\/github\.com\//.test(url)
          ? 'gh auth token | sed "s/^/Authorization: token /" | curl -sfL --max-time 30 -H @- -o "$1" "$2" || { rm -f "$1"; exit 1; }'
          : 'curl -sfL --max-time 30 -o "$1" "$2" || { rm -f "$1"; exit 1; }', "sh", file, url]);
        if (r.code !== 0) throw new Error("download failed");
      }
      const size = dimensions(await fs.readFile(file));
      if (!size?.width || !size?.height) throw new Error("not an image");
      pictures[url] = { path, file, ...size };
    } catch { pictures[url] = "missing"; }
  })();
}
