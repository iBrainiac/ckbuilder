## Builder Track Weekly Report — Aug–Sep Week 3 (in progress)

**Name:** Hazard  
**Week Ending:** 09-18-2026  
**Status:** Projection. Nothing in this file is done until we tick it here after we ship it.

This week is for the next Fiber Fit slices. Full checklist lives in the app remaining-work plan. Below is what we intend to add, in order.

---

### Planned — shared challenges

Squads already sync. Challenges do not. Two wallets on one invite still see different boards.

- Persist challenges, check-ins, and confirmations on the server (tied to squad id and member address).
- Each member seals only their own row. Remove tap-to-seal-others from the hosted board.
- Each member sends **their own** stake to the pot (still the creator’s address this week). Show who has locked. No seal until locked.
- Stop using `localStorage` as the source of truth for the board.

**Done when:** two wallets, one invite, same challenge, same cells.

---

### Planned — host the app so anyone can open an invite

PGlite is this laptop only.

- Deploy Next to Vercel (root `apps/fiber-fit`).
- Hosted Postgres (Neon or Vercel Postgres). Pooled `DATABASE_URL`. Strong `SESSION_SECRET`. `NEXT_PUBLIC_IS_MAINNET=false`.
- Production must not fall back to `.data/fiberfit` if the cloud DB is down.
- Smoke: live URL, wallet A creates a squad, wallet B on another phone joins.

**Done when:** someone who is not on this machine can use `/app/join/CODE`.

---

### Planned after week 3 (not this file’s “done” bar)

- **Pot contract on testnet.** CKB Script holds the challenge pot. Creator cannot drain it. App lock/settle talks to the Script. Two-person testnet pact on explorer.
- **Mainnet** only after that testnet pact. New deploy tx, `NEXT_PUBLIC_IS_MAINNET=true`, small live stake (62 CKB) before announcing.

Fiber invoices, HealthKit, and extra squad settings stay later. A pact is two money moves; L1 escrow is the right pot, not Fiber.

---

### Courses / environment (fill in as the week runs)

- Courses completed: _to add_
- Key learnings: _to add_
- Practical progress: _move items up from Planned when they ship_
- Environment: still [http://localhost:3002](http://localhost:3002) until Vercel is live
