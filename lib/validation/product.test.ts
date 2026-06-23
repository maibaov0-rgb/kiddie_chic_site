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
  isHidden: false,
  variants: [{ size: "98-104", fabric: "satin", price: 1200 }],
};

test("accepts a valid product", () => {
  assert.equal(productSchema.safeParse(valid).success, true);
});

test("rejects empty name_uk", () => {
  const r = productSchema.safeParse({ ...valid, name_uk: "" });
  assert.equal(r.success, false);
});

test("rejects product with no variants", () => {
  const r = productSchema.safeParse({ ...valid, variants: [] });
  assert.equal(r.success, false);
});

test("rejects non-positive price", () => {
  const r = productSchema.safeParse({
    ...valid,
    variants: [{ size: "98-104", fabric: "satin", price: 0 }],
  });
  assert.equal(r.success, false);
});
