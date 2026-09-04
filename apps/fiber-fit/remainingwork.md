# Fiber Fit — remaining work

Living plan. Check boxes as we finish them. Do not start the next slice until the current one is usable.

Dev: [http://localhost:3002](http://localhost:3002) (landing) · [http://localhost:3002/app](http://localhost:3002/app)

---

## What is already shipped

- Landing at `/`. App at `/app`. CCC wallet only under `/app`.
- Identity: CKB address after `signMessage`. Session cookie `ff_session` (7 days). No email.
- Squads: create, invite code, join at `/app/join/[code]`, shared roster (Drizzle).
- Local data: file Postgres in `.data/fiberfit` (PGlite) when `DATABASE_URL` is unset or localhost is down.
- Challenges, seals, confirm, settlement **math** on this device (`localStorage` key `fiber-fit-v3`).
- **Lock and open** sends integer CKB (≥ 62) to the squad pot. Vault is live `signer.getBalance()`.
- Confirm can pay other members who have addresses. Self is skipped.
- Pot today is the **creator’s address** (custodial escrow). Not a contract.

Product rules we keep unless this file says otherwise:

- Same integer CKB stake for every member of a challenge.
- Completer = every day sealed. Miss = any miss, or any unsealed day at confirm.
- Completers get `stake + floor(missedStakes / completerCount)`. Remainder to first completer by member id.
- Nobody completes, or nobody misses: everyone is refunded stake.
- The squad is the oracle. CKB cannot see a workout.

---

## Slice 1 — Shared challenges (next)

Squads already sync. Challenges do not. Two phones on the same invite still see different boards.

**Goal:** one challenge, one board, every member only seals themselves.

- [ ] Tables: `challenges`, `checkins`, `confirmations` (and maybe `settlements`). Tie them to `squads.id` and member `address`.
- [ ] APIs: create challenge, list by squad, set proof, seal self, miss self, confirm, read board.
- [ ] Remove or hide board tap-to-seal **other** people. That is local-demo only.
- [ ] Block adding members after a challenge is live (roster snapshot already exists on `memberIds`).
- [ ] After lock, persist `lockTxHash` on the server so every client sees it.
- [ ] Stop treating `localStorage` as source of truth for challenges. Keep it as cache at most.
- [ ] Empty / error / offline states: do not flash “no squad” before fetch finishes.

**Lock money in this slice (still no contract):**

- [ ] Each member sends **their own** stake tx to the pot address (creator, for now). Not “creator pays for everyone.”
- [ ] Challenge stays `open` only after that member’s lock tx is in. Show who has locked and who has not.
- [ ] Do not let someone seal days until they have locked.

Done when: two wallets, one invite, same challenge, each person seals only their row, both see the same cells.

---

## Slice 2 — Hosting so anyone can open a link

Local PGlite is one machine. A phone cannot see that file. Public access needs a hosted Next app plus a hosted Postgres.

**Goal:** `https://<our-domain>/app/join/CODE` works for a second person on another device.

### App host (Vercel)

- [ ] New Vercel project rooted at `apps/fiber-fit` (or monorepo with that as the app directory).
- [ ] Env on Vercel:
  - `DATABASE_URL` — pooled Postgres URL (Neon `-pooler` or Supabase pooler).
  - `SESSION_SECRET` — long random string, not `dev-only-change-me-in-production`.
  - `NEXT_PUBLIC_IS_MAINNET` — `false` until we flip to mainnet.
- [ ] Confirm `secure` cookies on HTTPS (already `secure` when `NODE_ENV === production`).
- [ ] Custom domain later (optional). Default `*.vercel.app` is enough for the first public invite.

### Database host (Neon or Vercel Postgres)

- [ ] Create an empty Postgres database.
- [ ] Push schema (`drizzle-kit push` or a migration) against that URL. Do not rely on PGlite in production.
- [ ] Production `getDb()` must **not** fall back to `.data/fiberfit` if `DATABASE_URL` fails. Fail the request instead.
- [ ] Keep PGlite for laptop-only. Document: unset or comment `DATABASE_URL` locally; set it on Vercel.

### After deploy

- [ ] Smoke: wallet A creates squad on the live URL, copies invite, wallet B (other phone/browser) joins, both see the roster.
- [ ] Then repeat for a challenge once slice 1 is live on that host.
- [ ] Landing OG / title already exist. Recheck the live preview card.
- [ ] Faucet link stays testnet until mainnet.

Done when: someone who is not on this laptop can join from the invite URL without our `.data` folder.

---

## Slice 3 — Pot contract (testnet first)

Do not write mainnet bytecode until testnet has locked, sealed, and paid out for a real two-person pact.

**Why a contract:** today the creator can spend the pot. Completer payouts also leave from the creator’s wallet. Friends may accept that. Public use should not.

**What the contract is:** a CKB lock (and maybe type) Script that holds one challenge pot. Members lock CKB **into cells this script controls**. Settlement spends those cells to completers by the rules in `lib/settlement.ts`. The chain still cannot see sit-ups. The squad’s confirmations remain the oracle; the script only enforces **who may be paid how much after a valid close**.

### Design (lock before Rust)

- [ ] Write a one-page spec in this repo (or a section below as we go): inputs, args, who can lock, who can settle, refund cases, min 62 CKB / cell.
- [ ] One pot per challenge (not one pot per squad forever), unless the spec says otherwise.
- [ ] Args must bind: challenge id (or type-script unique id), stake amount, member lock hashes, day count, start, settle rules.
- [ ] Majority confirm: decide how that appears on-chain (signed messages in witnesses vs a small “close” tx that the app builds after `confirmations` reach majority). Prefer the smallest Script that matches v1 rules.
- [ ] Remainder CKB (`missedStakes % completerCount`) to first completer by stable member order. Encode that order on-chain so it cannot change after lock.
- [ ] Nobody completes / nobody misses: refund each locker their stake (minus fees, spelled out).
- [ ] Creator cannot drain mid-challenge.
- [ ] Late joiner cannot lock after the challenge is open (same as app rule).

### Build and testnet deploy

- [ ] New crate or Capsule/ckb-script project under this repo (e.g. `contracts/fiber-fit-pot`).
- [ ] Unit tests for lock, reject-wrong-payout, reject-early-drain, refund paths.
- [ ] Deploy Script to **CKB testnet**. Record `code_hash`, `hash_type`, deploy tx, and cell dep in app config (`lib/ckb.ts` or env).
- [ ] App: pot address / lock script comes from the contract, not `creatorAddress`.
- [ ] App: each member’s lock tx creates/updates a pot cell the Script accepts.
- [ ] App: confirm builds the settlement tx the Script accepts (payouts to member addresses).
- [ ] Two-wallet testnet pact end to end. Paste both lock txs and the settle tx in the weekly report.

Done when: testnet explorer shows lock cells held by the Script, then a settle tx that pays completers without the creator’s personal wallet as the source of the pot.

---

## Slice 4 — Mainnet

Only after slice 3 has been used on testnet with real testnet CKB.

- [ ] Audit the Script and the settle tx builder. At minimum: second-person review + the unit tests above. If the pot will hold more than toy amounts, get an external look.
- [ ] Mainnet deploy of the **same** Script (new tx, new cell dep). Never reuse testnet `code_hash` blindly; record mainnet deploy separately.
- [ ] Vercel: `NEXT_PUBLIC_IS_MAINNET=true`. Point CCC at mainnet. Hide or swap the testnet faucet.
- [ ] Confirm addresses are `ckb1…`. Do not mix testnet `ckt1…` members into a mainnet pot.
- [ ] Fresh Postgres (or a clear env) so testnet invite codes and challenges are not treated as mainnet state.
- [ ] One small-stake live pact (friends, 62 CKB) before announcing.
- [ ] Explorer links use `https://explorer.nervos.org` (already switched by `ckb1` prefix in `explorerTxUrl`).

Done when: a mainnet invite works, locks sit in the mainnet Script, settle pays on mainnet, and the weekly report has the deploy tx.

---

## Later (not blocking the slices above)

- Fiber Network invoices for the pot. A pact is two money moves (lock, payout). L1 escrow is the right tool. Do not block on `fnn`.
- Strava / HealthKit as extra signal. The squad stays the oracle.
- Display names edit, leave squad, kick (creator only), rotate invite code.
- Challenge history after settle, shareable board image.
- Notifications (invite opened, day not sealed).
- Publish the Fiber article (`articles/2026-09-04-fiber-network-payment-channels-on-ckb.md`) on Paragraph and add the `link` field.

---

## Order we will actually work

1. Slice 1 — shared challenges + per-member lock (testnet, local or hosted DB).
2. Slice 2 — Vercel + Neon so an invite works off this laptop. Can start the Vercel project in parallel once slice 1 APIs exist, but public invites are useless until challenges sync.
3. Slice 3 — pot Script on testnet, wire the app to it.
4. Slice 4 — mainnet Script + `NEXT_PUBLIC_IS_MAINNET`.

When a slice is done, tick its boxes here and add a short “done / date / link” line under that slice. Do not delete the plan; we want the history.
