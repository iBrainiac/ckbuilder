# Project Report — Fiber Fit

**Project:** `apps/fiber-fit`  
**Status:** UI shipped (testnet wallets, mock Fiber pot)  
**Date:** September 2026  
**Stack:** Next.js 14, TypeScript, CCC (`@ckb-ccc/connector-react`), Tailwind CSS  

---

## What I Built

A squad fitness pact app. Friends form a squad, open step challenges, lock a CKB stake (mocked Fiber invoice), check in every day, and let the group confirm the board. Completers get their stake back. Missers' stakes are split among completers.

Live at: [http://localhost:3002](http://localhost:3002) (run `npm run dev` in `apps/fiber-fit`)

This is not an on-chain CKB contract yet. Identity is a CCC wallet. Challenge state is in the browser. Buy-in and payout go through `lib/fiber.ts`, which is a mock until an FNN node is wired.

---

## Product rules (v1)

| Rule | Decision |
|------|----------|
| Who | Small squad that already knows each other |
| Durable object | Squad. Many challenges per squad |
| Metric | Daily steps (target, days, and stake are per challenge) |
| Hit | Check-in on every day. One miss fails the challenge |
| Oracle | The group. Majority of votes cast, not unanimous |
| Abstain | Not a no |
| All hit or all miss | Full refund |
| Tie, reject, or no votes | Full refund |
| Custody | Hub-style mock pot. L1 escrow later |

---

## How It Works

### Identity

The app wraps the tree in `ccc.Provider` (testnet by default, same pattern as NoteBoard). `useSigner()` plus `getRecommendedAddress()` is the member id. No Fiber node is required to open the UI.

### Squads and challenges

`lib/store.ts` keeps squads, challenges, check-ins, votes, and settlements in `localStorage` (`fiber-fit-v1`). Creating a challenge adds the creator to `participantAddresses` (their buy-in). Others call `joinChallenge`, which currently pays a mock invoice then appends their address.

### Heat sheet

`lib/challenge.ts` maps "today" in the challenge timezone onto a day index (`ymdInTz` via `Intl`, calendar diff from `startDate`). Each cell is checked in, missed, or future. Check-in is allowed until the challenge is settled so a start date in the past can still be used to demo a full board.

### Payout math

```
completers = members with a check-in on every day
missers    = everyone else who joined

if completers is empty or equals all joiners:
  each joiner gets stake back
else:
  misserPot = missers.length * stake
  each completer gets stake + misserPot / completers.length
  each misser gets 0
```

The UI shows this as **Pot preview** before anyone settles.

### Confirmation

After the last calendar day (`challengePhase` → `confirming`), joiners vote Confirm or Reject. `tallyVotes` uses majority of votes cast. `settleChallenge` then walks payouts through mock `createPayoutInvoice` / `payInvoice`.

---

## Fiber vs CKB in this app

| Layer | Role now | Role next |
|-------|----------|-----------|
| CCC / CKB testnet | Wallet connect, address, CKB balance display | Same |
| Fiber (`lib/fiber.ts`) | Mock `new_invoice` / `send_payment` shape | Real FNN JSON-RPC or `fiber-js` |
| CKB lock / type script | None | Optional non-custodial pot cell |

Fitness data never touches Fiber or L1. The chain (later the node) only moves the stake.

---

## CKB / Fiber concepts demonstrated

| Concept | Where |
|---------|-------|
| CCC React signer and testnet client | `app/layoutProvider.tsx`, `ConnectWallet` |
| Off-chain app state vs on-chain settlement | `lib/store.ts` vs planned FNN invoices |
| Invoice-shaped buy-in and payout | `lib/fiber.ts` (mock) |
| Group oracle instead of a Type Script | Confirm / Reject on the challenge page |
| Conservation of the pot | `computePayouts` in `lib/challenge.ts` |

---

## Project structure

```
apps/fiber-fit/
  app/
    page.tsx                                      # Create / join squad
    layoutProvider.tsx                            # CCC Provider
    squad/[id]/page.tsx                           # Members, new challenge, list
    squad/[id]/challenge/[challengeId]/page.tsx   # Heat sheet, votes, settle
  components/
    AppShell.tsx
    ConnectWallet.tsx
    HeatSheet.tsx
  lib/
    types.ts
    challenge.ts     # Days, completeness, payouts, vote tally
    fiber.ts         # Mock invoices (replace with FNN)
    store.ts         # localStorage
```

---

## Key design decisions

**Why not a custom CKB contract in v1?**  
The pot is one lock and one unlock. A new lock script would dominate the calendar and is not required to learn Fiber invoices. Hub custody on testnet is enough for friends clicking through the UI.

**Why mock Fiber instead of blocking on `fnn`?**  
The squad/challenge loop is the product. Invoice RPC is a thin client. `lib/fiber.ts` is the seam so UI work did not wait on node ops.

**Why majority instead of unanimous?**  
Unanimous confirmation lets one member block payouts. Majority of votes cast matches a small trusted squad without freezing funds.

**Why localStorage?**  
No backend in this slice. Same-browser wallet switching is enough to test two members. A server plus real Fiber comes after `fnn` is running.

---

## What I Would Do Next

- Run `fnn` on Fiber testnet, open a channel to a public relay, replace `lib/fiber.ts` with real `new_invoice` / `send_payment`
- Persist squads off the browser so a code works across devices
- Optional: Strava / Health as an extra signal; the group remains the oracle
- Optional: L1 escrow cell so the hub cannot spend the pot alone
