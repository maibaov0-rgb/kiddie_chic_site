import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueSlug } from "./slug.ts";

test("slugify transliterates cyrillic and lowercases", () => {
  assert.equal(slugify("Сукня Принцеса"), "suknia-printsesa");
});

test("slugify strips punctuation and collapses dashes", () => {
  assert.equal(slugify("  Сукня!!  №1 "), "suknia-1");
});

test("uniqueSlug returns base when free", async () => {
  const out = await uniqueSlug("dress", async () => false);
  assert.equal(out, "dress");
});

test("uniqueSlug appends suffix on collision", async () => {
  const taken = new Set(["dress", "dress-2"]);
  const out = await uniqueSlug("dress", async (s) => taken.has(s));
  assert.equal(out, "dress-3");
});
