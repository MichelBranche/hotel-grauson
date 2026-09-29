import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkInInRange,
  parseReservationListQuery,
  reservationListEmpty,
  reservationListHref,
} from "@pms-core/lib/reservation-list";

describe("reservation list query", () => {
  it("keeps room, queue, status, and arrival dates together", () => {
    const parsed = parseReservationListQuery({
      room: "12",
      coda: "web",
      stato: "OPTION",
      from: "2026-10-01",
      to: "2026-10-31",
    });
    assert.deepEqual(parsed, {
      room: "12",
      queue: true,
      status: "OPTION",
      from: "2026-10-01",
      to: "2026-10-31",
    });
    assert.equal(
      reservationListHref({ ...parsed, queue: false, status: "CONFIRMED" }),
      "/pms/reservations?room=12&stato=CONFIRMED&from=2026-10-01&to=2026-10-31",
    );
    assert.equal(reservationListHref({}), "/pms/reservations");
  });

  it("ignores an unknown status and a broken date", () => {
    const parsed = parseReservationListQuery({ stato: "NO_SHOW", from: "ieri", to: "2026-10-02" });
    assert.equal(parsed.status, undefined);
    assert.equal(parsed.from, undefined);
    assert.equal(parsed.to, "2026-10-02");
    assert.equal(checkInInRange("2026-10-02", undefined, "2026-10-02"), true);
    assert.equal(checkInInRange("2026-10-03", "2026-10-01", "2026-10-02"), false);
  });

  it("picks a distinct empty sentence", () => {
    assert.equal(reservationListEmpty({ queue: false, total: 0, web: 0, shown: 0, filtered: false }), "Nessuna prenotazione.");
    assert.equal(
      reservationListEmpty({ queue: false, total: 4, web: 1, shown: 0, filtered: true }),
      "Nessuna prenotazione con questi filtri.",
    );
    assert.equal(reservationListEmpty({ queue: true, total: 4, web: 0, shown: 0, filtered: false }), "Nessuna richiesta web in attesa.");
    assert.equal(
      reservationListEmpty({ queue: true, total: 4, web: 0, shown: 0, filtered: true }),
      "Nessuna richiesta web in attesa.",
    );
    assert.equal(
      reservationListEmpty({ queue: true, total: 4, web: 1, shown: 0, filtered: true }),
      "Nessuna prenotazione con questi filtri.",
    );
    assert.equal(reservationListEmpty({ queue: false, total: 2, web: 0, shown: 2, filtered: false }), null);
  });
});
