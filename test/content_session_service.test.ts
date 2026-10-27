import assert from "node:assert/strict";
import { rotateCreatorSession } from "../src/content_session_service.ts";

const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
const auth = {
  async refresh(refreshToken: string) {
    calls.push({ path: "/v1/auth/session/refresh", body: { refresh_token: refreshToken } });
    return { ok: true, data: { access_token: "next-access", refresh_token: "next-refresh" } };
  }
};

const result = await rotateCreatorSession({ tenantId: "studio-7", accountId: "editor-3", refreshToken: "old-refresh" }, auth);
assert.equal(result.nextStep, "replace-stored-refresh-token");
assert.equal(result.tenantId, "studio-7");
assert.deepEqual(calls[0], { path: "/v1/auth/session/refresh", body: { refresh_token: "old-refresh" } });
console.log("content session rotation: ok");
