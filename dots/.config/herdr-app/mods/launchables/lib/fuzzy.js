// fzf-style matching: fzf's v1 algorithm and scoring (word-boundary,
// camelCase and consecutive bonuses, gap penalties) and its extended search
// syntax.
//
//   foo bar   every term must match (AND)
//   a | b     either term (OR)
//   'exact    substring          ^prefix   starts with
//   suffix$   ends with          !term     must not match (also !'x, !^x, !x$)
//
// Smart case: a term with an uppercase letter is case-sensitive.
//
// Written for Herdr's mod runtime, which is an interpreter with a per-slice
// time budget: a function call costs ~50µs there, so the hot loops are
// inline, use lookup tables, and allocate nothing per candidate. v1 (one
// forward and one backward scan, then scoring only the matched window) is
// what fzf itself uses when v2's O(n·m) matrix would cost too much.

const SCORE_MATCH = 16;
const SCORE_GAP_START = -3;
const SCORE_GAP_EXTENSION = -1;
const BONUS_BOUNDARY = SCORE_MATCH / 2;
const BONUS_NON_WORD = SCORE_MATCH / 2;
const BONUS_CAMEL_123 = BONUS_BOUNDARY + SCORE_GAP_EXTENSION;
const BONUS_CONSECUTIVE = -(SCORE_GAP_START + SCORE_GAP_EXTENSION);
const BONUS_FIRST_CHAR_MULTIPLIER = 2;
const BONUS_BOUNDARY_WHITE = BONUS_BOUNDARY + 2;
const BONUS_BOUNDARY_DELIMITER = BONUS_BOUNDARY + 1;

const WHITE = 0;
const NON_WORD = 1;
const DELIMITER = 2;
const LOWER = 3;
const UPPER = 4;
const LETTER = 5;
const NUMBER = 6;

// ASCII character classes, and the bonus for each (previous, current) class pair.
const CLASS = new Uint8Array(128).fill(NON_WORD);
for (let c = 97; c <= 122; c++) CLASS[c] = LOWER;
for (let c = 65; c <= 90; c++) CLASS[c] = UPPER;
for (let c = 48; c <= 57; c++) CLASS[c] = NUMBER;
for (const ch of " \t\n\r") CLASS[ch.charCodeAt(0)] = WHITE;
for (const ch of "/,:;|") CLASS[ch.charCodeAt(0)] = DELIMITER;

function slowClass(code) {
  const ch = String.fromCharCode(code);
  if (ch.toLowerCase() !== ch.toUpperCase()) return ch === ch.toLowerCase() ? LOWER : UPPER;
  return /\p{L}/u.test(ch) ? LETTER : NON_WORD;
}

const BONUS = new Int8Array(64);
for (let prev = 0; prev < 8; prev++) {
  for (let cur = 0; cur < 8; cur++) {
    let b = 0;
    if (cur > NON_WORD && cur !== DELIMITER && prev === WHITE) b = BONUS_BOUNDARY_WHITE;
    else if (cur > NON_WORD && cur !== DELIMITER && prev === DELIMITER) b = BONUS_BOUNDARY_DELIMITER;
    else if (cur > NON_WORD && cur !== DELIMITER && prev === NON_WORD) b = BONUS_BOUNDARY;
    else if ((prev === LOWER && cur === UPPER) || (prev !== NUMBER && cur === NUMBER)) b = BONUS_CAMEL_123;
    else if (cur === NON_WORD || cur === DELIMITER) b = BONUS_NON_WORD;
    else if (cur === WHITE) b = BONUS_BOUNDARY_WHITE;
    BONUS[prev * 8 + cur] = b;
  }
}

/**
 * fzf's calculateScore over text[start, end): `subject` is text folded as
 * the term needs. Pushes matched positions into `positions` when given.
 */
function scoreWindow(text, subject, pattern, start, end, positions) {
  let pidx = 0;
  let score = 0;
  let inGap = false;
  let consecutive = 0;
  let firstBonus = 0;
  let prevClass = WHITE;
  if (start > 0) {
    const code = text.charCodeAt(start - 1);
    prevClass = code < 128 ? CLASS[code] : slowClass(code);
  }
  const m = pattern.length;
  for (let idx = start; idx < end; idx++) {
    const code = text.charCodeAt(idx);
    const cls = code < 128 ? CLASS[code] : slowClass(code);
    if (pidx < m && subject.charCodeAt(idx) === pattern.charCodeAt(pidx)) {
      if (positions) positions.push(idx);
      score += SCORE_MATCH;
      let bonus = BONUS[prevClass * 8 + cls];
      if (consecutive === 0) {
        firstBonus = bonus;
      } else {
        if (bonus >= BONUS_BOUNDARY && bonus > firstBonus) firstBonus = bonus;
        bonus = Math.max(bonus, firstBonus, BONUS_CONSECUTIVE);
      }
      score += pidx === 0 ? bonus * BONUS_FIRST_CHAR_MULTIPLIER : bonus;
      inGap = false;
      consecutive++;
      pidx++;
    } else {
      score += inGap ? SCORE_GAP_EXTENSION : SCORE_GAP_START;
      inGap = true;
      consecutive = 0;
      firstBonus = 0;
    }
    prevClass = cls;
  }
  return score;
}

/** No match. Scores can be negative (long gaps cost more than matches earn). */
export const NO_MATCH = -Infinity;

// A term's match: its score, or NO_MATCH.
function matchTerm(term, text, lower, positions) {
  const subject = term.caseSensitive ? text : lower;
  const p = term.text;
  const m = p.length;
  const n = subject.length;
  switch (term.kind) {
    case "fuzzy": {
      if (m > n) return NO_MATCH;
      // Forward: the first place the whole pattern fits, in order.
      let pidx = 0;
      let start = -1;
      let end = -1;
      let want = p.charCodeAt(0);
      for (let idx = 0; idx < n; idx++) {
        if (subject.charCodeAt(idx) === want) {
          if (start < 0) start = idx;
          if (++pidx === m) {
            end = idx + 1;
            break;
          }
          want = p.charCodeAt(pidx);
        }
      }
      if (end < 0) return NO_MATCH;
      // Backward: the tightest window ending there.
      pidx = m - 1;
      want = p.charCodeAt(pidx);
      for (let idx = end - 1; idx >= start; idx--) {
        if (subject.charCodeAt(idx) === want) {
          if (--pidx < 0) {
            start = idx;
            break;
          }
          want = p.charCodeAt(pidx);
        }
      }
      return scoreWindow(text, subject, p, start, end, positions);
    }
    case "exact": {
      const at = subject.indexOf(p);
      return at < 0 ? NO_MATCH : scoreWindow(text, subject, p, at, at + m, positions);
    }
    case "prefix":
      return subject.startsWith(p) ? scoreWindow(text, subject, p, 0, m, positions) : NO_MATCH;
    case "suffix":
      return subject.endsWith(p) ? scoreWindow(text, subject, p, n - m, n, positions) : NO_MATCH;
    case "equal":
      return subject === p ? scoreWindow(text, subject, p, 0, m, positions) : NO_MATCH;
  }
  return NO_MATCH;
}

function parseTerm(token) {
  let text = token;
  const term = { inverse: false, kind: "fuzzy", text: "", caseSensitive: false };
  if (text.startsWith("!")) {
    term.inverse = true;
    term.kind = "exact"; // fzf: negations match literally
    text = text.slice(1);
  }
  if (text.startsWith("'")) {
    term.kind = "exact";
    text = text.slice(1);
  } else if (text.startsWith("^")) {
    term.kind = text.endsWith("$") && text.length > 1 ? "equal" : "prefix";
    text = text.slice(1);
    if (term.kind === "equal") text = text.slice(0, -1);
  } else if (text.endsWith("$") && text.length > 1) {
    term.kind = "suffix";
    text = text.slice(0, -1);
  }
  term.caseSensitive = text !== text.toLowerCase();
  term.text = term.caseSensitive ? text : text.toLowerCase();
  return term;
}

/** Parses a query into AND-groups of OR-terms. Empty terms are dropped. */
export function parseQuery(query) {
  const groups = [];
  let current = null;
  let orNext = false;
  for (const token of query.trim().split(/\s+/)) {
    if (!token) continue;
    if (token === "|") {
      orNext = current !== null;
      continue;
    }
    const term = parseTerm(token);
    if (!term.text) continue;
    if (orNext && current) current.push(term);
    else groups.push((current = [term]));
    orNext = false;
  }
  return groups;
}

/**
 * Scores one candidate against parsed groups: its score, or NO_MATCH. With
 * `positions` (an array), collects matched indexes.
 */
export function scoreCandidate(groups, text, lower = text.toLowerCase(), positions = null) {
  let total = 0;
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    let best = NO_MATCH;
    let bestPositions = null;
    for (let k = 0; k < group.length; k++) {
      const term = group[k];
      if (term.inverse) {
        if (matchTerm(term, text, lower, null) === NO_MATCH && best === NO_MATCH) best = 0;
        continue;
      }
      const mine = positions ? [] : null;
      const score = matchTerm(term, text, lower, mine);
      if (score > best) {
        best = score;
        bestPositions = mine;
      }
    }
    if (best === NO_MATCH) return NO_MATCH;
    total += best;
    if (positions && bestPositions) for (const p of bestPositions) positions.push(p);
  }
  return total;
}

/** Matched character indexes of `text` for `query` (sorted, unique), for highlighting. */
export function matchPositions(query, text) {
  const groups = typeof query === "string" ? parseQuery(query) : query;
  if (!groups.length) return [];
  const positions = [];
  if (scoreCandidate(groups, text, text.toLowerCase(), positions) === NO_MATCH) return [];
  return [...new Set(positions)].sort((a, b) => a - b);
}

// Sort key: (MAX_SCORE - score) · 2^32 + length · 2^16 + index, exact in a double
// (< 2^53): scores clamped to ±2^19, up to 65536 candidates, lengths capped at 65535.
const MAX_SCORE = 2 ** 19;
const SCORE_SHIFT = 2 ** 32;
const LENGTH_SHIFT = 2 ** 16;

/**
 * Filters and ranks, fzf-style: best score first, then shorter text, then
 * original order. `texts` and `lowers` are parallel arrays (the candidates'
 * search text and its lowercase). With an empty query, every index in order.
 * Returns an array of candidate indexes.
 */
export function rankIndexes(query, texts, lowers) {
  const groups = typeof query === "string" ? parseQuery(query) : query;
  const n = Math.min(texts.length, LENGTH_SHIFT);
  if (!groups.length) return Array.from({ length: n }, (_, i) => i);
  const keys = new Float64Array(n);
  let count = 0;
  for (let i = 0; i < n; i++) {
    const score = scoreCandidate(groups, texts[i], lowers[i], null);
    if (score === NO_MATCH) continue;
    // One number per hit so the native numeric sort orders them without a comparator.
    keys[count++] = (MAX_SCORE - Math.max(-MAX_SCORE, Math.min(score, MAX_SCORE))) * SCORE_SHIFT + Math.min(texts[i].length, LENGTH_SHIFT - 1) * LENGTH_SHIFT + i;
  }
  const sorted = keys.subarray(0, count).sort();
  const out = new Array(count);
  for (let k = 0; k < count; k++) out[k] = sorted[k] % LENGTH_SHIFT;
  return out;
}

/** Convenience for tests and small lists: ranked `items` by `getText`. */
export function rank(items, query, getText) {
  const texts = items.map(getText);
  return rankIndexes(query, texts, texts.map((t) => t.toLowerCase())).map((i) => items[i]);
}
