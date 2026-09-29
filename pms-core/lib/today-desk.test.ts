import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PAY_AT_PROPERTY_NOTE } from "@pms-core/lib/pay-at-property";
import { todayDesk, type TodayStay } from "@pms-core/lib/today-desk";

function stay(patch: Partial<TodayStay> & Pick<TodayStay, "code" | "status" | "checkIn" | "checkOut">): TodayStay {
  return {
    id: patch.code,
    guestName: "Rossi Anna",
    roomNumber: "1",
    source: "pms",
    notes: "",
    ...patch,
  };
}

describe("today desk", () => {
  const today = "2026-09-29";

  it("groups arrivals, departures, in-house stays, and web requests", () => {
    const desk = todayDesk(
      [
        stay({ code: "A", status: "CONFIRMED", checkIn: today, checkOut: "2026-10-02", roomNumber: "12" }),
        stay({ code: "B", status: "CHECKED_IN", checkIn: today, checkOut: "2026-10-01", roomNumber: "2" }),
        stay({ code: "C", status: "CANCELLED", checkIn: today, checkOut: "2026-10-03", roomNumber: "3" }),
        stay({ code: "D", status: "CHECKED_IN", checkIn: "2026-09-27", checkOut: today, roomNumber: "8" }),
        stay({ code: "E", status: "CHECKED_OUT", checkIn: "2026-09-26", checkOut: today, roomNumber: "4" }),
        stay({ code: "F", status: "NO_SHOW", checkIn: "2026-09-28", checkOut: today, roomNumber: "5" }),
        stay({
          code: "W",
          status: "OPTION",
          checkIn: "2026-10-10",
          checkOut: "2026-10-12",
          source: "website",
          notes: PAY_AT_PROPERTY_NOTE,
          roomNumber: "9",
        }),
        stay({ code: "G", status: "OPTION", checkIn: "2026-10-01", checkOut: "2026-10-03", source: "website", notes: "" }),
      ],
      today,
    );

    assert.deepEqual(desk.arrivals.map((item) => item.code), ["B", "A"]);
    assert.deepEqual(desk.departures.map((item) => item.code), ["E", "D"]);
    assert.deepEqual(desk.inHouse.map((item) => item.code), ["B", "D"]);
    assert.deepEqual(desk.webRequests.map((item) => item.code), ["W"]);
  });
});
