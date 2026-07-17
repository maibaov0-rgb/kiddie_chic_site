import { test } from "node:test";
import assert from "node:assert/strict";
import { accessoryTypeName, ACCESSORY_TYPES } from "./catalog.ts";

test("ACCESSORY_TYPES has exactly the fixed entries", () => {
  assert.deepEqual(
    ACCESSORY_TYPES.map((a) => a.id),
    [
      "headband",
      "gloves",
      "bag",
      "choker",
      "train",
      "wristband",
      "hairpiece",
      "bowTrain",
      "dressBow",
      "basqueTrain",
      "slipperTies",
      "sleeves",
      "wristbandSet2",
      "dressBowSet2",
      "skirt",
    ],
  );
});

test("accessoryTypeName returns the Ukrainian name by default", () => {
  assert.equal(accessoryTypeName("headband", false), "Обруч");
});

test("accessoryTypeName returns the English name when en=true", () => {
  assert.equal(accessoryTypeName("bag", true), "Bag");
});

test("accessoryTypeName falls back to the raw id for an unknown type", () => {
  assert.equal(accessoryTypeName("unknown-type", false), "unknown-type");
});
