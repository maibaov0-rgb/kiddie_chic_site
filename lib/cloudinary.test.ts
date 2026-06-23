import { test } from "node:test";
import assert from "node:assert/strict";
import { publicIdFromUrl } from "./cloudinary.ts";

test("publicIdFromUrl extracts folder/name without version or extension", () => {
  const url =
    "https://res.cloudinary.com/demo/image/upload/v1700000000/kiddie-chic/abc123.jpg";
  assert.equal(publicIdFromUrl(url), "kiddie-chic/abc123");
});

test("publicIdFromUrl handles nested folders", () => {
  const url =
    "https://res.cloudinary.com/demo/image/upload/v1/kiddie-chic/dresses/x.png";
  assert.equal(publicIdFromUrl(url), "kiddie-chic/dresses/x");
});

test("publicIdFromUrl returns null for non-cloudinary url", () => {
  assert.equal(publicIdFromUrl("https://example.com/x.jpg"), null);
});
