import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { startOfIsoWeek } from "@pms-core/lib/dates";
import { PLANNING_OPEN_SPAN, planningOpenFrom, planningOpenRange } from "@pms-core/lib/planning-window";

describe("planning open window", () => {
  it("uses the Monday–Sunday week that contains the Rome calendar day", () => {
    // 21:30 UTC is 23:30 on Wednesday 30 Sep 2026 in Rome (CEST, UTC+2).
    const wednesday = new Date("2026-09-30T21:30:00Z");
    assert.equal(planningOpenFrom("Europe/Rome", wednesday), "2026-09-28");
    const range = planningOpenRange("Europe/Rome", wednesday);
    assert.equal(range.from, "2026-09-28");
    assert.equal(range.to, "2026-10-05");
    assert.equal(PLANNING_OPEN_SPAN, 7);

    // 22:30 UTC is 00:30 on Thursday 1 Oct in Rome, still that same week.
    assert.equal(planningOpenFrom("Europe/Rome", new Date("2026-09-30T22:30:00Z")), "2026-09-28");
    // Sunday 4 Oct 21:30 UTC is still Sunday evening in Rome.
    assert.equal(planningOpenFrom("Europe/Rome", new Date("2026-10-04T21:30:00Z")), "2026-09-28");
    // Sunday 22:30 UTC is already Monday 5 Oct in Rome, the next week.
    assert.equal(planningOpenFrom("Europe/Rome", new Date("2026-10-04T22:30:00Z")), "2026-10-05");
  });

  it("keeps a Monday on that Monday", () => {
    assert.equal(startOfIsoWeek("2026-09-28"), "2026-09-28");
    assert.equal(startOfIsoWeek("2026-10-04"), "2026-09-28");
    assert.equal(startOfIsoWeek("2026-12-15"), "2026-12-14");
  });
});
