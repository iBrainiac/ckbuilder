## Builder Track Weekly Report — Aug–Sep Week 1

**Name:** Hazard  
**Week Ending:** 09-04-2026

---

### Courses Completed

- Read Fiber Network docs on [fiber.world](https://www.fiber.world/) and [fiber.world/docs](https://www.fiber.world/docs): payment channels, HTLCs, multi-hop routing, watchtowers, multi-asset / RGB++ support, Lightning interoperability
- Read the architecture overview: FNN as the reference node, Actor Model, Network Graph pathfinding, onion packets (`fiber-sphinx`), Funding Lock and Commitment Lock in `fiber-scripts`
- Read the developer path: run `fnn` on testnet, connect public relays, JSON-RPC (`new_invoice`, `send_payment`, channel APIs), `fiber-js` WASM for in-browser nodes
- Reviewed the [showcase](https://www.fiber.world/showcase) so we would not clone Audio Player, Fiber Link, or Checkout
- Re-read CCC transaction flow from NoteBoard and xUDT Issuer: `completeInputsByCapacity`, `completeFeeBy`, integer CKB vs Shannon

---

### Key Learnings

- **CKB L1 and Fiber are different layers.** NoteBoard and xUDT Issuer talk to CKB via CCC (cells, locks, indexer). A Fiber app talks to a Fiber Network Node over JSON-RPC. Invoices do not write a cell per tip.
- **A fitness pot only moves money twice (lock, payout).** That is an L1 escrow pattern, not a Fiber micropayment loop. We named the product Fiber Fit after studying Fiber, then chose **native CKB via CCC** for v1. A Fiber node is not required to open or settle a pact.
- **The group is the oracle.** CKB cannot see a workout. Completer = every day sealed. Miss = any missed day, or any unsealed day at confirm time.
- **Payout rule (integer CKB):** each completer receives `stake + floor(missedStakes / completerCount)`. Remainder `missedStakes % completerCount` goes to the first completer by member id. Nobody completes, or nobody misses: everyone is refunded their stake.
- **Minimum cell is 62 CKB.** Stakes below that cannot live as a secp256k1 cell. No dust.

---

### Practical Progress

- Locked product rules for Fiber Fit: private squad, many challenges per squad, same integer stake, majority confirm, creator holds the pot until a contract exists.
- **Started Fiber Fit (`apps/fiber-fit`)** — Next.js 14, TypeScript, CCC, Tailwind. Dev on port 3002.
  - Landing at `/` (how a pact runs, fibers, vault copy). App at `/app` (Home, Board, Squads, Vault). CCC provider only under `/app`.
  - Connect CKB testnet wallet (JoyID and other connector-react wallets).
  - **Lock and open** sends integer CKB to the squad pot (`lib/ckb.ts`). Vault **Available** is live `signer.getBalance()`.
  - Local pact loop in `localStorage` (`fiber-fit-v3`): create challenge, proof, Seal, Miss, majority confirm, settlement math in `lib/settlement.ts`.
  - Confirm can pay other members who have addresses. Self is skipped.
- Squads in this week are still local. Invite links and a shared database are next week.

---

### Articles

- Catalog entry already published: [Fiber Network: Nervos's Answer to Instant, Near-Free Crypto Payments](https://paragraph.com/@hazardcryptos/fiber-network-nervoss-answer-to-instant-near-free-payments) (2026-08-06). Repo card: `articles/2026-08-06-ckb-fiber-network-instant-near-free-payments.md`.
- Started a longer technical draft from fiber.world docs (channels, Scripts, invoices, FNN / `fiber-js`). Finished in week 2.

---

### Environment

- Fiber Fit UI on [http://localhost:3002](http://localhost:3002)
- CCC testnet wallets. Faucet: [faucet.nervos.org](https://faucet.nervos.org/)
- Reports path: `ckbuilder-journey/reports/august-sept/`
