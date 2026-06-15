// Lightweight offline search over the Vim command database.
//
// "Understanding" without an LLM: a synonym/concept layer collapses different
// words for the same idea onto one canonical token ("remove"/"cut"/"erase" ->
// "delete", "occurrence"/"instance"/"match" -> "occurrence", "jump"/"navigate"
// -> "go"). Both the query and the database are mapped through the SAME map, so
// the exact wording you type stops mattering. Plus light stemming for plurals,
// typo tolerance (bounded edit distance), and a frequency boost for the
// commands you look up most.

import { VIM_COMMANDS } from "./vim-data.js";

// Words that add no signal — ignored when scoring (but never block a match).
const STOP = new Set([
  "the", "a", "an", "to", "of", "in", "on", "is", "do", "does", "how", "i",
  "my", "me", "with", "and", "or", "for", "from", "at", "it", "this", "that",
  "vim", "command", "key", "keys", "shortcut", "press", "want", "can", "you",
  "where", "what", "when", "get", "make", "into", "current", "whole",
]);

// Concept groups: every word on the right collapses to the word on the left.
// Add a line here and the whole search instantly understands the new phrasing.
const GROUPS = {
  go: ["jump", "goto", "navigate", "move", "moving", "moves", "skip", "reach"],
  delete: ["remove", "cut", "erase", "del", "deletes", "deleting", "kill", "clear", "drop"],
  copy: ["yank", "yanks", "duplicate", "clone", "grab"],
  paste: ["put", "insert"], // note: "insert" mode handled by its own words too
  definition: ["def", "declaration", "definitions", "defined", "implementation"],
  occurrence: ["instance", "instances", "occurrences", "match", "matches", "result", "results", "hit", "hits"],
  search: ["find", "finds", "locate", "look", "grep", "searching"],
  start: ["beginning", "begin", "first", "top", "head", "front", "leftmost"],
  end: ["last", "bottom", "tail", "finish", "trailing", "rightmost"],
  line: ["lines", "row", "rows"],
  word: ["words", "token"],
  file: ["document", "buffer", "doc", "files", "whole"],
  undo: ["revert", "undid", "back", "mistake"],
  redo: ["reapply", "forward"],
  replace: ["substitute", "swap", "sub", "replacing", "replaces"],
  change: ["edit", "modify", "retype", "rewrite"],
  select: ["highlight", "selection", "selecting", "selected", "visual"],
  save: ["write", "store", "saving", "writes"],
  quit: ["exit", "close", "leave", "quitting"],
  indent: ["tab", "indentation", "reindent", "format"],
  bracket: ["brackets", "parenthesis", "parentheses", "paren", "parens", "brace", "braces", "matching"],
  scroll: ["scrolling", "page"],
  case: ["uppercase", "lowercase", "capitalize", "capitalise"],
  number: ["numbers", "digit", "digits", "count", "increment", "decrement"],
  next: ["forward", "following", "subsequent"],
  previous: ["prev", "preceding", "prior", "before", "backward", "backwards"],
  comment: ["uncomment", "commenting"],
  screen: ["window", "view", "viewport", "visible"],
  macro: ["macros", "record", "recording", "automate", "repeat"],
  mark: ["bookmark", "marks", "bookmarks"],
};

// Flatten GROUPS -> { word: canonical }.
const CANON = {};
for (const [canonical, words] of Object.entries(GROUPS)) {
  CANON[canonical] = canonical;
  for (const w of words) CANON[w] = canonical;
}

function normalize(s) {
  return s.toLowerCase().trim();
}

// Light stem: collapse simple plurals so "lines" -> "line", "brackets" -> "bracket".
function stem(t) {
  if (t.length >= 5 && t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us")) {
    return t.slice(0, -1);
  }
  return t;
}

// Map a raw word to its canonical concept token.
function canon(t) {
  if (CANON[t]) return CANON[t];
  const s = stem(t);
  return CANON[s] || s;
}

function tokenize(s) {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(canon);
}

// Bounded edit distance: true if `a` and `b` are within `max` edits.
// Early-exits, so it's cheap for the small `max` (1) we use for typo tolerance.
function withinEditDistance(a, b, max) {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return false;
  let prev = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    const cur = new Array(lb + 1);
    cur[0] = i;
    let rowBest = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowBest) rowBest = cur[j];
    }
    if (rowBest > max) return false;
    prev = cur;
  }
  return prev[lb] <= max;
}

// Build a cached, canonicalized search index once.
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

// Does any token in `set` fuzzily match `t` (within 1 edit)?
function fuzzyHit(set, t) {
  if (t.length < 4) return false;
  for (const s of set) {
    if (s.length >= 4 && withinEditDistance(t, s, 1)) return true;
  }
  return false;
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
    if (entry.tagTokens.has(t)) best = Math.max(best, 16);
    if (entry.descTokens.has(t)) best = Math.max(best, 14);
    else {
      for (const dt of entry.descTokens) {
        if (dt.startsWith(t) && t.length >= 3) { best = Math.max(best, 9); break; }
      }
    }
    if (entry.catLower && entry.catLower.includes(t) && t.length >= 3) best = Math.max(best, 10);
    if (entry.keysLower.includes(t)) best = Math.max(best, 8);

    // Typo tolerance: only when nothing else matched this token.
    if (best === 0) {
      if (fuzzyHit(entry.tagTokens, t)) best = 8;
      else if (fuzzyHit(entry.descTokens, t)) best = 7;
    }

    if (best > 0) matchedTokens++;
    score += best;
  }

  // Reward covering most of the query — keeps multi-word queries precise.
  if (considered.length > 1 && matchedTokens === considered.length) {
    score += 12 * considered.length;
  } else if (considered.length > 1 && matchedTokens >= 2) {
    score += 5 * matchedTokens;
  }

  return score;
}

// Gentle lift for commands the user reaches for often — a tiebreaker, not an
// override, so relevance still wins.
function usageBoost(keys, usage) {
  const n = usage[keys] || 0;
  return n ? Math.min(n, 8) * 4 : 0;
}

/**
 * Search the database. Returns ranked { cmd, score } results.
 * Empty query or no matches → the full list, so there's always something to scroll.
 * `usage` is an optional { keys: count } map that boosts frequently-used commands.
 */
export function search(rawQuery, { usage = {}, limit = 50 } = {}) {
  const query = (rawQuery || "").trim();
  if (!query) return VIM_COMMANDS.map((cmd) => ({ cmd, score: 0 }));

  const tokens = tokenize(query);
  const ranked = [];
  for (const entry of INDEX) {
    const score = scoreEntry(entry, query, tokens);
    if (score > 0) ranked.push({ cmd: entry.cmd, score: score + usageBoost(entry.cmd.keys, usage) });
  }
  ranked.sort((a, b) => b.score - a.score);
  if (!ranked.length) return VIM_COMMANDS.map((cmd) => ({ cmd, score: 0 }));
  return ranked.slice(0, limit);
}

/** The most-used commands first, for the browse view's "Frequent" section. */
export function topUsed(usage, n = 5) {
  return VIM_COMMANDS
    .filter((c) => usage[c.keys])
    .sort((a, b) => usage[b.keys] - usage[a.keys])
    .slice(0, n)
    .map((cmd) => ({ cmd, score: 0 }));
}

/** All commands grouped by category, preserving database order. */
export function groupedByCategory() {
  const order = [];
  const map = new Map();
  for (const cmd of VIM_COMMANDS) {
    if (!map.has(cmd.cat)) {
      map.set(cmd.cat, []);
      order.push(cmd.cat);
    }
    map.get(cmd.cat).push(cmd);
  }
  return order.map((cat) => ({ cat, items: map.get(cat) }));
}
