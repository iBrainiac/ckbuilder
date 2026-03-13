# CKB (Common Knowledge Base)

CKB is the Layer 1 blockchain of the [Nervos Network](https://www.nervos.org/). It is a decentralized, Proof-of-Work chain designed to be the secure settlement layer for a multi-layer blockchain ecosystem.

---

## What Makes CKB Different

- **Bitcoin-isomorphic** — Uses PoW and a generalized UTXO model (called the Cell Model), making it structurally similar to Bitcoin while adding full programmability.
- **RISC-V VM** — Smart contracts run on CKB-VM, a virtual machine based on the RISC-V instruction set. Any language that compiles to RISC-V can be used.
- **Crypto-agnostic** — No cryptographic primitives are hardcoded. You can deploy any signature scheme or hash function as an on-chain library.
- **Protocol-level account abstraction** — Works out of the box. No workarounds needed.
- **Modular by design** — CKB handles security and decentralization; Layer 2 networks built on top handle scale.

---

## Core Concepts

### Cell Model
The Cell Model is a generalization of Bitcoin's UTXO. Every piece of state on CKB lives in a **cell**. Cells hold data and are locked by scripts (smart contracts). Transactions consume cells and produce new ones.

### Scripts
- **Lock Script** — Controls who can spend a cell (like a Bitcoin locking script).
- **Type Script** — Enforces rules on how a cell's data can change.

### CKByte (CKB token)
- 1 CKB = 1 byte of on-chain storage capacity.
- To store state on CKB, you must hold CKBytes. This ties token value directly to network usage.

---

## Key Protocols Built on CKB

| Protocol | Description |
|----------|-------------|
| **RGB++** | Extends Bitcoin's RGB protocol using CKB for smart contract execution |
| **UTXO Stack** | Framework for launching Bitcoin-compatible Layer 2 chains |
| **CKB Lightning Network** | Fast, low-cost off-chain payments |

---

## Developer Quickstart

**Languages supported**: Rust, C, JavaScript (via ckb-js-toolkit), and any RISC-V–compatible language.

**Key tools**:
- [`ckb-cli`](https://github.com/nervosnetwork/ckb-cli) — Command-line interface
- [`Capsule`](https://github.com/nervosnetwork/capsule) — Smart contract development framework (Rust)
- [`Lumos`](https://github.com/ckb-js/lumos) — JavaScript/TypeScript SDK
- [CKB Explorer](https://explorer.nervos.org/) — Block explorer

**Docs**: [docs.nervos.org](https://docs.nervos.org)

---

## Useful Links

- Website: [nervos.org](https://www.nervos.org/)
- GitHub: [github.com/nervosnetwork](https://github.com/nervosnetwork)
- CKB Whitepaper: [rfcs/0002-ckb](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0002-ckb/0002-ckb.md)
- Knowledge Base: [nervos.org/knowledge-base](https://www.nervos.org/knowledge-base)
