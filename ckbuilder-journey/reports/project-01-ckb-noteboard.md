# Project Report — CKB NoteBoard

**Project:** `apps/walletconn`  
**Status:** Shipped (testnet)  
**Date:** June 2026  
**Stack:** Next.js 14, TypeScript, CCC (`@ckb-ccc/connector-react`), Tailwind CSS  

---

## What I Built

A permanent on-chain note board running on the Nervos CKB testnet. Users connect their wallet, write a short message, and the app stores it directly on CKB as a cell — no backend, no database, no server. Once confirmed, the note exists on-chain permanently.

Live at: [http://localhost:3000](http://localhost:3000) (run `pnpm dev` in `apps/walletconn`)

---

## How It Works

### Writing a Note

When a user submits a note, the app constructs a CKB transaction that creates one new output cell. The cell's `outputsData` field holds the note encoded as UTF-8 JSON, then hex-prefixed:

```typescript
{ a: authorAddress, c: content, t: unixTimestampMs }
```

The cell capacity is calculated precisely — 1 CKB per byte of total cell size:

```
capacity = 61 bytes (cell overhead) + len(JSON note data in bytes)
```

The 61-byte overhead breaks down as:
- `capacity` field: 8 bytes
- `code_hash`: 32 bytes
- `hash_type`: 1 byte
- `args`: 20 bytes

### Permanent Storage via Burn Address

The note cell is locked with the standard `Secp256k1Blake160` lock script using all-zero args:

```typescript
const NOTE_BOARD_ARGS = "0x0000000000000000000000000000000000000000";
```

No private key corresponds to this lock. The cell is permanently unspendable — the CKB locked inside acts as a permanent storage deposit. This makes notes tamper-proof: once the transaction is committed, nobody can consume or modify the cell.

### Reading Notes

The app queries the CKB indexer for all live cells matching the note board lock script using CCC's `findCells`:

```typescript
client.findCells({
  script: noteBoardLock,
  scriptType: "lock",
  scriptSearchMode: "exact",
  withData: true,
})
```

Cells are decoded from hex back to JSON, validated for the expected shape, and sorted newest-first. Up to 50 notes are displayed.

### Wallet Support

CCC handles wallet connection natively. Supported wallets:
- JoyID
- MetaMask (via EIP-6963)
- UniSat
- OKX Wallet

---

## CKB Concepts Demonstrated

| Concept | Where |
|---------|-------|
| Cell Model (state lives in cells, not accounts) | Each note is a cell |
| 1 CKB = 1 byte of on-chain storage | Live cost estimate in NoteForm |
| Lock Script controls who can spend a cell | Burn address makes notes permanent |
| `outputsData` stores arbitrary bytes | Note JSON stored in cell data |
| CCC for transaction construction and wallet signing | `lib/noteBoard.ts` |
| CKB indexer queries live cells by lock script | `fetchNotes()` in `lib/noteBoard.ts` |
| Transaction finality: hash returned ≠ committed | App returns `txHash` from `sendTransaction` |

---

## Project Structure

```
apps/walletconn/
  app/
    page.tsx              # Main page — note feed and submission form
    layoutProvider.tsx    # CCC Provider with testnet/mainnet toggle
  lib/
    noteBoard.ts          # CKB transaction logic: submitNote + fetchNotes
  components/
    NoteCard.tsx          # Individual note display
    NoteForm.tsx          # Note submission form with live CKB cost estimate
    ConnectWallet.tsx     # Wallet connect button with balance display
  utils/
    stringUtils.ts        # Address truncation helpers
```

---

## Key Design Decisions

**Why a burn address?**  
Using all-zero args for the lock means no one holds the corresponding private key. This is a deliberate tradeoff: CKB locked in note cells is permanently consumed, but notes are guaranteed tamper-proof with no upgrade path needed.

**Why not a Type Script?**  
Notes have no state transition rules — they are written once and never modified. A Type Script would add validation overhead without benefit here. The lock script alone is sufficient.

**Why JSON in cell data?**  
Simple and readable. The note schema (`a`, `c`, `t`) is compact by design. A more production-grade version could use Molecule serialization.

---

## What I Would Do Next

- Add a Molecule-encoded note schema instead of JSON for proper CKB data standards
- Deploy to CKB mainnet
- Add a Type Script to enforce a maximum note length on-chain
- Explore using `AnyoneCanPay` lock instead of burn address to allow note recovery
- Build `cook-ckb` as the next experiment
