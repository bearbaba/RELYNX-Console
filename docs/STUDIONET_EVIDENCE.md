# RELYNX — Studionet evidence ledger

**Deployment observed in user-provided GenLayer Studio screenshot (2026-10-19):**

- Network: GenLayer Studionet (expected chain ID 61999; verify from live claim status).
- Deployed contract: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- Studio import link: https://studio.genlayer.com/?import-contract=0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa
- Execution Mode: Normal (Full Consensus), displayed in Studio.
- Studio Transactions: **Deploy — FINALIZED** (green); the complete transaction hash is now linked below.
- The Studio's Read Methods panel displays **State: Accepted**; this is a separate label and does not undo the deploy FINALIZED transaction status.
- **Recorded:** issuer wallet, both `claim_status` readbacks, positive eligibility A/B, confirmed `parent_a = 1`, and source-committed, SHA-256-pinned notice for Claim #1.
- **Observed from user-provided `claim_status` readbacks:** Claim #1 now `REVOKED` with `last_decision = REVOKE`, and Claim #2 stays `ACTIVE` but inherits `can_rely = false` via `parent_a = 1`. Both had `can_rely = true` before review.
- **Recorded:** four complete TX hashes; Studio screenshot labels all four **FINALIZED**, including `review_notice(1)`. The user has provided the transaction detail reporting FINALIZED, GenVM Execution SUCCESS, Consensus Accepted and return REVOKE. Initial validator count: 5; the full five-validator transcript was not supplied. Optional raw `revocation_url` inspection remains.

## Consumer Gate — separate contract deployed (2026-10-19)

The user supplied the GenLayer Explorer deployment detail for an **independent consumer contract**. It is distinct from the original, unchanged RELYNX contract.

| Field | User-supplied Explorer value |
| --- | --- |
| Contract class | `RelynxConsumerGate` |
| Deployed address | `0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b` |
| Studio link | https://studio.genlayer.com/?import-contract=0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b |
| Deployment transaction | [`0xeb2ac841f66f1dd635f48a2d3f3c702d605bb0068cc1a62f3bf42979835aa454`](https://explorer-studio.genlayer.com/tx/0xeb2ac841f66f1dd635f48a2d3f3c702d605bb0068cc1a62f3bf42979835aa454) |
| Status | **FINALIZED** |
| GenVM Execution | **SUCCESS**; Return Value `null` (expected for constructor) |
| Consensus | **Accepted**, Normal execution, 5 initial validators |
| From | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| Nonce | `381` |
| Created | `Oct 19, 2026, 7:54:02 PM` (Explorer display) |
| Source header | `# v0.1.0`, pinned py-genlayer Depends runner |
| Constructor inputs | Source RELYNX `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`, issuer `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`, repository `bearbaba/relynx`, prefix `aurora-` |

The pasted `contract_code` contains the `as_address` correction which converts Studio-decoded 160-bit address integers to GenLayer `Address` values. Unlike the previous failed deployment attempt (`ACCEPTED / ERROR`, `OverflowError`), this separate deployment is reported **FINALIZED with GenVM SUCCESS**.

**Integration NOT YET verified:** successful deployment alone does not prove the cross-contract `gl.get_contract_at(...).view()` call, nor that the consumer enforces the source eligibility. The next mandatory Studio readbacks are `policy()`, `receipt_count()`, `can_act(2)` and `can_act(3)`, then a rejected `perform_action(2, "blocked-v1")`, a successful `perform_action(3, "allowed-v2")`, and a durable `receipt(1)`. All of these remain *expected*, not claimed as observed.

## Consumer Gate follow-up evidence (2026-10-19)

[Dedicated consumer live evidence](CONSUMER_LIVE_EVIDENCE.md) records matching `policy()`/`can_act()` views, the expected Claim #2 `claim not eligible` rollback (Studio ACCEPTED / ERROR), and the Claim #3 `perform_action` FINALIZED / GenVM SUCCESS return ID 1. **Final accepted readbacks confirm `receipt_count()=1` and `receipt(1)` persisted Claim #3 / `allowed-v2` / the submitting actor.** The cross-contract integration workflow is now evidenced end-to-end.

## Studionet transaction evidence — 2026-10-19

The user provided all four complete transaction hashes and a GenLayer Studio screenshot marking each transaction **FINALIZED**. The action mapping below follows the Studio transaction list. **FINALIZED means the transaction lifecycle finished; it does not alone certify execution success.** Direct Explorer detail retrieval was unavailable, so the screenshot is the provenance for the status claim.

| Transaction | Explorer link | Reported Studio status |
| --- | --- | --- |
| Deploy `Relynx` | [`0x447648f60a05d96bd33259f0e4a12ca3ad91a9a1fa1fee226b9f18bbb30a2bc2`](https://explorer-studio.genlayer.com/tx/0x447648f60a05d96bd33259f0e4a12ca3ad91a9a1fa1fee226b9f18bbb30a2bc2) | **FINALIZED** |
| `register_claim` — Claim #1 | [`0x73697beabb56b20ef58ce2e94d666a30428246902396e5f2f288e182178f4ead`](https://explorer-studio.genlayer.com/tx/0x73697beabb56b20ef58ce2e94d666a30428246902396e5f2f288e182178f4ead) | **FINALIZED** |
| `register_claim` — Claim #2 | [`0x8f001d520576be918cd570b438cb585810d87f7511d211174ad4762fa6ac1aa5`](https://explorer-studio.genlayer.com/tx/0x8f001d520576be918cd570b438cb585810d87f7511d211174ad4762fa6ac1aa5) | **FINALIZED** |
| `review_notice` — Claim #1 | [`0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624`](https://explorer-studio.genlayer.com/tx/0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624) | **FINALIZED** |

The separate user-supplied `claim_status` readbacks demonstrate the **committed REVOKE decision and inherited eligibility change**, while the detailed `review_notice` Execution Result and validator-by-validator consensus history remain to be collected.

## Initial eligibility readbacks — 2026-10-19

The user supplied two Studio **Call Contract → Response (Accepted)** view results:

| Method | Claim ID | Observed result |
| --- | ---: | --- |
| `can_rely(1)` | 1 | **`true`** |
| `can_rely(2)` | 2 | **`true`** |

These readbacks establish the **pre-revocation** baseline. Later user-provided `claim_status(1)` and `claim_status(2)` readbacks verify Claim #2 has `parent_a = 1` and that revocation of A is now reflected in B's **derived `can_rely`**, while B's stored state remains `ACTIVE`.

## Claim #1 — live `claim_status(1)` readback (2026-10-19)

The user supplied the following result from GenLayer Studio `Call Contract → Response (Accepted)`, on the deployed instance. This is an observed read response, not an independently verified transaction receipt.

| Field | Observed value |
| --- | --- |
| `claim_id` | `1` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo` | `bearbaba/relynx` |
| `key` | `aurora-v1` |
| `statement` | `Issuer certifies library Aurora v1.0 as compliant with the published integration safety policy.` |
| `statement_sha256` | `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213` |
| `parent_a`, `parent_b` | `0`, `0` |
| `depth` | `1` |
| `state` | `ACTIVE` |
| `can_rely` | `true` |
| `last_decision`, `last_notice_sha256`, `revocation_url` | Empty strings |

**Baseline complete:** A is the root claim, and the subsequent `claim_status(2)` readback proves B depends directly on A.

## Claim #2 — live `claim_status(2)` readback (2026-10-19)

User-provided GenLayer Studio `Call Contract → Response (Accepted)`:

| Field | Observed value |
| --- | --- |
| `claim_id` | `2` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo` | `bearbaba/relynx` |
| `key` | `aurora-service` |
| `statement` | `Issuer declares Aurora integration service relies on the Aurora v1.0 safety certification.` |
| `statement_sha256` | `5f80c635b7f1d1fc30929d32d173345f996504fda28d26190390a6fa4e1f1cee` |
| `parent_a`, `parent_b` | **`1`**, `0` |
| `depth` | `2` |
| `state` | **`ACTIVE`** |
| `can_rely` | **`true`** |
| `last_decision`, `last_notice_sha256`, `revocation_url` | Empty strings |

This readback confirms the direct A → B dependency, which is necessary to demonstrate inheritance of revocation without modifying B.

## Commit-pinned Claim #1 revocation notice (reviewed on Studionet; full TX hash recorded)

- Source URL (immutable commit): https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt
- Git commit SHA supplied to `review_notice`: `bad26c15ab4a294142545ce2c48f78bbc0a923b5`
- SHA-256 of exact UTF-8 notice document, **410 bytes without a trailing newline**: `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388`
- Envelope: `RELYNX_NOTICE_V1`; `CHAIN_ID: 61999`, `CLAIM_ID: 1`, `KEY: aurora-v1`, `REPO: bearbaba/relynx`.
- Issuer in notice: `0x4c7cb73ac8f8999af21cfc9ff4cf2333a9508dcb` (lowercase of the registered wallet).
- `STATEMENT_SHA256`: `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213`.
- Notice statement (184 characters): `Effective immediately, the issuer explicitly revokes and withdraws the Aurora v1.0 integration safety certification for library Aurora v1.0 recorded in Claim #1; it is no longer valid.`
- GitHub content at the pinned commit was fetched again and compared to the prepared exact document.
- **Actual on-chain state observed subsequently:** `claim_status(1).last_decision = REVOKE`, `state = REVOKED`, with exact `last_notice_sha256 = revocation_sha256` equal to the pinned notice digest above. The user also supplied Explorer transaction details confirming **FINALIZED**, **Execution SUCCESS**, **Consensus Accepted** and return **REVOKE**; full individual-validator history has not been supplied.

## Successful AI review — transaction details (2026-10-19)

The user provided GenLayer Explorer transaction detail for [review_notice(1)](https://explorer-studio.genlayer.com/tx/0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624). Its recorded result is FINALIZED, GenVM Execution SUCCESS, Consensus Accepted, Return Value "REVOKE". From: 0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb. To: 0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa. Execution Mode Normal, Initial Validators 5, Rotation Count 0, Value 0 GEN, October 19 2026 5:53:48 PM (Explorer display).

Input: claim_id 1; commit bad26c15ab4a294142545ce2c48f78bbc0a923b5; notice SHA-256 1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388. The visible Equivalence Principle Output 0 shows decision REVOKE and the matching verbatim notice quote. The pasted source-hash field is truncated; the complete notice digest is independently evidenced by the input and claim_status readbacks.

The user-provided Explorer transaction text establishes successful execution and accepted consensus; it does not expose separate outputs from all five initial validators. The Explorer page could not be independently fetched from this environment.

## Post-revocation verification — user-provided live view readbacks (2026-10-19)

The user provided GenLayer Studio `Call Contract → Response (Accepted)` values for `claim_status(1)` and `claim_status(2)` following the notice review. These are **observed contract view results**, not an independently inspected GenLayer transaction receipt.

| Field | Claim #1 (source) | Claim #2 (dependent) |
| --- | --- | --- |
| `claim_id` | `1` | `2` |
| `state` | **`REVOKED`** | **`ACTIVE`** |
| `can_rely` before | `true` | `true` |
| `can_rely` after | **`false`** | **`false`** |
| `parent_a` / `parent_b` | `0` / `0` | **`1`** / `0` |
| `last_decision` | **`REVOKE`** | Empty string |
| `last_notice_sha256` | `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388` | Empty string |
| `revocation_sha256` | `1e6e5862f6fc0fd5a2a3861555eae09497a09f32785bf4711936408353e09388` | Empty string |
| `last_quote_sha256` | `b6c138c20ce969efdd7d25ba6ce817023721e79fedfef3d8dbc9f74f4c86ee0f` | Empty string |
| `statement_sha256` | `cb26c28fd2056de111ee3970d20d3f50b244285d0a2b8ecf3c257c5bad436213` | `5f80c635b7f1d1fc30929d32d173345f996504fda28d26190390a6fa4e1f1cee` |

Both records report `chain_id = 61999` and `issuer = 0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`. The registered repository remains `bearbaba/relynx` and the keys are `aurora-v1` and `aurora-service`, respectively.

**Demonstrated dependency consequence:** claim #2's *stored* `state` remains `ACTIVE`, with no new notice/decision fields, while its **derived** `can_rely` is now `false`, inherited from revoked parent Claim #1. This confirms the core two-claim cascade behavior through on-chain views without requiring a separate child-revocation write.

**Source display caution:** the user message showed `revocation_url` formatted as a Markdown link; verify the raw Studio value when documenting exact URL bytes. The expected commit-pinned URL from contract code is https://raw.githubusercontent.com/bearbaba/relynx/bad26c15ab4a294142545ce2c48f78bbc0a923b5/notices/aurora-v1.txt.

## Claim #3 baseline and non-revocation test source — 2026-10-19

The user supplied an accepted `claim_status(3)` readback from the deployed Studionet instance.

| Field | Observed value |
| --- | --- |
| `claim_id` | `3` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo`, `key` | `bearbaba/relynx`, `aurora-v2` |
| `statement` | `Issuer certifies library Aurora v2.0 as compliant with the published integration safety policy.` |
| `statement_sha256` | `87533fb191260ad538cf1d17b22e7da6220de40bf3391e3307ee644ff77b4d2a` |
| `parent_a`, `parent_b`, `depth` | `0`, `0`, `1` |
| `state`, `can_rely` | **`ACTIVE`**, **`true`** |
| `last_decision`, `revocation_sha256` | Empty strings |

A synthetic, explicit **non-revocation** notice for independent Claim #3 was created, committed and checked against the exact source content at its pinned commit. This does **not** represent a genuine external certificate.

- GitHub source: https://raw.githubusercontent.com/bearbaba/relynx/1cbd8ccbd5d5a7163c33d6864adf3196e38d9968/notices/aurora-v2.txt
- `commit`: `1cbd8ccbd5d5a7163c33d6864adf3196e38d9968`
- `notice_sha256`: `7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260` (425 UTF-8 bytes, no trailing newline)
- Intent: assert Aurora v2.0 certification remains valid, explicitly differentiate it from the revoked Aurora v1.0 certificate
- **Next live write:** `review_notice(3, "1cbd8ccbd5d5a7163c33d6864adf3196e38d9968", "7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260")`.
- **Observed on-chain readbacks:** `claim_status(3)` returns **`last_decision = KEEP`**, **`state = ACTIVE`**, **`can_rely = true`** with its notice SHA-256 matching the pinned file, and a subsequent dedicated `can_rely(3)` call returned **`true`**. The user now also supplied the full `review_notice(3)` [TX hash](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9). The user subsequently supplied the complete Explorer transaction detail: FINALIZED, GenVM SUCCESS, Consensus Accepted, Return KEEP, Initial Validators 5, and an exact Equivalence Principle output with a full matching source digest. The complete per-validator transcript has not been supplied.

## Claim #3 review transaction — Explorer detail confirmed

- Method identified in the demo sequence: `review_notice(3)`
- Full user-supplied hash: [`0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9`](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9)
- Expected input commit: `1cbd8ccbd5d5a7163c33d6864adf3196e38d9968`
- Expected notice SHA-256: `7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260`
- Observed **post-review claim state:** `KEEP / ACTIVE / can_rely=true`; independently repeated `can_rely(3)` view returns `true`.
- **Confirmed from user-provided Explorer transaction details:** FINALIZED; GenVM Execution SUCCESS; Consensus Accepted; Return Value `"KEEP"`; Initial Validators `5`; Rotation Count `0`; one Equivalence Principle output includes a full source hash and the supporting quotation. This establishes aggregate consensus acceptance, not an individual 5/5 vote transcript.

## Claim #3 KEEP — transaction execution and comparative-consensus proof (2026-10-19)

The user provided a complete text excerpt from the [GenLayer Explorer transaction](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9); details below are grounded in that supplied record, not an independently fetched Explorer page.

| Field | User-provided Explorer result |
| --- | --- |
| Hash | `0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9` |
| Status | **FINALIZED** |
| From | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| To | `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa` |
| Value | `0 GEN` |
| Nonce | `379` |
| Created At | `Oct 19, 2026, 6:18:51 PM` (Explorer display) |
| Execution Mode | `Normal` |
| Initial Validators | `5` |
| Rotation Count | `0` |
| Consensus Result | **Accepted** |
| Method | `review_notice` |
| Input #0 | `3` |
| Input #1 | `1cbd8ccbd5d5a7163c33d6864adf3196e38d9968` |
| Input #2 | `7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260` |
| GenVM Execution Result | **SUCCESS** |
| Return Value | **`"KEEP"`** |
| Stdout / Stderr | Empty |

**Equivalence Principle Output 0:**

```json
{"decision":"KEEP","quote":"The issuer confirms that the Aurora v2.0 integration safety certification recorded in Claim #3 remains valid and is not revoked, withdrawn, suspended, or superseded by the earlier Aurora v1.0 notice.","source_sha256":"7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260"}
```

The exact notice digest matches the committed `notices/aurora-v2.txt` and the accepted `claim_status(3).last_notice_sha256` readback. The follow-up `can_rely(3)` view returned **true**, so the accepted KEEP decision left the unrelated Aurora v2.0 attestation usable. Five *initial* validators were reported; the data provided does not enumerate all individual validator votes.

## Claim #3 post-review `KEEP` readback — 2026-10-19

The user submitted a subsequent **GenLayer Studio `claim_status(3)` Response (Accepted)**, after preparing and reviewing the pinned Aurora v2.0 non-revocation notice.

| Field | Observed value |
| --- | --- |
| `claim_id` | `3` |
| `chain_id` | `61999` |
| `issuer` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` |
| `repo` / `key` | `bearbaba/relynx` / `aurora-v2` |
| `statement` | `Issuer certifies library Aurora v2.0 as compliant with the published integration safety policy.` |
| `statement_sha256` | `87533fb191260ad538cf1d17b22e7da6220de40bf3391e3307ee644ff77b4d2a` |
| `parent_a` / `parent_b` / `depth` | `0` / `0` / `1` |
| `state` | **`ACTIVE`** |
| `can_rely` | **`true`** |
| `last_decision` | **`KEEP`** |
| `last_notice_sha256` | `7070b2a97dc9a59a51d9065316af0dece61114a77e33bfb8fa451bca977da260` |
| `last_quote_sha256` | `4b0b96b9c6052a13b38cd7478c07368f02716be27f639bd91bec873d54fd1943` |
| `revocation_sha256` / `revocation_url` | Both empty |

**Interpretation:** RELYNX recorded a non-revocation decision while leaving an independent Aurora v2.0 certificate eligible and unrevoked. The user separately rechecked `can_rely(3)` and received `true` from Studio. The notice digest exactly matches the immutable file pinned at commit `1cbd8ccbd5d5a7163c33d6864adf3196e38d9968`. The full user-provided Explorer transaction detail confirms FINALIZED / Execution SUCCESS / Consensus Accepted / Return `KEEP`.

**Live negative scenario demonstrated at the contract-state level:** Claim #3 returned `KEEP` and remains eligible, with a separate `can_rely(3)=true` read. Transaction-level verification is also provided: the user copied the [review transaction](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9) details showing `FINALIZED`, `Execution SUCCESS`, `Consensus Accepted` and Return `"KEEP"`. Individual five-validator outputs were not all included. An additional `INVALID_SCOPE` case is optional.

The intended acceptance gates are (i) A/B initially usable, (ii) issuer repo committed a version/claim-bound correction, (iii) GenLayer `REVOKE` resolution actually finalized, (iv) A and dependent B both no longer usable while B itself has not been rewritten, (v) invalid scope or non-revocation notice cannot revoke an unaffected C, (vi) source code/tests/CI green.

When live, attach exact full TX hashes and commit pinned notice URLs, state snapshots, and separate notes about Studio FINALIZED status versus execution result. Do not claim an independently verified Explorer receipt based only on a screenshot.
