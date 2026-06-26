// Search-ranking tests. Run with: node --test  (or: pnpm test)
// These pin the behaviours that matter so a tag/data edit can't silently
// regress the rankings.

import { test } from "node:test";
import assert from "node:assert/strict";
import { search, topUsed, groupedByCategory, DOMAINS } from "../src/search.js";

const top = (q, opts) => search(q, opts)[0]?.cmd;
const topN = (q, n, opts) => search(q, opts).slice(0, n).map((r) => r.cmd.keys);

test("domains are exposed", () => {
  assert.deepEqual(DOMAINS, ["Vim", "CLI"]);
});

test("plain-English Vim lookups resolve", () => {
  assert.equal(top("delete a line").keys, "dd");
  assert.equal(top("copy a line").keys.startsWith("yy"), true);
  assert.equal(top("undo").keys, "u");
  assert.equal(top("jump to matching bracket").keys, "%");
});

test("synonyms collapse onto the same concept", () => {
  // "remove" -> delete, "erase" -> delete
  assert.equal(top("remove a line").keys, "dd");
  assert.equal(top("erase to end of line").keys.startsWith("D"), true);
});

test("typo tolerance (bounded edit distance)", () => {
  assert.ok(topN("defintion", 3).includes("gd"));
  assert.ok(topN("replcae all", 3).some((k) => k.includes("%s")));
});

test("reverse lookup: typing the keys/command finds it", () => {
  assert.equal(top("dd").keys, "dd");
  assert.equal(top("rg").keys, 'rg "pattern"');
  assert.equal(top("rg").domain, "CLI");
});

test("CLI intent surfaces CLI commands, not Vim", () => {
  assert.equal(top("find files").domain, "CLI");
  assert.equal(top("search in files").domain, "CLI");
  assert.equal(top("jump directory").domain, "CLI");
});

test("action keywords (kw) are searchable", () => {
  // kw is folded into the tag tokens
  assert.ok(topN("kill process", 3).some((k) => k.toLowerCase().includes("kill")));
  assert.equal(top("history", { domain: "CLI" }).keys, "Ctrl+R");
});

test("domain scoping filters results", () => {
  assert.ok(search("delete", { domain: "Vim" }).every((r) => r.cmd.domain === "Vim"));
  assert.ok(search("search", { domain: "CLI" }).every((r) => r.cmd.domain === "CLI"));
});

test("frequency boost lifts used commands", () => {
  const usage = { dd: 9 };
  assert.equal(top("delete", { usage }).keys, "dd");
});

test("empty query returns the full list, scoped by domain", () => {
  const all = search("");
  assert.ok(all.length > 100);
  assert.ok(search("", { domain: "CLI" }).every((r) => r.cmd.domain === "CLI"));
});

test("topUsed returns most-used first", () => {
  const usage = { dd: 2, u: 9 };
  assert.equal(topUsed(usage, 5)[0].cmd.keys, "u");
});

test("groupedByCategory spans both domains with items", () => {
  const groups = groupedByCategory();
  assert.ok(groups.some((g) => g.domain === "Vim"));
  assert.ok(groups.some((g) => g.domain === "CLI"));
  assert.ok(groups.every((g) => g.items.length > 0));
});
