import assert from "node:assert/strict";
import test from "node:test";
import { isValidTargetPrice } from "@/lib/price-alerts";

test("price alert targets accept bounded Decimal(10,2) values only", () => {
  assert.equal(isValidTargetPrice(49.99), true);
  assert.equal(isValidTargetPrice(0), false);
  assert.equal(isValidTargetPrice(Number.NaN), false);
  assert.equal(isValidTargetPrice(Number.POSITIVE_INFINITY), false);
  assert.equal(isValidTargetPrice(12.345), false);
  assert.equal(isValidTargetPrice(100_000_000), false);
});
