# RELYNX Console

**A GenLayer-powered trust and claim verification application.** When verified evidence revokes an upstream claim, downstream trust and consumer permissions must change accordingly.

**Live App:** https://relynx-console.vercel.app/ · **Signed Demo Video:** https://youtu.be/TzSONW6uWb0 · **Reviewer Guide:** [PROJECT_REVIEWER.md](PROJECT_REVIEWER.md)

## What this project adds

RELYNX Console is a user-facing web application integrated with two already deployed GenLayer Intelligent Contracts. It is distinct from the standalone [RELYNX Intelligent Contract](https://github.com/bearbaba/RELYNX), which was previously submitted and reviewed separately. **This project does not claim the original consensus contract as a newly created primitive.**

- Explore finalized claims, issuer commitments and dependency-based eligibility.
- Compare GenLayer AI-consensus decisions from commit-pinned notices: `REVOKE`, `KEEP`, `UNVERIFIABLE`.
- See how a revoked ancestor makes an otherwise ACTIVE dependent claim not reliable.
- Check a separate Consumer Gate's issuer/source policy and sign a gate action when eligible.
- Track wallet signing, transaction finality, execution outcome and real on-chain receipts.
- Review verified testnet evidence without connecting a wallet.

## Verified Studionet demo

- **Chain:** GenLayer Studionet `61999`
- **RELYNX contract:** `0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa`
- **Consumer Gate:** `0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b`
- **Claim #1:** revoked after a pinned correction notice passed GenLayer consensus.
- **Claim #2:** ACTIVE but not reliable because it depends on Claim #1; Gate BLOCKED.
- **Claim #3:** GenLayer KEEP control case; reliable and Gate ALLOWED.
- **Claim #4:** newly signed through this web app; ACTIVE, eligible. A separately signed action created **Receipt #2** for action `relynx-video-4-01`, verified against on-chain state. At subsequent inspection, receipt count was 3, with an additional duplicate action reference; idempotency is not enforced in V1.

[Signed project demonstration](https://youtu.be/TzSONW6uWb0) · [Step-by-step verification and original consensus evidence](PROJECT_REVIEWER.md)

## Run the web application

Requires Node.js 22+.

```bash
npm install
npm run dev
```

```bash
npm run build
```

Deploy the **repository root** as a Vite project on Vercel. `api/read.js` and `api/tx.js` are Vercel serverless endpoints. No production credentials or wallet keys are needed; users sign with their own installed wallet extension.

## Architecture

```text
src/main.js + src/style.css + index.html
    | signed transactions (genlayer-js)
    v
RELYNX (original IC) --------> GenLayer AI consensus on pinned notice
    | can_rely + claim_status
    v
Consumer Gate (independent contract) --perform_action--> Persistent receipt

api/read.js -> allowlisted finalized-state reads
api/tx.js   -> transaction status and execution receipt checks
```

The original contracts, transaction evidence, and trust boundaries are documented in the earlier [RELYNX source repository](https://github.com/bearbaba/RELYNX). This repository maintains the **distinct Console frontend and integration layer**.

## Security and limitations

- **Testnet only.** No token transfers, escrow or real resource access.
- Registered GitHub repository ownership is a wallet assertion, not an independently verified identity.
- The currently deployed Consumer Gate enforces a specific trusted issuer/repo/key prefix, **not general community permissionless authorization**; other wallets can verify results read-only.
- The original AI decision is attached to a verified notice review. **Registering a new claim is not itself AI adjudication.**
- Repeating an eligible action key can store additional receipts; the demonstration does not establish idempotency.
- This is experimental software, not a security audit or Mainnet release. A MetaMask warning is under [review](https://github.com/MetaMask/eth-phishing-detect/issues/307011).

MIT license for original RELYNX project: https://github.com/bearbaba/RELYNX/blob/main/LICENSE
