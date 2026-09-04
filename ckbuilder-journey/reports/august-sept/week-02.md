## Builder Track Weekly Report — Aug–Sep Week 2

**Name:** Hazard  
**Week Ending:** 09-11-2026

---

### Courses Completed

- Applied last week’s CCC notes to a real sign-in and pay flow: `signMessage`, recommended address, live balance, outbound CKB transfers
- Wired Drizzle + a Postgres-shaped schema (`users`, `squads`, `members`) so a roster can live off `localStorage`
- Used a file-backed Postgres (PGlite) when Docker / Homebrew Postgres was not available on this Mac

---

### Key Learnings

- **Identity can be a signed CKB address.** No email. HMAC-bound login message, then a 7-day session cookie (`ff_session`). If the signature identity looks like `ckt` / `ckb`, it must match the address in the message.
- **A shared roster needs a database.** Two phones cannot share a squad from `localStorage`. Invite code + server members is the join path, not “add member by name.”
- **The laptop is not a host.** PGlite in `.data/fiberfit` unblocks local sign-in. A public invite still needs hosted Next + hosted Postgres (week 3).
- **Custody is still creator-as-escrow.** Locks go to the creator’s address. A pot Script is planned, not this week.
- **Challenges are still per-device.** Same invite, different boards, until challenges are stored next to squads.

---

### Practical Progress

- **Wallet sign-in and squads**
  - APIs: `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`, `/api/me`, `/api/squads`, `/api/squads/join`, `/api/invite/[code]`
  - App gate: connect wallet → sign in → load squads. Create squad or paste a code.
  - Join route `/app/join/[code]`. Squads screen: roster + copy invite link. Pot address is read-only (creator).
- **Local database**
  - Sign-in was failing with `Failed query: insert into "users"` because nothing was listening on Postgres and tables did not exist.
  - Fallback: if `DATABASE_URL` is unset or localhost is down, use PGlite and create tables on first use.
- **Docs**
  - Product README in `apps/fiber-fit/README.md` (what a pact is, how money moves, who gets paid).
  - Remaining-work plan for later slices (shared challenges, Vercel, contract, mainnet).
- **Article**
  - Finished the technical Fiber draft: [Fiber Network: Payment Channels on Nervos CKB](../../../articles/2026-09-04-fiber-network-payment-channels-on-ckb.md). Unpublished. No Paragraph `link` yet.

---

### Environment

- Fiber Fit on [http://localhost:3002](http://localhost:3002) / [http://localhost:3002/app](http://localhost:3002/app)
- Local file DB: `apps/fiber-fit/.data/fiberfit`
- Testnet faucet: [faucet.nervos.org](https://faucet.nervos.org/)
- App README: `apps/fiber-fit/README.md`
