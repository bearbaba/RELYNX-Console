/** Compare a finalized RELYNX claim_status readback to the exact review_notice request.
 *
 * IMPORTANT: review_notice() returns SOURCE_UNAVAILABLE, SOURCE_MISMATCH or
 * INVALID_SCOPE without mutating the claim. A FINALIZED / GenVM SUCCESS
 * transaction is therefore NOT proof that the notice was admitted.
 * Never report verified success unless stored digest and decision both match.
 */
const SHA256 = /^[0-9a-f]{64}$/;
const FINAL_DECISIONS = new Set(["REVOKE", "KEEP", "UNVERIFIABLE"]);

export function verifyNoticeReadback(raw, expected) {
  let claim;
  try {
    claim = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, code: "MALFORMED_READBACK", message: "Claim readback is not valid JSON. Notice verification is unconfirmed." };
  }
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
    return { ok: false, code: "MALFORMED_READBACK", message: "Claim readback is not an object. Notice verification is unconfirmed." };
  }
  const id = Number(expected?.claimId);
  const digest = expected?.digest;
  if (!Number.isSafeInteger(id) || id < 1 || !SHA256.test(String(digest ?? ""))) {
    return { ok: false, code: "INVALID_EXPECTED", message: "Submitted claim ID or SHA-256 is invalid." };
  }
  if (claim.claim_id !== id) {
    return { ok: false, code: "CLAIM_ID_MISMATCH", message: "Finalized claim ID differs from the reviewed claim. No notice verification." };
  }
  const stored = claim.last_notice_sha256;
  if (stored !== digest) {
    const suffix = typeof stored === "string" && SHA256.test(stored)
      ? "A different notice digest is stored."
      : "No matching notice digest is stored.";
    return {
      ok: false,
      code: "NOTICE_DIGEST_MISMATCH",
      message: "NOTICE NOT VERIFIED: " + suffix +
        " A finalized execution may have returned SOURCE_MISMATCH, SOURCE_UNAVAILABLE, or INVALID_SCOPE without updating contract state. Check the transaction result and exact notice source; do not report success or sign another transaction while its status is uncertain."
    };
  }
  const decision = claim.last_decision;
  if (!FINAL_DECISIONS.has(decision)) {
    return {
      ok: false,
      code: "NO_FINAL_DECISION",
      message: "The submitted notice digest matches but no supported persisted AI decision was returned. Notice verification is unconfirmed."
    };
  }
  if (decision === "REVOKE") {
    if (claim.state !== "REVOKED" || claim.revocation_sha256 !== digest) {
      return { ok: false, code: "REVOCATION_INCONSISTENT", message: "REVOKE decision and persisted revocation state/digest disagree. Do not report success." };
    }
  } else if (claim.state !== "ACTIVE") {
    return { ok: false, code: "STATE_INCONSISTENT", message: "Persisted KEEP/UNVERIFIABLE decision is inconsistent with claim state. Do not report success." };
  }
  return {
    ok: true,
    code: "VERIFIED",
    decision,
    message: "Notice admitted on-chain: " + decision + ". Claim #" + id +
      " stored the exact submitted SHA-256, with consistent finalized decision and state."
  };
}
