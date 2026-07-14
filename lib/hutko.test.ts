import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSignature, verifySignature } from "./hutko.ts";

// Known-good example straight from docs.hutko.org ("Формування підпису"):
// raw string "test|125|USD|1396424|test order|test123456" → sha1 → this hex
const DOC_EXAMPLE_HASH = "df38818facfbfd79953fa847667dac73a1291127";

test("buildSignature matches the documented example string and hash", () => {
  const sig = buildSignature("test", {
    order_id: "test123456",
    order_desc: "test order",
    currency: "USD",
    amount: "125",
    merchant_id: "1396424",
  });
  assert.equal(sig, DOC_EXAMPLE_HASH);
});

test("buildSignature ignores field order in the input object", () => {
  const a = buildSignature("test", { amount: "125", currency: "USD", merchant_id: "1396424", order_desc: "test order", order_id: "test123456" });
  const b = buildSignature("test", { order_id: "test123456", merchant_id: "1396424", currency: "USD", order_desc: "test order", amount: "125" });
  assert.equal(a, b);
});

test("buildSignature excludes empty/undefined/null fields but keeps '0'", () => {
  const withEmpty = buildSignature("pw", { a: "1", b: "", c: undefined, d: null, e: 0 });
  const withoutEmpty = buildSignature("pw", { a: "1", e: 0 });
  assert.equal(withEmpty, withoutEmpty);
});

test("verifySignature returns true for a self-signed payload", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(verifySignature("test", { ...params, signature }), true);
});

test("verifySignature ignores signature/response_signature_string when recomputing", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(
    verifySignature("test", { ...params, signature, response_signature_string: "***|irrelevant" }),
    true,
  );
});

test("verifySignature returns false when a field is tampered with", () => {
  const params = { merchant_id: "1700002", order_id: "KC-TEST1", amount: "10000", currency: "UAH" };
  const signature = buildSignature("test", params);
  assert.equal(verifySignature("test", { ...params, amount: "99999", signature }), false);
});

test("verifySignature returns false when signature is missing", () => {
  assert.equal(verifySignature("test", { order_id: "KC-TEST1" }), false);
});
