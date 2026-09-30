import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planningColor, planningLegendItems } from "@pms-core/lib/planning-color";

describe("planning colors", () => {
  it("maps each status to a fixed color, not an id hash", () => {
    assert.equal(planningColor("OPTION"), planningColor("OPTION"));
    assert.notEqual(planningColor("OPTION"), planningColor("CONFIRMED"));
    assert.notEqual(planningColor("CONFIRMED"), planningColor("CHECKED_IN"));
    assert.equal(planningColor("CHECKED_IN"), "#c5daf0");
  });

  it("exposes Italian labels for the board legend", () => {
    const labels = planningLegendItems().map((item) => item.label);
    assert.deepEqual(labels, ["Opzione", "Confermata", "Check-in", "Check-out", "Richiesta"]);
  });
});
