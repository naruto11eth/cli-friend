// Lightweight offline search over the Vim command database.
// Scores each command against the query across keys / description / tags / category,
// so both plain-English ("delete to end of line") and reverse ("dd") lookups work.

import { VIM_COMMANDS } from "./vim-data.js";

// Words that add no signal — ignored when scoring (but never block a match).
const STOP = new Set([
  "the", "a", "an", "to", "of", "in", "on", "is", "do", "does", "how", "i",
  "my", "me", "with", "and", "or", "for", "from", "at", "it", "this", "that",
  "vim", "command", "key", "keys", "shortcut", "press", "want", "can", "you",
]);

function normalize(s) {
  return s.toLowerCase().trim();
}

function tokenize(s) {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Build a cached, lowercased search index once.
const INDEX = VIM_COMMANDS.map((cmd) => ({
  cmd,
  keysLower: normalize(cmd.keys),
  descLower: normalize(cmd.desc),
  descTokens: new Set(tokenize(cmd.desc)),
  tagTokens: new Set(tokenize(cmd.tags || "")),
  catLower: normalize(cmd.cat || ""),
}));

// Is `needle` a subsequence of `hay`? (cheap fuzzy/typo tolerance for keys)
function isSubsequence(needle, hay) {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) i++;
  }
  return i === needle.length;
}

function scoreEntry(entry, rawQuery, tokens) {
  const q = normalize(rawQuery);
  let score = 0;

  // Direct keystroke lookups: typing the actual keys should rank highest.
  if (q.length <= 6) {
    if (entry.keysLower === q) score += 200;
    else if (entry.keysLower.startsWith(q)) score += 90;
    else if (entry.keysLower.includes(q)) score += 55;
    else if (q.length >= 2 && isSubsequence(q, entry.keysLower)) score += 20;
  }

  const meaningful = tokens.filter((t) => !STOP.has(t));
  const considered = meaningful.length ? meaningful : tokens;
  let matchedTokens = 0;

  for (const t of considered) {
    let best = 0;
    if (entry.descTokens.has(t)) best = Math.max(best, 14);
    else {
      for (const dt of entry.descTokens) {
        if (dt.startsWith(t) && t.length >= 3) { best = Math.max(best, 9); break; }
      }
      if (best === 0 && t.length >= 3 && entry.descLower.includes(t)) best = Math.max(best, 6);
    }
    if (entry.tagTokens.has(t)) best = Math.max(best, 16);
    if (entry.catLower && entry.catLower.includes(t) && t.length >= 3) best = Math.max(best, 10);
    if (entry.keysLower.includes(t)) best = Math.max(best, 8);

    if (best > 0) matchedTokens++;
    score += best;
  }

  // Reward covering most of the query — keeps multi-word queries precise.
  if (considered.length > 1 && matchedTokens === considered.length) {
    score += 12 * considered.length;
  }

  return score;
}

/**
 * Search the database. Returns up to `limit` { cmd, score } results, ranked.
 * Empty query → a curated set of the most common commands.
 */
export function search(rawQuery, limit = 8) {
  const query = (rawQuery || "").trim();
  if (!query) {
    return defaults(limit);
  }

  const tokens = tokenize(query);
  const ranked = [];
  for (const entry of INDEX) {
    const score = scoreEntry(entry, query, tokens);
    if (score > 0) ranked.push({ cmd: entry.cmd, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

// Shown before the user types anything.
const DEFAULT_KEYS = ["i", "dd", "yy", "p", "u", "/{pattern}", ":wq  (or :x, or ZZ)", ":%s/old/new/g"];
function defaults(limit) {
  const out = [];
  for (const k of DEFAULT_KEYS) {
    const hit = VIM_COMMANDS.find((c) => c.keys === k);
    if (hit) out.push({ cmd: hit, score: 0 });
  }
  return out.slice(0, limit);
}
