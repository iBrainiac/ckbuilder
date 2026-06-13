## Builder Track Weekly Report — Week 3

**Name:** Hazard  
**Week Ending:** 05-24-2026

---

### Courses Completed

- Studied the **xUDT (Extensible User Defined Token) standard** on CKB:
  - Read the xUDT RFC and token cell structure
  - Understood how the xUDT Type Script args encode the token class identity: `owner_lock_hash (32 bytes) + extension_flags (4 bytes)`
  - Learned that xUDT token amounts are stored as **16-byte little-endian uint128** in `outputsData`
  - Understood that the xUDT Type Script enforces conservation: `sum(input amounts) == sum(output amounts)`
- Studied **Type Script mechanics** in depth:
  - Why Type Scripts run on both input and output cells
  - How the Type Script hash identifies a token class (not the amount, not the holder)
  - The difference between `code_hash` (which executable), `script_hash` (which configured instance), and `data_hash` (which bytes stored)
- Reviewed `ccc.KnownScript.XUdt` and `tx.addCellDepsOfKnownScripts()` in the CCC API
- Published second article: [Mining CKB on the Nervos Network: A Complete Guide for 2026](https://paragraph.com/@hazardcryptos@gmail.com/mining-ckb-on-the-nervos-network-a-complete-guide-for-2026)

---

### Key Learnings

- The core shift this week: **Cell data by itself is storage. Cell data with a Type Script is protocol-enforced state.**

  In the NoteBoard, a note cell had `type: null`. Anyone could interpret the bytes any way they wanted — the protocol did not protect the meaning. With xUDT, the Type Script enforces that token amounts can only change in ways the script permits. The chain itself validates the accounting.

- Understood the xUDT token identity model:
  ```
  token class = xUDT Type Script with specific args
  args = owner lock hash + 4 zero bytes
  ```
  This means each wallet naturally has its own unique token class — no factory contract, no deployment step.

- Understood how token conservation works in practice:
  ```
  Transaction inputs: cells with xUDT type script
  Transaction outputs: cells with same xUDT type script
  xUDT Type Script verifies: sum(input token data) == sum(output token data)
  If not equal → transaction rejected
  ```

- Understood minimum cell capacity for an xUDT cell:
  ```
  capacity(8) + lock secp256k1blake160(53) + type xUDT 36-byte args(69) + data(16) = 146 bytes
  ```
  This CKB is locked in the cell but returned to the sender when the cell is consumed in a transfer.

---

### Practical Progress

- **Began building xUDT Issuer (`apps/xudt-issuer`)** — a Next.js + TypeScript app to issue and transfer xUDT tokens on CKB testnet:
  - Implemented `encodeAmount` and `decodeAmount` for 16-byte little-endian uint128
  - Implemented `getXudtArgs(signer)` — derives xUDT args from the connected wallet's lock script hash
  - Implemented `issueTokens(signer, amount)` — mints a new xUDT cell locked to the sender
  - Started `fetchMyBalance` — queries the indexer by lock script, filters for matching xUDT type

- **Key implementation insight** on `completeInputsByCapacity`:

  When minting, the xUDT output cell needs ~146 CKB of capacity. CCC's `completeInputsByCapacity` selects live CKB cells from the sender to cover this automatically — the developer only needs to define the outputs and outputsData.

---

### Environment

- Next.js 14 + TypeScript + Tailwind CSS + CCC — same stack as `walletconn`
- xUDT Issuer scaffolded and mint flow implemented
- App running at `localhost:3001` (`npm run dev -- --port 3001` in `apps/xudt-issuer`)
