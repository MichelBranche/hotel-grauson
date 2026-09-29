import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canForceCancel, permissionsFor } from "@pms-core/config/permissions";

describe("developer role", () => {
  it("matches the owner permissions", () => {
    assert.deepEqual(permissionsFor("DEVELOPER"), permissionsFor("OWNER"));
  });

  it("can force-cancel a checked-in stay, like the owner", () => {
    assert.equal(canForceCancel("DEVELOPER"), true);
    assert.equal(canForceCancel("OWNER"), true);
    assert.equal(canForceCancel("RECEPTIONIST"), false);
  });
});
