import { test } from "node:test";
import assert from "node:assert/strict";
import { cartItemKey, type CartItem } from "./cart.ts";

test("cartItemKey distinguishes product items by productId+variantId", () => {
  const a: CartItem = {
    kind: "product",
    productId: "p1",
    variantId: "v1",
    name: "Сукня",
    size: "86-92",
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const b: CartItem = { ...a, variantId: "v2" };
  assert.notEqual(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey is stable for the same product+variant", () => {
  const a: CartItem = {
    kind: "product",
    productId: "p1",
    variantId: "v1",
    name: "Сукня",
    size: "86-92",
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const b: CartItem = { ...a, qty: 3 };
  assert.equal(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey distinguishes accessory items by accessoryId", () => {
  const a: CartItem = { kind: "accessory", accessoryId: "acc1", name: "Обруч", price: 150, qty: 1 };
  const b: CartItem = { ...a, accessoryId: "acc2" };
  assert.notEqual(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey never collides a product item with an accessory item", () => {
  const product: CartItem = {
    kind: "product",
    productId: "acc1",
    variantId: "v1",
    name: "Сукня",
    size: null,
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const accessory: CartItem = { kind: "accessory", accessoryId: "acc1", name: "Обруч", price: 150, qty: 1 };
  assert.notEqual(cartItemKey(product), cartItemKey(accessory));
});
