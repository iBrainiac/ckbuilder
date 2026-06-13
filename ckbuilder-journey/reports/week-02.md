## Builder Track Weekly Report — Week 2

**Name:** Hazard  
**Week Ending:** 05-17-2026

---

### Courses Completed

- Studied CCC (`@ckb-ccc/connector-react`) documentation and API:
  - `ccc.Transaction.from()` — building transactions from outputs and outputsData
  - `tx.completeInputsByCapacity(signer)` — automatic live cell selection
  - `tx.completeFeeBy(signer, feeRate)` — automatic fee calculation
  - `client.findCells()` — querying live cells from the indexer by lock or type script
- Studied the **Secp256k1Blake160 lock script** — how it uses `args` as the public key hash to control cell ownership
- Learned about **burn addresses** — all-zero lock args that correspond to no private key, making cells permanently unspendable
- Read about wallet connectors supported by CCC: JoyID, MetaMask (EIP-6963), UniSat, OKX
- Published first article: [How to Mine CKB: The Complete Beginner's Guide to Mining on Nervos](https://paragraph.com/@hazardcryptos@gmail.com/how-to-mine-ckb-the-complete-beginners-guide-to-mining-on-nervos)

---

### Key Learnings

- **1 CKB = 1 byte of on-chain storage** is not just a concept — it has direct implications for app design. Every cell's `capacity` must be at least equal to its total byte size. This means the cost of storing data is directly calculable before submitting a transaction:
  ```
  capacity = cell_overhead (61 bytes) + len(data bytes)
  ```

- Understood that CKB transactions do not subtract from account balances — they **consume specific live cells and create new live cells**. The fee is the difference between total input capacity and total output capacity.

- Learned the difference between a transaction hash and finality:
  ```
  tx hash returned → transaction submitted (not yet committed)
  get_transaction → status: committed → finality confirmed
  ```

- The burn address pattern (`args = 0x0000000000000000000000000000000000000000`) is a deliberate design choice for permanent storage. Because no private key corresponds to those args, the cell can never be spent. This is stronger than a smart contract "ownership renounce" because it is enforced at the protocol level by the lock script itself.

---

### Practical Progress

- **Built and deployed CKB NoteBoard (`apps/walletconn`)** — a Next.js + TypeScript app that writes short messages permanently on CKB testnet:
  - Each note is stored as UTF-8 JSON encoded to hex in a cell's `outputsData` field
  - Note schema: `{ a: authorAddress, c: content, t: unixTimestampMs }`
  - The cell is locked with a burn address (`Secp256k1Blake160`, all-zero args) — permanently unspendable
  - Cost estimate displayed live before submission: `61 + len(note bytes)` CKB
  - Feed fetches all note cells from the CKB indexer and decodes them client-side
  - Wallet support: JoyID, MetaMask, UniSat, OKX via CCC connector

- **Key transaction submitted on testnet:**
  - Note posted: confirmed on [Pudge Explorer](https://pudge.explorer.nervos.org)

- **App structure:**
  ```
  apps/walletconn/
    lib/noteBoard.ts        # submitNote, fetchNotes, estimateCkb
    components/NoteForm.tsx
    components/NoteCard.tsx
    components/ConnectWallet.tsx
  ```

---

### Environment

- Next.js 14 + TypeScript + Tailwind CSS + CCC (`@ckb-ccc/connector-react`)
- JoyID testnet wallet used for signing and submitting transactions
- CKB NoteBoard live on testnet at `localhost:3000` (`npm run dev` in `apps/walletconn`)
