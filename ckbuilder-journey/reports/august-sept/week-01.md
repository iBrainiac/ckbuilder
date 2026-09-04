## Builder Track Weekly Report — Aug–Sep Week 1

**Name:** Hazard  
**Week Ending:** 09-04-2026

---

### Courses Completed

- Read Fiber Network docs on [fiber.world](https://www.fiber.world/) and [fiber.world/docs](https://www.fiber.world/docs): payment channels, HTLCs, multi-hop routing, watchtowers, multi-asset / RGB++ support, Lightning interoperability
- Read the architecture overview: FNN as the reference node, Actor Model, Network Graph pathfinding, onion packets (`fiber-sphinx`), Funding Lock and Commitment Lock in `fiber-scripts`
- Read the developer path: run `fnn` on testnet, connect public relays, JSON-RPC (`new_invoice`, `send_payment`, channel APIs), `fiber-js` WASM for in-browser nodes
- Reviewed the [showcase](https://www.fiber.world/showcase) so we would not clone Audio Player, Fiber Link, or Checkout
- Re-read CCC transaction flow from the existing NoteBoard / xUDT Issuer apps: `completeInputsByCapacity`, `completeFeeBy`, integer CKB vs Shannon

---

### Key Learnings

- **CKB L1 and Fiber are different layers.** NoteBoard and xUDT Issuer talk to CKB via CCC (cells, locks, indexer). A Fiber app talks to a Fiber Network Node over JSON-RPC. Invoices do not write a cell per tip.
- **A 5-day fitness pot only moves money twice (lock, payout).** That is an L1 escrow pattern, not a Fiber micropayment loop. We named the product Fiber Fit after studying Fiber, then chose **native CKB via CCC** for v1. A Fiber node is not required to open or settle a pact.
- **The group is the oracle.** CKB cannot see a workout. v1 records what the squad seals. Completer = every day sealed. Miss = any missed day, or any unsealed day at confirm time.
- **Payout rule (integer CKB):** each completer receives `stake + floor(missedStakes / completerCount)`. Remainder `missedStakes % completerCount` goes to the first completer by member id. Nobody completes, or nobody misses: everyone is refunded their stake.
- **Minimum cell is 62 CKB.** Stakes below that cannot live as a secp256k1 cell. No dust.
- **Identity can be a signed CKB address.** No email. `signMessage` plus an HMAC-bound nonce, then a 7-day session cookie (`ff_session`).
- **A shared roster needs a database.** `localStorage` cannot show the same squad on two phones. Postgres holds users, squads, members, and invite codes. Challenges still stay on-device this week.
- **Custody this week is creator-as-escrow.** Locks go to the creator’s address. A pot contract is the next planning slice, not this week.

---

### Practical Progress

- **Shipped Fiber Fit (`apps/fiber-fit`)** — Next.js 14, TypeScript, CCC (`@ckb-ccc/connector-react`), Tailwind. Dev: `npm run dev` on port 3002
  - [http://localhost:3002](http://localhost:3002) landing (wordmark, how a pact runs, fibers, vault copy)
  - [http://localhost:3002/app](http://localhost:3002/app) the app (Home, Board, Squads, Vault)
- **Wallet + chain**
  - CCC provider only under `/app` (landing stays light)
  - Connect JoyID / other connector-react wallets on CKB testnet
  - **Lock and open** sends integer CKB to the squad pot (`lib/ckb.ts`)
  - Vault **Available** is live `signer.getBalance()`, not a mock
  - Confirm can send outbound payouts to members who have addresses (self is skipped)
- **Local pact loop** (Zustand, persist key `fiber-fit-v3`)
  - Empty first run. No mock users
  - Create a challenge (fiber, bar, days, stake ≥ 62 CKB). Roster is snapshotted on `memberIds`
  - Proof, Seal, Miss. Majority confirm. Settlement math in `lib/settlement.ts`
  - Challenges, check-ins, and settlements stay on this device
- **Hosted join (code written, DB not running on this machine)**
  - Schema: `users`, `squads`, `members` (Drizzle + `postgres`)
  - APIs: `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`, `/api/me`, `/api/squads`, `/api/squads/join`, `/api/invite/[code]`
  - UI: connect → sign in → create squad or open `/app/join/[code]`; Squads shows roster + copy invite link
  - Blocked locally: Docker is not installed; Homebrew Postgres failed on macOS 13. Schema was not pushed. Sign-in and shared squads need a live `DATABASE_URL` (local Postgres or a host like Neon if the app goes to Vercel)

---

### Articles

- **Finished as a published catalog entry:** [Fiber Network: Nervos's Answer to Instant, Near-Free Crypto Payments](https://paragraph.com/@hazardcryptos/fiber-network-nervoss-answer-to-instant-near-free-payments) (2026-08-06). The repo file `articles/2026-08-06-ckb-fiber-network-instant-near-free-payments.md` is the usual Summary + Key Points card, matching the other Paragraph posts.
- **Drafted this week (unpublished):** [Fiber Network: Payment Channels on Nervos CKB](../../../articles/2026-09-04-fiber-network-payment-channels-on-ckb.md). Full blog draft from fiber.world docs (channels, Funding/Commitment Locks, TLC, invoices, FNN / `fiber-js`). No Paragraph link yet.

---

### Environment

- Fiber Fit UI on [http://localhost:3002](http://localhost:3002)
- CCC testnet wallets (JoyID and other connector-react wallets)
- Faucet: [faucet.nervos.org](https://faucet.nervos.org/)
- Postgres / `drizzle-kit push` not running on this laptop yet
- Reports path: `ckbuilder-journey/reports/august-sept/`
- App README: `apps/fiber-fit/README.md`
