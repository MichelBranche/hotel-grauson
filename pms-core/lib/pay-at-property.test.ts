import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { payAtPropertyNotification } from "@pms-core/lib/pay-at-property";

describe("pay at property notice", () => {
  it("names the stay and the guest", () => {
    assert.deepEqual(payAtPropertyNotification({ code: "BK-2026-1", guestName: "Rossi Anna" }), {
      type: "reservation.pay_at_property",
      title: "Nuova richiesta web",
      body: "BK-2026-1 · Rossi Anna",
    });
  });

  it("keeps the code when the guest name is missing", () => {
    assert.equal(payAtPropertyNotification({ code: "BK-2026-1", guestName: "  " }).body, "BK-2026-1");
  });
});
