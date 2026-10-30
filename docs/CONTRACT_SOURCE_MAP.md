# RELYNX Console — exact deployed contract sources and UI/API mappings

**Steward change request (Pavel Kolosov), 30 October 2026.** This document is part of the submitted **Projects** repository, not a request for new credit for the earlier accepted RELYNX Intelligent Contract.

## 1. Exact source bytes for the two addresses

Both source files below were obtained from the **live Studionet chain ID 61999** with the `genlayer-stable@1.1.8` SDK `getContractCode(address)`, then committed as source files in this repository. They are **not** rewritten interfaces or reconstructed pseudocode.

| Deployment | On-chain address | Exact deployed source | SHA-256 of deployed UTF-8 source bytes |
|---|---|---|---|
| RELYNX (previously accepted IC) | `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa` | [`contracts/relynx_deployed.py`](../contracts/relynx_deployed.py) | `15074c886bee129af732c4ddf25a55ffe8199e65569857da0738501c5681fc17` |
| Consumer Gate (separately deployed) | `0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b` | [`contracts/consumer_gate_deployed.py`](../contracts/consumer_gate_deployed.py) | `733e88b435119fb12aead71f2bf5b6e1d68258debed5a58e67dfcf0c4cd33674` |

**Byte fidelity note:** Earlier RELYNX repository versions contain equivalent Python content normalized as LF, with one final newline. The **deployed** Studionet contract bytes use CRLF and **no** final newline; the source files committed here preserve those exact bytes. A byte-for-byte comparison is important: do not reformat these two files and then claim unchanged deployed-source hashes.

**Independent reproduction (no wallet or GEN needed):**

```bash
npm install
npm run verify:contracts
```

The script [`scripts/verify-onchain-sources.mjs`](../scripts/verify-onchain-sources.mjs) calls `getContractCode` on each of the two hardcoded addresses, compares **raw UTF-8 bytes**, validates both hashes above and exits nonzero on any mismatch or RPC failure. No transaction or private key is involved.

- [RELYNX explorer](https://explorer-studio.genlayer.com/address/0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa)
- [Consumer Gate explorer](https://explorer-studio.genlayer.com/address/0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b)
- [Consumer Gate deployment TX](https://explorer-studio.genlayer.com/tx/0xeb2ac841f66f1dd635f48a2d3f3c702d605bb0068cc1a62f3bf42979835aa454)

## 2. Every Console → deployed contract method

Frontend: [`src/main.js`](../src/main.js); finalized read adapter: [`api/read.js`](../api/read.js); transaction-status adapter: [`api/tx.js`](../api/tx.js).

| Console action / code path | Deployed method | Arguments | Exact on-chain result and shape | Console treatment |
|---|---|---|---|---|
| Refresh claim counter | **RELYNX** `claim_count()` | none | `int` | number, displayed as count |
| Claim Explorer | **RELYNX** `claim_status(claim_id)` | positive `int` | `str` containing canonical JSON object | Parsed fields: `claim_id:int`, `issuer:str`, `repo:str`, `key:str`, `statement:str`, `statement_sha256:str`, `parent_a:int`, `parent_b:int`, `depth:int`, `state:"ACTIVE"\\|"REVOKED"`, `can_rely:bool`, `last_decision:str`, `last_notice_sha256:str`, `last_quote_sha256:str`, `revocation_url:str`, `revocation_sha256:str`, `chain_id:str` |
| Derived eligibility | **RELYNX** `can_rely(claim_id)` | positive `int` | `bool` | Contract-level trust source, including ancestor state |
| User registers a claim | **RELYNX** `register_claim(repo_owner,repo_name,key,statement,parent_a,parent_b)` | `str,str,str,str,int,int` | `int` new claim ID | Wallet signs; Console checks finalized `claim_count` and exact issuer/key/statement readback before announcing success |
| User submits correction | **RELYNX** `review_notice(claim_id,commit,notice_sha256)` | `int,str,str` | `str`: `REVOKE`, `KEEP`, `UNVERIFIABLE`; or **diagnostics** `SOURCE_UNAVAILABLE`, `SOURCE_MISMATCH`, `INVALID_SCOPE` | Wallet signs; **only verified if finalized `claim_status` persists submitted SHA-256 AND final verdict/state are consistent**. Diagnostics do not persist a notice decision |
| Consumer eligibility UI | **Consumer Gate** `can_act(claim_id)` | positive `int` | `bool` | true = eligible to sign; false = blocked |
| User signs consumer action | **Consumer Gate** `perform_action(claim_id,action_key)` | `int,str` | `int` receipt ID; may roll back | Wallet signs; Console verifies finalized `receipt_count`/`receipt` and exact `claim_id`, `action_key`, `actor` |
| Refresh receipt counter | **Consumer Gate** `receipt_count()` | none | `int` | number |
| Inspect receipt | **Consumer Gate** `receipt(receipt_id)` | positive `int` | `str` containing JSON object `{receipt_id:int,claim_id:int,actor:str,action_key:str}` | Parsed and displayed after matching submitted signed action |
| Gate source/issuer parameters (read in contract; not directly exposed by this Console UI) | **Consumer Gate** `policy()` | none | `str` containing JSON `{relynx:str,issuer:str,repository:str,key_prefix:str,chain_id:str}` | Included as source-verifiable configuration; currently *not* in `api/read.js` allowlist |

The read adapter's `scope` maps **`relynx`** to `0x69c3…176Fa` and **`gate`** to `0xe342…01B0b`; it supports only the methods used by the Console, validates positive numeric `id` arguments, calls `readContract(...,transactionHashVariant=LATEST_FINAL)`, serializes BigInts and returns `{value: ...}`. The browser's `read()` passes that value into `toObject()` for JSON string reads. The signed write path uses exactly these same addresses with `writeContract`; `api/tx.js` provides finality and execution status.

## 3. Contract → contract call and actual policy

Inside the deployed Gate [`contracts/consumer_gate_deployed.py`](../contracts/consumer_gate_deployed.py), method `_is_eligible(claim_id)` uses:

```python
source = gl.get_contract_at(self.relynx)
raw = source.view().claim_status(claim_id)  # JSON string
info = json.loads(raw)                     # dict after parsing
# Check exact claim_id, chain_id, ACTIVE, trusted repo, issuer, key prefix,
# and JSON can_rely is True.
return source.view().can_rely(claim_id) is True  # bool
```

`can_act(claim_id)` wraps this in a fail-closed catch; `perform_action` invokes `can_act` again **at write time**, then stores an `ActionReceipt` in the Gate. Policy constructor binds the original RELYNX address, wallet issuer `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`, repo `bearbaba/relynx`, key prefix `aurora-`, chain `61999`. This is a **single trusted-issuer testnet demonstrator**, not an open community policy. Claim #2 remains individually `ACTIVE` but has revoked ancestor #1, so `can_rely(2)=false` and `can_act(2)=false`; Claim #3 is eligible. The Gate does **not** enforce uniqueness of action keys: it is a receipt ledger with a 100-action cap.

## 4. AI source verification and the digest mismatch fix

RELYNX `review_notice` constructs a **raw.githubusercontent.com** URL using the claim's registered repository, the exact **40-character commit SHA** and the claim key; only `notices/<claim_key>.txt` is authorized. It fetches the data independently inside GenLayer's `prompt_comparative` consensus, checks its full SHA-256 and validates the notice header and scope against the on-chain claim. Valid source reviews may persist `REVOKE`, `KEEP` or `UNVERIFIABLE`.

The deployed contract deliberately returns **`SOURCE_UNAVAILABLE` / `SOURCE_MISMATCH` / `INVALID_SCOPE` without changing stored claim state** (lines in `contracts/relynx_deployed.py` at `review_notice`). Such a call can have a finalized **successful GenVM execution** yet **not** be an admitted source review.

**Previous Console bug:** the `checkStored` branch for `review_notice` returned `ok:true` even when the submitted `notice_sha256` differed from stored `last_notice_sha256`. Therefore a source diagnostic could be falsely shown as verified success.

**Fixed behavior:** [`src/noticeVerification.js`](../src/noticeVerification.js) is now used by [`src/main.js`](../src/main.js). It returns `ok:true` **only** if all of these hold:

1. The finalized readback's `claim_id` matches the submitted claim ID.
2. The stored `last_notice_sha256` **exactly matches** the submitted SHA-256.
3. The persisted `last_decision` is one of `REVOKE / KEEP / UNVERIFIABLE`.
4. For `REVOKE`, claim state must be `REVOKED` and `revocation_sha256` must match; for `KEEP / UNVERIFIABLE`, state must remain `ACTIVE`.

**Otherwise it displays `FINALIZED · notice NOT verified` and keeps the original tx hash available for recheck**, rather than `Transaction successful`. No frontend or API response claims to have independently observed the actual source diagnostic if the transaction result is not available; it only reports the absence of persisted confirmation.

The regression tests at [`tests/noticeVerification.test.mjs`](../tests/noticeVerification.test.mjs) include a finalized digest mismatch, a prior notice digest, missing digest, invalid decision, invalid claim ID, inconsistent revocation and valid decision cases. Run `npm test`, then `npm run build`.

## 5. Reproduce the already signed workflow

1. Open [the live Console](https://relynx-console-project.vercel.app/) on Studionet 61999.
2. Read Claim #2: `ACTIVE`, inherited `can_rely=false`; Consumer Gate `BLOCKED`.
3. Read Claim #3: AI `KEEP`; Gate `ALLOWED`. Original decision TX: [KEEP](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9).
4. Read Claim #1: AI `REVOKE`. Original decision TX: [REVOKE](https://explorer-studio.genlayer.com/tx/0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624).
5. Read Claim #4 `aurora-video-demo-01`: `ACTIVE`, `can_rely=true`, Gate `ALLOWED` (new claim **registration**, not a fresh AI KEEP decision).
6. Read `receipt(2)`: `{receipt_id:2,claim_id:4,action_key:"relynx-video-4-01",actor:"0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb"}`. Video: https://youtu.be/TzSONW6uWb0
7. An authorized wallet may register another unique claim and call `perform_action` after checking eligibility. The creator wallet is allowlisted by the Gate and cannot be impersonated by reviewers.

All writes are signed by the user's wallet. Historical receipts and verdicts are **not** replicated or fabricated in the Console; the UI reads finalized state from live contracts. This project submission claims the integrated Console and separate Gate as new user-facing application work, **not re-credit for the previously accepted RELYNX Intelligent Contract**.
