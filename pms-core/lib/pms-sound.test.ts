import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { soundPreferenceOn, unheardWebRequestIds } from "@pms-core/lib/pms-sound";

const web = { id: "n1", type: "reservation.pay_at_property", title: "Nuova richiesta web", read: false };

describe("pms notification sound", () => {
  it("is on unless the stored preference is off", () => {
    assert.equal(soundPreferenceOn(null), true);
    assert.equal(soundPreferenceOn("on"), true);
    assert.equal(soundPreferenceOn("off"), false);
  });

  it("announces an unread web request once", () => {
    assert.deepEqual(unheardWebRequestIds([web], []), ["n1"]);
    assert.deepEqual(unheardWebRequestIds([web], ["n1"]), []);
  });

  it("skips read notices and other kinds", () => {
    assert.deepEqual(unheardWebRequestIds([{ ...web, read: true }], []), []);
    assert.deepEqual(unheardWebRequestIds([{ id: "n2", type: "reservation.created", title: "Nuova prenotazione", read: false }], []), []);
  });
});
