# CKB NoteBoard

A simple onchain note board built on the [Nervos CKB](https://www.nervos.org/) Layer 1 blockchain. Write a short message and store it permanently on CKB — no backend, no database, just the chain.

## What it demonstrates

### The Cell Model
CKB uses a generalized UTXO model called the **Cell Model**. Every piece of state on CKB lives in a cell. This app writes each note into a cell's data field directly onchain. Once confirmed, that cell  and your note  exists on the blockchain permanently.

### Storage economics (1 CKB = 1 byte)
CKB enforces a direct relationship between tokens and storage: **1 CKB = 1 byte of on-chain space**. When you post a note, the app calculates the exact byte size of your note data plus the cell overhead (61 bytes for lock script + capacity field), and requires that amount of CKB as the cell's capacity. You can see this live in the cost estimate before submitting.

### Lock scripts
Each note cell is locked with the standard **Secp256k1Blake160** lock using a keyless burn address (all-zero args). This means the CKB locked in the cell is unspendable  a deliberate design choice that makes note storage permanent and tamper-proof.

### Transaction construction with CCC
The app uses [CCC](https://docs.ckbccc.com/) (`@ckb-ccc/connector-react`) to:
- Connect to wallets (JoyID, MetaMask, UniSat, OKX)
- Build and sign CKB transactions in the browser
- Query the CKB indexer for all note cells on-chain

## Getting started

### 1. Get testnet CKB
Connect your wallet (JoyID recommended — [joy.id](https://joy.id)), then claim testnet tokens from the [Pudge faucet](https://faucet.nervos.org). You'll receive 10,000 CKB, enough for dozens of notes.

### 2. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_IS_MAINNET` | `false` | Set to `"true"` to switch to CKB mainnet |

## Project structure

```
app/
  page.tsx              # Main page — note feed and submission form
  layoutProvider.tsx    # CCC Provider with testnet/mainnet toggle
lib/
  noteBoard.ts          # CKB transaction logic (submit + fetch notes)
components/
  NoteCard.tsx          # Individual note display
  NoteForm.tsx          # Note submission form with live CKB cost estimate
  ConnectWallet.tsx     # Wallet connect button with balance display
utils/
  stringUtils.ts        # Address truncation and formatting helpers
```

## Resources

- [Nervos CKB docs](https://docs.nervos.org)
- [CCC documentation](https://docs.ckbccc.com)
- [CKB Pudge testnet explorer](https://pudge.explorer.nervos.org)
- [Pudge faucet](https://faucet.nervos.org)
