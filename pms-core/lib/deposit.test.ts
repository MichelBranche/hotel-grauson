import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chargedDepositPercent, depositCents, depositEuros } from "@pms-core/lib/deposit";

describe("deposit", () => {
  it("charges the whole stay when the percent is missing or zero", () => {
    assert.equal(depositCents(360, 0), 36000);
    assert.equal(depositCents(360, null), 36000);
    assert.equal(depositCents(360, undefined), 36000);
    assert.equal(chargedDepositPercent(0), 100);
  });

  it("charges the plan percent and rounds half-up to cents", () => {
    assert.equal(depositCents(360, 30), 10800);
    assert.equal(depositEuros(360, 30), 108);
    assert.equal(depositCents(10.005, 100), 1001);
    assert.equal(depositCents(10.01, 30), 300);
  });
});
