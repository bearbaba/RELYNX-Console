import test from "node:test";
import assert from "node:assert/strict";
import { verifyNoticeReadback } from "../src/noticeVerification.js";

const A = "a".repeat(64);
const B = "b".repeat(64);
const base = {
  claim_id: 4, state: "ACTIVE", last_decision: "KEEP",
  last_notice_sha256: A, revocation_sha256: "",
};
const check = (source, digest=A, claimId=4) =>
  verifyNoticeReadback(source, { claimId, digest });

test("KEEP is verified only with matching stored SHA-256, claim ID, and ACTIVE state", () => {
  const result = check(base);
  assert.equal(result.ok, true);
  assert.equal(result.decision, "KEEP");
  assert.match(result.message, /exact submitted SHA-256/);
});
test("REVOKE requires REVOKED state and exact revocation digest", () => {
  const yes = check({ ...base, state: "REVOKED", last_decision: "REVOKE", revocation_sha256: A });
  assert.equal(yes.ok, true);
  assert.equal(check({ ...base, last_decision: "REVOKE", revocation_sha256: A }).ok, false);
  assert.equal(check({ ...base, state: "REVOKED", last_decision: "REVOKE", revocation_sha256: B }).ok, false);
});
test("UNVERIFIABLE (a persisted AI verdict) is distinct from source diagnostics", () => {
  assert.equal(check({ ...base, last_decision: "UNVERIFIABLE" }).ok, true);
  for (const decision of ["SOURCE_MISMATCH", "SOURCE_UNAVAILABLE", "INVALID_SCOPE", "", null]) {
    const result = check({ ...base, last_decision: decision });
    assert.equal(result.ok, false, decision);
    assert.equal(result.code, "NO_FINAL_DECISION");
  }
});
test("digest mismatch NEVER yields success after FINALIZED/SUCCESS", () => {
  const result = check({ ...base, last_notice_sha256: B });
  assert.equal(result.ok, false);
  assert.equal(result.code, "NOTICE_DIGEST_MISMATCH");
  assert.match(result.message, /NOT VERIFIED/);
});
test("no stored digest on source rejection NEVER yields success", () => {
  assert.equal(check({ ...base, last_notice_sha256: "" }).ok, false);
});
test("prior successful notice digest must not verify a new submitted digest", () => {
  assert.equal(check(base, B).ok, false);
});
test("mismatched claim ID fails closed", () => {
  assert.equal(check({ ...base, claim_id: 3 }).ok, false);
  assert.equal(check({ ...base, claim_id: "4" }).ok, false);
});
test("invalid, empty, or unparseable readbacks fail closed", () => {
  for (const x of [null, "", "not-json", "[]", [], 4, "{}"]) {
    assert.equal(check(x).ok, false, String(x));
  }
});
test("JSON string readback is supported (GenLayer claim_status returns JSON string)", () => {
  assert.equal(check(JSON.stringify(base)).ok, true);
});
test("KEEP or UNVERIFIABLE cannot pass if state is REVOKED", () => {
  for (const decision of ["KEEP", "UNVERIFIABLE"]) {
    assert.equal(check({ ...base, state: "REVOKED", last_decision: decision }).ok, false);
  }
});
test("invalid input digest/ID cannot be accepted", () => {
  assert.equal(check(base, "0x" + A).ok, false);
  assert.equal(check(base, A, -1).ok, false);
});
