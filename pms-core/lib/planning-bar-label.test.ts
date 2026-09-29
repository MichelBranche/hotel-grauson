import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planningBarLabel, planningBarTitle } from "@pms-core/lib/planning-bar-label";

const stay = {
  guestName: "Coda Web",
  guestLastName: "Coda",
  code: "BK-2026-1020",
  nights: 2,
  status: "CONFIRMED" as const,
};

describe("planning bar label", () => {
  it("puts the full stay on the tooltip", () => {
    assert.equal(planningBarTitle(stay), "Coda Web · BK-2026-1020 · Confermata · 2 notti");
  });

  it("keeps only the surname on the narrowest bars", () => {
    assert.equal(planningBarLabel({ ...stay, textWidth: 30 }), "Coda");
  });

  it("uses the surname and a short status when the bar is narrow", () => {
    const label = planningBarLabel({ ...stay, textWidth: 80 });
    assert.equal(label, "Coda · Conf.");
    assert.equal(label.includes("Web"), false);
    assert.equal(label.includes("Confermata"), false);
  });

  it("names the guest and the nights on a medium bar", () => {
    assert.equal(planningBarLabel({ ...stay, textWidth: 140 }), "Coda Web · 2 notti");
  });

  it("adds the status when the bar is wide", () => {
    assert.equal(planningBarLabel({ ...stay, textWidth: 240 }), "Coda Web · 2 notti · Confermata");
  });

  it("marks a website option as a web request", () => {
    const web = { ...stay, status: "OPTION" as const, payAtProperty: true, nights: 1 };
    assert.equal(planningBarLabel({ ...web, textWidth: 70 }), "Coda · Web");
    assert.equal(planningBarTitle(web), "Coda Web · BK-2026-1020 · Richiesta web · 1 notte");
  });
});
