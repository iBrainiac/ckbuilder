## Builder Track Weekly Report — Week 4

**Name:** Hazard  
**Week Ending:** 05-31-2026

---

### Courses Completed

- Completed the xUDT Issuer app end-to-end: mint, balance query, and transfer
- Studied **manual input cell selection** for token transfers — CCC's `completeInputsByCapacity` handles CKB capacity inputs but not token inputs, which must be collected explicitly
- Studied the CKB **transaction validation pipeline**:
  ```
  1. Resolve phase — can the node locate all inputs and cell_deps?
  2. Script phase — do Lock and Type Scripts execute and return 0?
  3. Commit phase — is the transaction accepted into a block?
  ```
- Debugged a TypeScript BigInt configuration issue (`tsconfig.json` target must be `ES2020` or higher for BigInt literal syntax)
- Learned about `.gitignore` hygiene for Next.js projects — `node_modules/` and `.next/` must be excluded before first push
- Published third article: [Is CKB Ready for Blockchain's Quantum Computing Threat?](https://paragraph.com/@hazardcryptos@gmail.com/is-ckb-ready-for-blockchains-quantum-computing-threat)

---

### Key Learnings

- **Token transfer requires manual cell selection.** Unlike CKB capacity inputs (which CCC selects automatically), token cells must be identified explicitly by the developer: query for cells matching the sender's lock AND the xUDT type hash, accumulate enough to cover the transfer amount, then add them to the transaction manually before calling `completeInputsByCapacity`.

  ```typescript
  for await (const cell of client.findCells({ script: fromLock, scriptType: "lock", ... })) {
    if (cell.cellOutput.type?.hash() !== typeHash) continue;
    inputAmount += decodeAmount(cell.outputData ?? "0x");
    tokenCells.push(cell);
    if (inputAmount >= amount) break;
  }
  ```

- **Token change cells must be created explicitly.** If the total input token amount exceeds the transfer amount, the remainder must be sent back to the sender in a new output cell. The xUDT Type Script will reject the transaction if `sum(inputs) != sum(outputs)`.

- **The `type_hash` is the correct token identifier for filtering**, not the `args` directly. Two scripts with the same `code_hash`, `hash_type`, and `args` produce the same `type_hash`. Using the hash to filter avoids byte-level string comparison bugs.

- **The `.next/` build cache and `node_modules/` should never be committed.** Learned this when a `next-swc` binary (111 MB) exceeded GitHub's 100 MB file size limit. Fixed by adding `.gitignore`, running `git rm -r --cached`, and amending the commit before pushing.

- Deepened understanding of CKB's quantum resistance through research for the article:
  - CKB's RISC-V architecture allows any cryptographic scheme to be deployed as a lock script — including SPHINCS+ (post-quantum)
  - Bitcoin and Ethereum have hardcoded ECDSA, requiring a hard fork to upgrade
  - CKB users can opt into quantum-resistant lock scripts today via Quantum Purse

---

### Practical Progress

- **Completed xUDT Issuer (`apps/xudt-issuer`)** — fully functional on testnet:
  - `issueTokens(signer, amount)` — mints new xUDT tokens locked to the sender
  - `fetchMyBalance(client, lock, xudtArgs)` — sums all xUDT cells held by the user
  - `transferTokens(signer, xudtArgs, toAddress, amount)` — transfers tokens with automatic change cell
  - `TokenCard` component displays xUDT type hash, xUDT args, and current balance
  - `IssueForm` shows live cost estimate (~146 CKB per token cell)
  - `TransferForm` validates amount against current balance before submission

- **Tested end-to-end on testnet:**
  - Minted tokens: transaction confirmed on Pudge Explorer
  - Transferred tokens to a second wallet: both output cells (receiver + change) confirmed on-chain
  - Balance refreshes automatically 4 seconds after each transaction

- **Fixed repository issues before push:**
  - Added `.gitignore` to `apps/xudt-issuer` (excludes `node_modules/`, `.next/`, `*.tsbuildinfo`)
  - Removed tracked build artifacts with `git rm -r --cached`
  - Amended commit to clean history before pushing to GitHub

- **Documentation:**
  - Added `ckbuilder-journey/reports/` with project reports for NoteBoard and xUDT Issuer
  - Added `articles/` with summaries and links for all three published Paragraph articles

---

### Environment

- xUDT Issuer fully deployed and tested on CKB Pudge testnet
- GitHub repo: [github.com/iBrainiac/ckbuilder](https://github.com/iBrainiac/ckbuilder)
- All apps run locally: `npm run dev` in the respective `apps/` subfolder
- Two shipped apps: CKB NoteBoard (`walletconn`) and xUDT Issuer (`xudt-issuer`)
- Three published articles on Paragraph covering CKB mining and quantum resistance
