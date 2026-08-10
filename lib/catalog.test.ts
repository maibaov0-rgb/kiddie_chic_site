import { test } from "node:test";
import assert from "node:assert/strict";
import { accessoryTypeName, ACCESSORY_TYPES } from "./catalog.ts";

test("ACCESSORY_TYPES has exactly the fixed entries", () => {
  assert.deepEqual(
    ACCESSORY_TYPES.map((a) => a.id),
    [
      "bowTrain",
      "hairBowLarge",
      "hairBowMedium",
      "dressBow",
      "dressBowSet2",
      "hairBows5",
      "bowsOnCorset",
      "handBows",
      "basqueTrain",
      "slipperTies",
      "headband",
      "headbandWithBow",
      "headbandFlower",
      "headbandButterfly",
      "headbandBow",
      "headbandPlain",
      "hairpiece",
      "wristband",
      "wristbandSet2",
      "sleeves",
      "glovesEurofatinBarbie",
      "gloves",
      "glovesPlain",
      "glovesWithBows",
      "glovesWithBeads",
      "glovesWithButterflies",
      "skirt",
      "bag",
      "roseOnSkirt",
      "choker",
      "chokerWithRoses",
      "chokerSequin",
      "train",
      "topFlower",
      "dressFlower",
      "collarBow",
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
