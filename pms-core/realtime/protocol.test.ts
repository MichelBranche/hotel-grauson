import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeLiveEvent, isNewerSignal, parseSseBlock, readCookie } from "@pms-core/realtime/protocol";

describe("pms live protocol", () => {
  it("reads the session cookie and ignores other cookies", () => {
    assert.equal(readCookie("pms_session=abc%3D; theme=dark", "pms_session"), "abc=");
    assert.equal(readCookie("theme=dark", "pms_session"), null);
    assert.equal(readCookie(null, "pms_session"), null);
  });

  it("orders signals by time then id", () => {
    const at = new Date("2026-09-30T12:00:00.000Z");
    const later = new Date("2026-09-30T12:00:01.000Z");
    assert.equal(isNewerSignal({ createdAt: later, id: "a" }, { createdAt: at, id: "z" }), true);
    assert.equal(isNewerSignal({ createdAt: at, id: "b" }, { createdAt: at, id: "a" }), true);
    assert.equal(isNewerSignal({ createdAt: at, id: "a" }, { createdAt: at, id: "a" }), false);
    assert.equal(isNewerSignal({ createdAt: at, id: "a" }, { createdAt: later, id: "a" }), false);
  });

  it("round-trips a reservation event and ignores heartbeats", () => {
    const raw = encodeLiveEvent("sig_1", {
      topic: "reservation",
      action: "status",
      entityId: "res_1",
      notificationType: null,
      title: null,
    });
    assert.deepEqual(parseSseBlock(raw.trimEnd()), {
      id: "sig_1",
      payload: {
        topic: "reservation",
        action: "status",
        entityId: "res_1",
        notificationType: null,
        title: null,
      },
    });
    assert.deepEqual(parseSseBlock(": ping"), { id: null, payload: null });
  });

  it("keeps a web-request notice identifiable without guest details", () => {
    const parsed = parseSseBlock(
      encodeLiveEvent("sig_2", {
        topic: "notification",
        action: "created",
        entityId: "res_2",
        notificationType: "reservation.pay_at_property",
        title: "Nuova richiesta web",
      }),
    );
    assert.equal(parsed.payload?.title, "Nuova richiesta web");
    assert.equal(parsed.payload?.notificationType, "reservation.pay_at_property");
    assert.equal(JSON.stringify(parsed.payload).includes("@"), false);
  });
});
