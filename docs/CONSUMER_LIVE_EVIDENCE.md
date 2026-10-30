# RELYNX Consumer Gate — Live Studionet Integration Evidence

Date: 2026-10-19. Network: GenLayer Studionet (chain 61999).
This ledger records user-provided GenLayer Studio screenshot/readbacks and Explorer transaction detail. It does not assert independently inspected RPC data.

## Contracts

- Original RELYNX: `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`.
- Consumer Gate: `0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b`.
- [Consumer deployment](https://explorer-studio.genlayer.com/tx/0xeb2ac841f66f1dd635f48a2d3f3c702d605bb0068cc1a62f3bf42979835aa454): FINALIZED, GenVM SUCCESS, consensus Accepted.

## Live reads — independently submitted by the user

- `policy()`: source RELYNX address above; issuer `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`, repository `bearbaba/relynx`, key prefix `aurora-`, chain `61999`.
- `receipt_count()`: **0 before action writes**.
- `can_act(2)`: **false**. Claim #2 is structurally ACTIVE but inherits ineligibility from revoked Claim #1.
- `can_act(3)`: **true**. Claim #3 is ACTIVE with KEEP; this positive result validates the trust-checked cross-contract view path, not merely fail-closed rejection.

## Write gate A — expected rollback for Claim #2

- GenLayer Studio screenshot hash: `0xf2ad25eef8d6bcdead5d4784c373f3d4faecf062cc1fc9d94f7817b1854e27eb`.
- Method: `perform_action(2, "blocked-v1")`.
- Studio at capture: `Status: ACCEPTED`, **`Result: ERROR`**, output `None`.
- Three validator entries marked Agree show `[rollback] claim not eligible`; two remaining entries were cancelled after quorum and shown Idle. **Do not describe this as five successful identical validator responses**.
- The error is the **expected authorization denial**, not a successful receipt-producing execution.
- This screenshot alone does not show `FINALIZED`; check the Explorer lifecycle if finality needs to be cited.
- Still require a post-denial `receipt_count()` readback to directly confirm unchanged storage.

## Write gate B — expected successful action for Claim #3

- [GenLayer Explorer transaction](https://explorer-studio.genlayer.com/tx/0x4fe51e9fb441b9e68aee42619d1e008e05809560d88f02a8a52e5ad6cb2f29e8).
- Method: `perform_action(3, "allowed-v2")`.
- Explorer detail supplied by user: **FINALIZED**, type Call, from `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` to Consumer Gate, nonce `383`, created Oct 19, 2026 8:06:28 PM (Explorer display).
- Execution Mode Normal, Rotation Count 0, Initial Validators 5, Consensus Result **Accepted**.
- GenVM Execution Result **SUCCESS**, Result Code Return, **Return Value `1`**. Stdout/stderr empty.
- Receipt ID 1 was returned by the successful action. **Subsequent accepted Studio readbacks verify receipt persistence and its exact contents**, as recorded below.

## Final post-write storage verification — PASSED (2026-10-19)

The user supplied accepted GenLayer Studio **Read Methods** after the attempted denial and successful write:

- `receipt_count()`: **`1`**.
- `receipt(1)`: **`{"action_key":"allowed-v2","actor":"0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb","claim_id":3,"receipt_id":1}`**.

The receipt ID, claim, action key and actor all match the successful [Consumer Gate write](https://explorer-studio.genlayer.com/tx/0x4fe51e9fb441b9e68aee42619d1e008e05809560d88f02a8a52e5ad6cb2f29e8). The initial count was 0, the rejected Claim #2 write rolled back with `claim not eligible`, and the later successful Claim #3 write created the **sole observed stored receipt**, ID 1. A separate count check immediately between the two writes was not supplied.

**End-to-end integration demonstrated:** RELYNX comparative consensus `REVOKE` and `KEEP`, inherited ineligibility of dependent Claim #2, policy-bound cross-contract source views, denial of a source-ineligible action, successful eligible action, and persisted actor-bound receipt on a separate consumer contract. Evidence is attributed to user-supplied Studio and Explorer outputs; this is an experimental testnet demonstration, not an independent security audit.
