import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRscGate, isTrackedFlight, observeFlightResponse } from "@pms-core/lib/rsc-flight";

describe("RSC flight gate", () => {
  it("holds a refresh until the action flight ends, then yields a turn", () => {
    const queued: Array<{ run: () => void }> = [];
    const gate = createRscGate((fn) => {
      queued.push({ run: fn });
    });
    const order: string[] = [];

    gate.begin();
    gate.whenIdle(() => order.push("refresh"));
    assert.equal(queued.length, 0);

    gate.end();
    assert.equal(queued.length, 1);
    assert.deepEqual(order, []);
    queued.shift()?.run();
    assert.deepEqual(order, ["refresh"]);
  });

  it("does not start a queued refresh while another flight is still open", () => {
    const queued: Array<{ run: () => void }> = [];
    const gate = createRscGate((fn) => {
      queued.push({ run: fn });
    });
    let ran = false;

    gate.begin();
    gate.whenIdle(() => {
      ran = true;
    });
    gate.begin();
    gate.end();
    assert.equal(queued.length, 0);
    gate.end();
    queued.shift()?.run();
    assert.equal(ran, true);
  });

  it("tracks server actions and ignores plain RSC navigations", () => {
    assert.equal(isTrackedFlight(new Headers({ "next-action": "abc" })), true);
    assert.equal(isTrackedFlight(new Headers({ rsc: "1", "next-router-state-tree": "%5B%5D" })), false);
    assert.equal(isTrackedFlight(new Headers({ "next-router-prefetch": "1" })), false);
    assert.equal(isTrackedFlight(new Headers()), false);
  });

  it("settles only after the response body is consumed", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("ok"));
        controller.close();
      },
    });
    let settled = false;
    const response = observeFlightResponse(new Response(body, { status: 200 }), () => {
      settled = true;
    });
    assert.equal(settled, false);
    assert.equal(await response.text(), "ok");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(settled, true);
  });
});
