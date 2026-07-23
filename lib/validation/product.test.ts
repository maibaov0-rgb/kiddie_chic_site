import { test } from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "./product.ts";

const valid = {
  category: "dress",
  name_uk: "Сукня",
  name_en: "Dress",
  description_uk: "опис",
  description_en: "desc",
  images: ["https://res.cloudinary.com/demo/image/upload/v1/k/a.jpg"],
  colors: ["powder"],
  inStock: true,
  isNew: false,
  isBestseller: false,
  variants: [{ size: "98-104", price: 1200 }],
};

test("accepts a valid product", () => {
  assert.equal(productSchema.safeParse(valid).success, true);
});

test("accepts empty name_uk (optional field)", () => {
  const r = productSchema.safeParse({ ...valid, name_uk: "" });
  assert.equal(r.success, true);
});

test("rejects product with no variants", () => {
  const r = productSchema.safeParse({ ...valid, variants: [] });
  assert.equal(r.success, false);
});

test("rejects non-positive price", () => {
  const r = productSchema.safeParse({
    ...valid,
    variants: [{ size: "98-104", price: 0 }],
  });
  assert.equal(r.success, false);
});

test("accepts a product with accessories", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [
      { type: "headband", price: 150 },
      { type: "choker", price: 200 },
    ],
  });
  assert.equal(r.success, true);
});

test("defaults accessories to an empty array when omitted", () => {
  const r = productSchema.safeParse(valid);
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.accessories, []);
});

test("rejects an accessory with a non-positive price", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [{ type: "headband", price: 0 }],
  });
  assert.equal(r.success, false);
});

test("rejects duplicate accessory types on the same product", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [
      { type: "headband", price: 150 },
      { type: "headband", price: 180 },
    ],
  });
  assert.equal(r.success, false);
});

test("rejects an unknown accessory type", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [{ type: "necklace", price: 150 }],
  });
  assert.equal(r.success, false);
});

test("featuredPosition defaults to null", () => {
  const r = productSchema.safeParse(valid);
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, null);
});

test("accepts featuredPosition 1..10", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 5 });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, 5);
});

test("rejects featuredPosition 0", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 0 });
  assert.equal(r.success, false);
});

test("rejects featuredPosition 11", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 11 });
  assert.equal(r.success, false);
});

test("treats empty string featuredPosition (unset select) as null", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: "" });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, null);
});
