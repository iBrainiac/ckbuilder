## Builder Track Weekly Report — Week 1

**Name:** Hazard  
**Week Ending:** 05-10-2026

---

### Courses Completed

- Read the Nervos CKB documentation from first principles:
  - **Cell Model** — structure of a cell (`capacity`, `lock`, `type`, `data`), live vs dead cells, capacity as both token value and storage right
  - **Transaction Structure** — inputs, outputs, `outputs_data`, `cell_deps`, `header_deps`, `witnesses`
  - **Lock Scripts and Type Scripts** — ownership vs state transition rules
  - **CKB-VM and RISC-V** — how scripts are executed, syscalls, script group execution
- Explored the [Nervos RFC 0022](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md) on transaction structure
- Studied the `code_hash`, `hash_type`, and `args` fields that make up a Script structure
- Reviewed how `cell_deps` brings executable code into scope during transaction verification

---

### Key Learnings

- The most important mental shift this week was understanding that **CKB is a verification-oriented blockchain, not an execution-oriented one**. A transaction proposes a state transition; scripts verify whether it is valid.

- Developed a working mental model of the Cell Model:
  ```
  live cells → transaction consumes cells → scripts verify validity → new cells are created
  ```

- Understood the distinction between Lock Scripts and Type Scripts:
  - `Lock Script` = who can consume this cell (ownership)
  - `Type Script` = what rules govern this cell's state transitions (meaning)

- Understood that **1 CKByte = 1 byte of on-chain storage**. To store state on CKB, a user must lock CKB proportional to the byte size of the cell.

- Learned that a Script does not contain its own executable code — it references code via `code_hash` and `hash_type`. The actual code lives in a separate cell, brought into scope through `cell_deps`.

- Understood transaction finality in a PoW system: a returned transaction hash means the transaction was submitted, not that it is committed.

---

### Practical Progress

- **Set up a local CKB developer environment:**
  - Installed OffCKB and started a local CKB devnet
  - Confirmed the RPC proxy running at `http://127.0.0.1:28114`
  - Ran `offckb system-scripts --export-style ccc` and inspected real `codeHash` and `cellDeps` values for `Secp256k1Blake160`, `OmniLock`, `XUdt`, and `TypeId`

- **Set up a testnet wallet:**
  - Created a JoyID testnet wallet at [joy.id](https://joy.id)
  - Claimed testnet CKB from the [Pudge faucet](https://faucet.nervos.org)
  - Explored the [Pudge testnet explorer](https://pudge.explorer.nervos.org)

- **First testnet transaction:**
  - Connected CCC Playground to the JoyID testnet wallet
  - Observed how CCC selects a live cell, creates a receiver output, creates a change output, and deducts the fee from the capacity difference
  - Watched the transaction hash change at each construction stage as the structure was finalized

---

### Environment

- OffCKB installed and local devnet confirmed running
- JoyID testnet wallet created and funded via Pudge faucet
- CCC Playground connected to testnet
- CKB Explorer and Pudge Explorer bookmarked for transaction verification
