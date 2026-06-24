import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderMessage } from "./telegram.ts";

const baseOrder = {
  ref: "KC-ABC123",
  customerName: "Марія Коваль",
  phone: "+380671234567",
  city: "Київ",
  novaPoshta: "№5 — вул. Хрещатик, 1",
  note: null,
  totalAmount: 1600,
  paymentMethod: "cod" as const,
  monoPaidAt: null,
  items: [
    { name: "Сукня", size: "110", color: "рожева", price: 1200, qty: 1 },
    { name: "Обідок", size: null, color: null, price: 200, qty: 2 },
  ],
};

test("buildOrderMessage includes order ref", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("KC-ABC123"), "should contain ref");
});

test("buildOrderMessage includes customer name and phone", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Марія Коваль"));
  assert.ok(msg.includes("+380671234567"));
});

test("buildOrderMessage formats COD payment", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Постоплата"));
  assert.ok(!msg.includes("Онлайн"));
});

test("buildOrderMessage formats card payment as paid", () => {
  const msg = buildOrderMessage({
    ...baseOrder,
    paymentMethod: "card",
    monoPaidAt: new Date(),
  });
  assert.ok(msg.includes("Онлайн"));
  assert.ok(msg.includes("Оплачено"));
});

test("buildOrderMessage shows note only when present", () => {
  const withNote = buildOrderMessage({ ...baseOrder, note: "подарунок" });
  assert.ok(withNote.includes("подарунок"));

  const withoutNote = buildOrderMessage({ ...baseOrder, note: null });
  assert.ok(!withoutNote.includes("Примітка"));
});

test("buildOrderMessage includes item lines with price", () => {
  const msg = buildOrderMessage(baseOrder);
  assert.ok(msg.includes("Сукня"));
  assert.ok(msg.includes("1 200"));
  assert.ok(msg.includes("1 600"));
});
