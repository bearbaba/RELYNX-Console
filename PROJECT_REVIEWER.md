# RELYNX Console — GenLayer Projects Reviewer Guide

**Project:** RELYNX Console  
**Date:** October 30, 2026  
**Demo:** https://relynx-console.vercel.app/  
**New narrated/subtitled demo video:** https://youtu.be/TzSONW6uWb0  
**Source:** https://github.com/bearbaba/RELYNX-Console  
**Network:** GenLayer Studionet, chain 61999 (testnet only)

## What is new in this Project submission?

**RELYNX's underlying Intelligent Contract was submitted separately as an IC contribution. This Project submission is not a resubmission or new claim of credit for that contract.** RELYNX Console is a subsequent user-facing web application integrating the previously deployed RELYNX primitive and its distinct deployed Consumer Gate:

- A wallet-connected frontend to register an issuer claim, browse finalized claims, expose dependency-derived `can_rely`, review pinned notices, and query gate policy;
- A separate Consumer Gate contract that reads RELYNX on each action, checks a specific trusted issuer/repository/key prefix, denies ineligible claims, and writes a durable actor-bound action receipt;
- A guided, signed transaction flow that preserves transaction hash, tracks finality and execution, and reads the resulting claim/receipt back from the deployed contracts;
- An allowlisted server-side finalized-state API to avoid SDK/runtime incompatibility during browser reads.

**The incremental Project value** is a reproducible end-user workflow and observable cross-contract consequence, not a second claim of novelty for previously accepted consensus code.

## What GenLayer actually adjudicates

RELYNX's `review_notice` evaluates a natural-language withdrawal/correction in an immutable commit-pinned GitHub notice. The Intelligent Contract checks source scope and digest, then uses the GenLayer Equivalence Principle (`prompt_comparative`) to distinguish `REVOKE`, `KEEP`, and `UNVERIFIABLE`. The accepted result changes whether dependent claims can be relied upon. A Consumer Gate then **enforces** the resulting effective trust state through cross-contract reads. New `register_claim` operations alone do **not** constitute a fresh AI verdict; they create wallet-issued attestations.

## Two distinct sets of signed evidence

### A. Historical GenLayer consensus decision and downstream consequences

1. **Claim #1**: notice review returned `REVOKE`, persisted `REVOKED`: [GenLayer transaction](https://explorer-studio.genlayer.com/tx/0xe4d5c3ea361293152e406326b029ed41234251bdf6c108e8dfa9cd37f0f57624).
2. **Claim #2**: individually `ACTIVE`, but depends on #1. Therefore `can_rely(2)=false`, and Consumer Gate `can_act(2)=false`.
3. **Claim #3**: a separate pinned notice resulted in `KEEP`; remains `ACTIVE` and `can_rely(3)=true`: [GenLayer transaction](https://explorer-studio.genlayer.com/tx/0x223424f06e1b73e3026c7f2db139a4b3fe59c298b12da713952a268995deaaf9).
4. The Consumer Gate successfully denied an ineligible action on #2 and stored a receipt for an eligible action on #3: [accepted action transaction](https://explorer-studio.genlayer.com/tx/0x4fe51e9fb441b9e68aee42619d1e008e05809560d88f02a8a52e5ad6cb2f29e8). See [full live evidence ledger](docs/CONSUMER_LIVE_EVIDENCE.md).

### B. New RELYNX Console signed-video flow

The Oct 30 video records a **new wallet-signed Claim #4 registration** from the web app, successful on-chain eligibility for #4, a separately signed Consumer Gate action and persisted **Receipt #2**.

Follow-up live API verification (Oct 30):
- `claim_count() = 4`
- `claim_status(4).state = ACTIVE`; `can_rely = true`, `parent_a=0`, `parent_b=0`
- `claim_status(4).key = aurora-video-demo-01`
- `can_act(4) = true`
- `receipt(2) = {"receipt_id":2,"claim_id":4,"action_key":"relynx-video-4-01","actor":"0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb"}`
- `receipt_count() = 3` at latest verification; a third receipt with the **same claim/action key** exists. The demo receipt #2 remains valid, but V1 does not enforce idempotency/unique action keys.

**Do not confuse** the new Claim #4 registration with the prior AI-adjudicated `REVOKE`/`KEEP` outcomes. Those prior outcomes are provided separately as verifiable on-chain evidence.

## How to reproduce (read-only / wallet)

1. Open https://relynx-console.vercel.app/.
2. Inspect Claims #2 and #3: the Consumer Gate denies #2 and allows #3. On-chain read-only browsing requires no wallet.
3. Connect a compatible wallet to **Studionet chain 61999**. The current Consumer Gate trusts only issuer `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb`, repo `bearbaba/relynx`, and `aurora-`-prefixed keys; arbitrary community wallets cannot use this specific gate.
4. To reproduce the write path on the trusted test account: register an independent test claim using a **new unique** `aurora-` key, inspect the new ID, continue to Consumer Gate, confirm `ALLOWED`, sign an action reference and inspect the new on-chain receipt. The frontend never auto-signs transactions.
5. For a real notice review, prepare the exact repository-commit-pinned notice and SHA-256; incorrect data fails. A valid `REVOKE` is irreversible; do not run it against valuable test cases without preparing the evidence correctly.

## Contracts and boundaries

- **RELYNX**: https://explorer-studio.genlayer.com/address/0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa
- **Consumer Gate**: https://explorer-studio.genlayer.com/address/0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b
- A registered issuer's GitHub-repository control is an assertion, not cryptographically verified identity.
- The current Consumer Gate is an allowlist-bound **demo**, not open multi-tenant community authorization. It records testnet action receipts, not token transfers, escrow or real-world access rights.
- **No security audit or mainnet readiness is claimed.** MetaMask domain/signing warnings have been reported for review: https://github.com/MetaMask/eth-phishing-detect/issues/307011. Do not imply the alert has been resolved.

## Reviewer focus

Please review the **new integrated user experience** and verify that the on-chain verdicts have an actual cross-contract consequence. We are explicitly separating this Projects application from the earlier accepted standalone Intelligent Contract contribution.
