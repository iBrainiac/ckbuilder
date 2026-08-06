# Project Report — xUDT Issuer

**Project:** `apps/xudt-issuer`  
**Status:** Shipped (testnet)  
**Date:** May 2026  
**Stack:** Next.js 14, TypeScript, CCC (`@ckb-ccc/connector-react`), Tailwind CSS  

---

## What I Built

A token issuance and transfer dashboard running on the Nervos CKB testnet. Connect your wallet, mint your own xUDT token, check your balance, and transfer tokens to any CKB address — no contract deployment, no backend, no database.



Live at: [http://localhost:3001](http://localhost:3001) (run `npm run dev` in `apps/xudt-issuer`)

---

## How It Works

### Token Identity

Every xUDT token class is identified by a unique Type Script. The `args` field of that script determines who issued the token:

```
xUDT args = owner lock hash (32 bytes) + extension flags (4 zero bytes)
```

The owner's lock hash is derived from their wallet's lock script:

```typescript
const { script } = await ccc.Address.fromString(address, signer.client);
const args = script.hash() + "00000000";
```

This means each wallet automatically has its own unique token class. No deployment step is needed — the token identifier is derived from the connected wallet.

### Minting Tokens

Issuing tokens creates one new output cell with:
- **Lock Script:** the sender's own lock (they hold the tokens)
- **Type Script:** xUDT with args = the sender's lock hash
- **outputsData:** the token amount encoded as 16-byte little-endian uint128

```typescript
const tx = ccc.Transaction.from({
  outputs: [{ lock, type: xudtType }],
  outputsData: [encodeAmount(amount)],
});
await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer, 1000);
```

CCC selects the CKB inputs automatically via `completeInputsByCapacity`.

### Amount Encoding

xUDT amounts are stored as 16-byte little-endian uint128 in `outputsData`. This is a fixed-size binary format — not a string, not JSON:

```typescript
function encodeAmount(amount: bigint): string {
  const bytes = new Uint8Array(16);
  let val = amount;
  for (let i = 0; i < 16; i++) {
    bytes[i] = Number(val & 0xffn);
    val >>= 8n;
  }
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

### Reading Balance

To fetch the user's token balance, the app queries all cells locked by the user's lock script, then filters for cells whose Type Script matches the xUDT type (by comparing type hashes):

```typescript
for await (const cell of client.findCells({ script: lock, scriptType: "lock", ... })) {
  if (!cell.cellOutput.type) continue;
  if (cell.cellOutput.type.hash() !== typeHash) continue;
  total += decodeAmount(cell.outputData ?? "0x");
}
```

### Transferring Tokens

Transfer collects xUDT input cells from the sender, creates a receiver output and a change output (if needed), then lets CCC handle additional CKB capacity inputs:

```typescript
// Collect token inputs from sender
for await (const cell of signer.client.findCells({ script: fromLock, ... })) {
  if (cell.cellOutput.type?.hash() !== typeHash) continue;
  inputAmount += decodeAmount(cell.outputData ?? "0x");
  tokenCells.push(cell);
  if (inputAmount >= amount) break;
}

// Build outputs: receiver + change (if any)
const tx = ccc.Transaction.from({ outputs, outputsData });
for (const cell of tokenCells) {
  tx.inputs.push(ccc.CellInput.from({ previousOutput: cell.outPoint, since: "0x0" }));
  tx.witnesses.push("0x");
}
await tx.completeInputsByCapacity(signer); // adds CKB inputs for capacity shortfall
await tx.completeFeeBy(signer, 1000);
```

The xUDT Type Script verifies automatically that `sum(input token amounts) == sum(output token amounts)`. If they don't balance, the transaction is rejected on-chain.

---

## Cell Economics

Each xUDT cell requires a minimum of **146 CKB** of capacity:

| Field | Bytes |
|-------|-------|
| `capacity` field | 8 |
| Lock Script (Secp256k1Blake160) | 53 |
| Type Script (xUDT, 36-byte args) | 69 |
| Cell data (16-byte amount) | 16 |
| **Total** | **146** |

This CKB is not spent   it is locked inside the cell and returned to the sender as capacity when the cell is consumed in a transfer.

---

## CKB Concepts Demonstrated

| Concept | Where |
|---------|-------|
| Type Script enforces token conservation | xUDT Type Script (on-chain) |
| Lock Script + Type Script separation | Each cell has both |
| xUDT args = owner lock hash | `getXudtArgs()` in `lib/xudt.ts` |
| 16-byte LE uint128 token encoding | `encodeAmount` / `decodeAmount` |
| Manual input cell selection for tokens | `transferTokens()` in `lib/xudt.ts` |
| `completeInputsByCapacity` for CKB side | Both issue and transfer flows |
| Cell data without Type Script = meaningless | Contrast with NoteBoard |
| Cell data with Type Script = protocol state | xUDT token cells |
| Token conservation verified on-chain | xUDT Type Script |

---

## Project Structure

```
apps/xudt-issuer/
  app/
    page.tsx              # Main page — token card, mint form, transfer form
    layout.tsx            # Root layout
    layoutProvider.tsx    # CCC Provider (testnet / mainnet toggle)
  lib/
    xudt.ts               # Core logic: issueTokens, fetchMyBalance, transferTokens
  components/
    ConnectWallet.tsx     # Wallet connect button with balance display
    IssueForm.tsx         # Mint form with cost estimate (~146 CKB)
    TransferForm.tsx      # Transfer form with balance validation
    TokenCard.tsx         # Token identity display (type hash, xUDT args, balance)
  utils/
    format.ts             # Address and hash truncation, token amount formatting
```

---

## Key Differences From NoteBoard

| | NoteBoard | xUDT Issuer |
|---|---|---|
| Cell data | JSON-encoded note (arbitrary) | 16-byte LE uint128 (typed) |
| Type Script | None (`type: null`) | xUDT (enforces conservation) |
| Lock | Burn address (permanent) | Sender's own lock (spendable) |
| State | Write-once, immutable | Transferable, consumable |
| CKB locked | Permanent deposit | Returned on transfer |

The NoteBoard showed that cells can store arbitrary bytes. The xUDT Issuer showed that adding a Type Script turns those bytes into enforced protocol state.

---

## What I Would Build Next

- Add a token registry: store a name, symbol, and total supply on-chain in a separate metadata cell
- Build a token explorer: enter any xUDT args and see all cells/holders
- Implement a simple faucet: allow anyone to claim a fixed amount from the issuer
- Explore xUDT owner script mode for more advanced issuance control
