import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { occupyingStatuses, planningStatuses, releasedStatuses } from "@pms-core/config/status";
import { todayInTimeZone } from "@pms-core/lib/dates";
import { DomainError } from "@pms-core/lib/errors";
import {
  actionsFor,
  assertStatusTransition,
  checkInBlockMessage,
  earlyCheckout,
} from "@pms-core/lib/reservation-status";

function refused(from: Parameters<typeof assertStatusTransition>[0], to: Parameters<typeof assertStatusTransition>[1], options?: { forceCancel?: boolean; reason?: string }) {
  assert.throws(() => assertStatusTransition(from, to, options), DomainError);
}

describe("status transitions", () => {
  it("allows the reception path and nothing else", () => {
    assert.doesNotThrow(() => assertStatusTransition("INQUIRY", "OPTION"));
    assert.doesNotThrow(() => assertStatusTransition("INQUIRY", "CONFIRMED"));
    assert.doesNotThrow(() => assertStatusTransition("INQUIRY", "CANCELLED"));
    assert.doesNotThrow(() => assertStatusTransition("OPTION", "CONFIRMED"));
    assert.doesNotThrow(() => assertStatusTransition("OPTION", "CANCELLED"));
    assert.doesNotThrow(() => assertStatusTransition("CONFIRMED", "CHECKED_IN"));
    assert.doesNotThrow(() => assertStatusTransition("CONFIRMED", "CANCELLED"));
    assert.doesNotThrow(() => assertStatusTransition("CONFIRMED", "NO_SHOW"));
    assert.doesNotThrow(() => assertStatusTransition("CHECKED_IN", "CHECKED_OUT"));

    refused("INQUIRY", "CHECKED_IN");
    refused("INQUIRY", "NO_SHOW");
    refused("OPTION", "CHECKED_IN");
    refused("OPTION", "NO_SHOW");
    refused("CONFIRMED", "CHECKED_OUT");
    refused("CHECKED_IN", "CONFIRMED");
    refused("CHECKED_IN", "NO_SHOW");
    refused("CONFIRMED", "CONFIRMED");
  });

  it("refuses a straight cancel after check-in unless an owner forces it with a reason", () => {
    assert.throws(() => assertStatusTransition("CHECKED_IN", "CANCELLED"), /già in casa/);
    assert.throws(
      () => assertStatusTransition("CHECKED_IN", "CANCELLED", { forceCancel: true }),
      /indica un motivo/,
    );
    assert.doesNotThrow(() =>
      assertStatusTransition("CHECKED_IN", "CANCELLED", { forceCancel: true, reason: "Ospite partito senza saldo" }),
    );
  });

  it("treats check-out, cancel and no-show as terminal", () => {
    for (const from of ["CHECKED_OUT", "CANCELLED", "NO_SHOW"] as const) {
      assert.throws(() => assertStatusTransition(from, "CONFIRMED"), /stato definitivo/);
      assert.deepEqual(actionsFor(from), []);
    }
  });

  it("frees the room for planning and search when a booking is cancelled or a no-show", () => {
    assert.doesNotThrow(() => assertStatusTransition("CONFIRMED", "CANCELLED"));
    assert.doesNotThrow(() => assertStatusTransition("OPTION", "CANCELLED"));
    assert.doesNotThrow(() => assertStatusTransition("CONFIRMED", "NO_SHOW"));
    for (const status of releasedStatuses) {
      assert.equal(occupyingStatuses.includes(status), false);
      assert.equal(planningStatuses.includes(status), false);
    }
    assert.equal(occupyingStatuses.includes("CONFIRMED"), true);
    assert.equal(occupyingStatuses.includes("OPTION"), true);
    assert.equal(planningStatuses.includes("CONFIRMED"), true);
  });

  it("blocks check-in when the room is out of order or out of service", () => {
    assert.match(checkInBlockMessage({ number: "12", status: "OUT_OF_ORDER" }) ?? "", /fuori servizio/);
    assert.match(checkInBlockMessage({ number: "12", status: "OUT_OF_SERVICE" }) ?? "", /manutenzione/);
    assert.equal(checkInBlockMessage({ number: "12", status: "DIRTY" }), null);
    assert.equal(checkInBlockMessage({ number: "12", status: "AVAILABLE" }), null);
  });

  it("shortens an early check-out to today and keeps a same-day departure as planned", () => {
    const early = earlyCheckout("2026-12-20", "2026-12-27", "2026-12-24");
    assert.equal(early.shortened, true);
    assert.equal(early.checkOut, "2026-12-24");
    assert.equal(early.nights, 4);

    const planned = earlyCheckout("2026-12-20", "2026-12-24", "2026-12-24");
    assert.equal(planned.shortened, false);
    assert.equal(planned.checkOut, "2026-12-24");

    const sameDay = earlyCheckout("2026-12-20", "2026-12-24", "2026-12-20");
    assert.equal(sameDay.shortened, true);
    assert.equal(sameDay.checkOut, "2026-12-21");
    assert.equal(sameDay.nights, 1);
  });

  it("reads the hotel date in Europe/Rome, not UTC", () => {
    assert.equal(todayInTimeZone("Europe/Rome", new Date("2026-12-24T23:30:00Z")), "2026-12-25");
  });
});
