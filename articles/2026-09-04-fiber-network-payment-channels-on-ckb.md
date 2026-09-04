---
title: "Fiber Network: Payment Channels on Nervos CKB"
date: 2026-09-04
tags: [fiber, ckb, nervos, payment-channels, lightning, invoices]
---

## Summary

A technical walkthrough of Fiber Network, the peer-to-peer payment and swap network built on Nervos CKB. The piece stays with published docs: what a channel is, how CKB Scripts enforce open and close, how HTLC-style hops move money without a direct channel, how invoices are encoded, and how you actually talk to a node (FNN or `fiber-js`). It is a draft for later blog publish, not a recap of the August 2026 overview.

## Key Points

- CKB is the settlement and enforcement layer. Repeated transfers stay off-chain as signed state updates.
- Two on-chain Scripts matter: Funding Lock (2-of-2 funding via `ckb-auth`) and Commitment Lock (Daric penalty, bounded closure).
- Multi-hop payments use hash-and-time locks today. PTLC is planned, not current.
- Invoices follow BOLT 11 ideas but use Molecule, bech32m, and HRPs `fibb` / `fibt` / `fibd`. They are not Lightning invoices.
- FNN is the reference node. `fiber-js` runs a WASM node in the browser. Always-online work still wants native `fnn`.

---

Fiber Network is a peer-to-peer payment and swap network on Nervos CKB. The official docs compare it to Bitcoin's Lightning Network: two parties lock assets on Layer 1, then exchange signed balance updates directly. They return to CKB only to open a channel, close it, or dispute a stale close.

The point is not "CKB but faster." Layer 1 already settles. What it does poorly is small, frequent, or time-sensitive transfers. Every on-chain payment waits for consensus and pays a full transaction. Fiber keeps those updates between the peers on the path. There is no network-wide consensus per hop.

Fiber Network Node (FNN) is the reference implementation of the Fiber Network Protocol (FNP).

This article uses the public Fiber docs and specs. Where the docs say "planned" or "prototype," that is how it is written here.

## What sits on CKB, and what does not

A payment channel is a relationship between two participants. They lock assets into a shared on-chain Script. That funding transaction is the initial state.

While the channel is open, they do not broadcast each payment. They keep the latest mutually signed balances. A cooperative close submits that latest state to CKB. If one side tries to close with an old state, the on-chain Script lets the other side challenge it.

That is the whole split:

| Happens off-chain | Happens on CKB |
|---|---|
| Balance updates between peers | Open (funding) |
| Multi-hop forwards along a path | Close (cooperative settlement) |
| Invoice create / pay (node RPC) | Dispute (stale commitment, penalty) |

Multiple channels can exist between the same pair of nodes. The docs' simulators hide that for clarity.

Fiber is not a single-asset rail. The feature list includes stablecoins, RGB++ assets issued on the Bitcoin ledger, and UDT assets issued on CKB. Swaps are in scope when a path has the liquidity. Cross-network flows with Lightning are a design goal. The architecture notes a Cross Hub that maps Bitcoin Lightning payments and invoices into Fiber. That hub is still described as prototype work.

## The two Scripts: Funding Lock and Commitment Lock

Channel logic lives in CKB Scripts, in a separate `fiber-scripts` repository. Two contracts are named in the architecture docs.

**Funding Lock** locks the funds that open the channel. It uses the `ckb-auth` library for a 2-of-2 multi-signature. Both peers must agree to the funding.

**Commitment Lock** is the penalty and close path. The docs say it implements the Daric protocol as Fiber's penalty mechanism, with the goal of optimal storage and bounded closure. Watchtowers compare `commitment_number` values. If a peer publishes an old commitment, the watchtower (or the other peer) can build a revocation transaction and put it on-chain. If the published state is current, the path is a settlement transaction.

You do not need to invent a third Script to send a payment inside an open channel. The payment is an off-chain TLC update. CKB only sees the cell again at close or dispute.

Testnet configs published with FNN name those Scripts (`FundingLock`, `CommitmentLock`) and pin `code_hash` / Type ID cell deps. Those hashes are deployment details. Read them from the release `config.yml` for the network you run, not from memory.

## How a hop is secured (HTLC today, PTLC later)

A direct channel is not required. If Alice has a channel with Bob and Bob has a channel with Carol, Bob can forward a payment. Intermediaries can take a fee.

The trust problem is old Lightning material, and Fiber's payment-channel explainer restates it. Alice cannot prepay Bob and hope he pays Carol. Bob cannot pay Carol and hope Alice settles. The construction is a hash lock plus a time lock:

- The receiver picks a secret (preimage). The path locks on a hash of that secret.
- Each hop can claim only if it learns the preimage before timeout.
- If the preimage never appears, funds return after the time lock.

Fiber's P2P spec uses **TLC** (time-locked contract) instead of spelling HTLC on the wire, so a later PTLC (point time-locked contract) can fit the same messages. The glossary is explicit: PTLC support is a planned direction. Today Fiber still runs hash-based TLC / HTLC flows.

The feature page matches that: Fiber currently uses HTLC-style mechanisms for Lightning compatibility. Future work may add PTLC for privacy and security.

Onion encryption hides the rest of the route. `fiber-sphinx` is the library. Each hop sees the amount it received, the expiry, and the next peer. It does not see the full path length. Errors go back along the reverse path, also onion-encrypted, so only the sender can read them.

## Finding a path

Each node keeps a **Network Graph**: nodes as vertices, channels as edges. The broadcast edge weight is capacity, not the live split of the balance. The actual partition stays private.

Gossip follows BOLT 7-style messages: `NodeAnnouncement`, `ChannelAnnouncement`, `ChannelUpdate`. First start uses `bootnode_addrs`. Raw gossip is stored (timestamp plus message id) and replayed into the graph.

A payment starts as an RPC call. The node creates a `PaymentSession`. Pathfinding is a Dijkstra variant that expands **backward from the payee**. The distance metric mixes success probability (from past results), fees, and HTLC lock time.

Capacity in the graph is an upper bound. A hop can still fail if real liquidity is short. On that failure the graph is updated and pathfinding retries.

Atomic multi-path payments appear in the invoice spec (random `payment_hash` for AMP invoices) and on the public roadmap. Treat AMP as specified / planned, not as the default single-invoice path in the basic transfer guide.

## Invoices (not Lightning invoices)

A Fiber node generates and parses invoices. The design follows BOLT 11 in spirit, then changes the encoding.

- Data is Molecule (standard in CKB projects).
- The string is **bech32m**, not bech32.
- Molecule bytes are losslessly compressed with `arcode-rs` before bech32m, which the spec says cuts length by about half.
- The API looks like `lightning-invoice`. The bytes are **not** a Lightning invoice. Cross-network compatibility is supposed to go through the FNN hub, not by pasting a Fiber string into an LN wallet.

Human-readable part:

| Prefix | Network |
|---|---|
| `fibb` | CKB mainnet (`fiber bytes`; 1 CKB = 1 byte in the CKB cost model) |
| `fibt` | CKB testnet |
| `fibd` | CKB dev |

Amount is optional. For CKB it is in **shannon** (`1 CKB = 10^8 shannon`). An empty amount is allowed (donation-style).

Mandatory data fields include a millisecond Unix `timestamp` and a 256-bit `payment_hash` (the invoice's unique id). Optional fields include expiry (seconds after timestamp), UTF-8 description, final HTLC timeout, a CKB fallback address, feature flags, payee pubkey, a UDT script, and `hash_algorithm` (`0` = CKB hash, default when omitted; `1` = SHA-256).

HODL invoices take a `preimage` and set `payment_hash = blake2b_256(preimage)` at create time. An optional secp256k1 recoverable signature can cover the HRP plus data bytes.

The basic transfer tutorial shows the live loop on testnet: `new_invoice` on the payee (currency `Fibt`), then `send_payment` on the payer with that invoice string. `send_payment` can return `Created` or `Inflight`. The payment is done only when `get_payment` reports `Success`.

## What a node actually is

FNN is Rust. It uses the Actor Model (`ractor`). Almost every module is an actor: Network Actor, Channel Actors (one per channel), PaymentSession, Watchtower, gossip filters. Peers talk over Tentacle. Inter-node messages use Molecule. Local store is RocksDB.

HTLC state inside a channel follows the Lightning pattern: `commitment_sign` and `revoke_and_ack` drive a state machine. The P2P document is an adaptation of BOLT 02 to CKB's transaction shape. After funding, payments are `AddTlc`, then commitment updates.

Watchtower is an actor that records a channel on `RemoteTxComplete`, drops it on cooperative `ChannelClosed`, and stores `revocation_data` / `settlement_data` from `RemoteCommitmentSigned` and `RevokeAndAckReceived`. It exists so a peer that is offline can still be protected if the other side publishes an old commitment. Browser WASM nodes are a poor watchtower: the page can freeze or die. The WASM docs tell you to run native `fnn` for receive, forwarding, and watchtower duty.

**Two ways to run a node:**

1. **Native `fnn`** (desktop or server). JSON-RPC on localhost in the default configs (example ports `8227` / `8237` in the two-node guide). `fnn-cli` wraps the same methods. RPC can be gated with Biscuit tokens (`new_invoice` needs `write("invoices")`, `send_payment` needs `write("payments")`, and so on).
2. **`@nervosnetwork/fiber-js`**. A Fiber WASM node in the page, workers plus IndexedDB. Methods are camelCase wrappers (`newInvoice` → `new_invoice`). The page must be cross-origin isolated (`SharedArrayBuffer`). Browser nodes dial `ws` / `wss` peers; they do not accept inbound TCP. You can fund a channel with an external wallet (`openChannelWithExternalFunding` then `submitSignedFundingTx`) so the WASM process never holds the user's CKB key.

The published basic-transfer guide (updated 17 August 2026) walks two local testnet nodes: connect, `open_channel` (funding in shannon), wait for `ChannelReady`, invoice, pay, then `shutdown_channel`. Cooperative close (`force: false`) needs both peers online. `force: true` is the uncooperative path and waits out the commitment delay.

Align `fiber-js`, `fnn`, and public peers on the same release line. The transfer guide currently pins **v0.9.0** when you build from source.

## What the docs say you can build

The feature page groups demos, not hypotheticals:

- Usage-priced media and meters (Fiber Audio Player, EV Charging).
- Checkout and access (Fiber Checkout, Fiber L402).
- Tips and community payments (Fiber Link).
- Games and agents (Micro-payment Game, Fiber Pay, FiberAgentPay, Fiber402).
- Operator tools (Fiber Dashboard, Fiber Studio wrapping `fnn`).

Those are the right shape for Fiber: many small transfers, or unlock-on-pay. A product that locks once and pays once is still a CKB L1 escrow problem. Fiber is the wrong first tool for that loop.

## Roadmap, as published

The docs list work that is done or in motion (connect peers, open and close channels, pay over channels via `fiber-scripts`, a browser-friendly runtime) and work still ahead (richer cross-network transfers, programmable conditional payments, advanced liquidity tools, atomic multi-path). Architecture "future prospects" add robustness, a more complete cross-chain hub, better routing (including multi-path), and PTLC / versioned revocation.

Do not treat the GitHub README's "PTLC not HTLC" line as the current wire format. The protocol and glossary pages override it: hash-based TLC now, PTLC later.

## Sources

Facts above are taken from:

- [What is Fiber Network?](https://www.fiber.world/docs)
- [How Fiber Network Works](https://www.fiber.world/docs/how-it-works)
- [Fiber Architecture and Module](https://www.fiber.world/docs/tech-explanation/high-level)
- [Fiber Invoice Protocol](https://www.fiber.world/docs/tech-explanation/invoice-protocol)
- [What is Payment Channel Network](https://www.fiber.world/docs/tech-explanation/payment-channel)
- [Fiber P2P Message Protocol](https://www.fiber.world/docs/tech-explanation/p2p-message)
- [Fiber Network Glossary](https://www.fiber.world/docs/guide/glossary)
- [Basic Transfer Example](https://www.fiber.world/docs/quick-start/basic-transfer)
- [WASM Node (`fiber-js`)](https://www.fiber.world/docs/build/sdk/wasm-node)
- [Biscuit Authentication](https://www.fiber.world/docs/guide/biscuit-auth)
- [nervosnetwork/fiber](https://github.com/nervosnetwork/fiber) (FNN as reference node; invoice spec in-tree)

When a number or hash can drift (Script `code_hash`, bootnode multiaddrs, package versions), copy it from the release config or the page dated on fiber.world, not from this draft.
