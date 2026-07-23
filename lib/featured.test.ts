import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFeaturedReorder, MAX_FEATURED_POSITION } from "./featured.ts";

test("MAX_FEATURED_POSITION is 10", () => {
  assert.equal(MAX_FEATURED_POSITION, 10);
});

test("no-op: requesting the position the row already has", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
  ];
  const diff = computeFeaturedReorder(rows, "a", 1);
  assert.deepEqual(diff, []);
});

test("no-op: un-featuring a row that isn't featured", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "b", null);
  assert.deepEqual(diff, []);
});

test("insert: new featured row at position 1 shifts existing rows down", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "d", 1);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "a", featuredPosition: 2 },
      { id: "b", featuredPosition: 3 },
      { id: "c", featuredPosition: 4 },
      { id: "d", featuredPosition: 1 },
    ],
  );
});

test("insert: new featured row appended at the end doesn't move anyone else", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "c", 3);
  assert.deepEqual(diff, [{ id: "c", featuredPosition: 3 }]);
});

test("remove: un-featuring a middle row compresses the gap", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: 4 },
  ];
  const diff = computeFeaturedReorder(rows, "b", null);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "b", featuredPosition: null },
      { id: "c", featuredPosition: 2 },
      { id: "d", featuredPosition: 3 },
    ],
  );
});

test("move: existing featured row moves from position 2 to 4 in a 4-item list", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: 4 },
  ];
  const diff = computeFeaturedReorder(rows, "b", 4);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "b", featuredPosition: 4 },
      { id: "c", featuredPosition: 2 },
      { id: "d", featuredPosition: 3 },
    ],
  );
});

test("cap: inserting an 11th featured row at position 1 evicts whoever falls to position 11", () => {
  const rows: Array<{ id: string; featuredPosition: number | null }> = Array.from({ length: 10 }, (_, i) => ({
    id: `p${i + 1}`,
    featuredPosition: i + 1,
  }));
  rows.push({ id: "new", featuredPosition: null });
  const diff = computeFeaturedReorder(rows, "new", 1);
  const byId: Map<string, number | null> = new Map();
  diff.forEach((d) => byId.set(d.id, d.featuredPosition));
  assert.equal(byId.get("new"), 1);
  assert.equal(byId.get("p1"), 2);
  assert.equal(byId.get("p9"), 10);
  assert.equal(byId.get("p10"), null); // evicted — fell off the end of the top 10
  assert.equal(diff.length, 11); // new + p1..p9 shift + p10 evicted
});

test("a product not present in categoryRows is treated as not featured", () => {
  const rows = [{ id: "a", featuredPosition: 1 }];
  const diff = computeFeaturedReorder(rows, "brand-new-id", 1);
  assert.deepEqual(diff.sort((x, y) => x.id.localeCompare(y.id)), [
    { id: "a", featuredPosition: 2 },
    { id: "brand-new-id", featuredPosition: 1 },
  ]);
});
