"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { fetchMyBalance, getXudtType } from "@/lib/xudt";
import ConnectWallet from "@/components/ConnectWallet";
import IssueForm from "@/components/IssueForm";
import TransferForm from "@/components/TransferForm";
import TokenCard from "@/components/TokenCard";
import { truncateHash } from "@/utils/format";

export default function Home() {
  const { open, wallet, client } = ccc.useCcc();
  const signer = ccc.useSigner();

  const [address, setAddress] = useState("");
  const [lock, setLock] = useState<ccc.Script | null>(null);
  const [xudtArgs, setXudtArgs] = useState("");
  const [typeHash, setTypeHash] = useState("");
  const [balance, setBalance] = useState(0n);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [lastTxLabel, setLastTxLabel] = useState("");

  // Derive lock + xUDT args when signer connects
  useEffect(() => {
    if (!signer) {
      setAddress(""); setLock(null); setXudtArgs(""); setTypeHash(""); setBalance(0n);
      return;
    }
    (async () => {
      const addr = await signer.getRecommendedAddress();
      setAddress(addr);
      const { script } = await ccc.Address.fromString(addr, signer.client);
      setLock(script);
      const args = script.hash() + "00000000";
      setXudtArgs(args);
      const xudtType = await getXudtType(signer.client, args);
      setTypeHash(xudtType.hash());
    })();
  }, [signer]);

  const refreshBalance = useCallback(async () => {
    if (!client || !lock || !xudtArgs) return;
    setBalanceLoading(true);
    try {
      const bal = await fetchMyBalance(client, lock, xudtArgs);
      setBalance(bal);
    } finally {
      setBalanceLoading(false);
    }
  }, [client, lock, xudtArgs]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  function handleTx(txHash: string, label: string) {
    setLastTx(txHash);
    setLastTxLabel(label);
    setTimeout(() => {
      setLastTx(null);
      refreshBalance();
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dot-grid">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800/60 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-zinc-100 tracking-tight">xUDT Issuer</span>
            <span className="hidden sm:inline text-xs text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">testnet</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        {/* Hero */}
        <section className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Issue your own{" "}
            <span className="text-cyan-400">xUDT token</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Your wallet's lock hash becomes the token identifier. Mint and transfer — no contract deployment needed.
          </p>
        </section>

        {wallet ? (
          <>
            {/* Token info */}
            <TokenCard
              xudtArgs={xudtArgs}
              typeHash={typeHash}
              balance={balance}
              loading={balanceLoading}
            />

            {/* Last tx notification */}
            {lastTx && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-zinc-400 flex items-center justify-between gap-4">
                <span>{lastTxLabel} submitted</span>
                <a
                  href={`https://pudge.explorer.nervos.org/transaction/${lastTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-cyan-400 hover:underline shrink-0"
                >
                  {truncateHash(lastTx, 12, 6)} →
                </a>
              </div>
            )}

            {/* Issue + Transfer side by side on wider screens */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Mint new tokens
                </h2>
                <IssueForm onIssued={(h) => handleTx(h, "Mint")} />
              </div>

              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Transfer tokens
                </h2>
                <TransferForm
                  xudtArgs={xudtArgs}
                  balance={balance}
                  onTransferred={(h) => handleTx(h, "Transfer")}
                />
              </div>
            </div>
          </>
        ) : (
          /* Connect CTA */
          <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center space-y-4">
            <p className="text-zinc-500 text-sm">Connect your wallet to issue and manage your xUDT token</p>
            <button
              onClick={open}
              className="rounded-lg bg-cyan-500 px-8 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Explainer */}
        <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">How it works</h3>
          <ul className="space-y-2 text-xs text-zinc-500">
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">→</span> Your wallet's lock script hash becomes the xUDT token identifier (args). Only you can issue this token.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">→</span> Token amounts are stored as 16-byte little-endian uint128 in each cell's data field.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">→</span> Each xUDT cell costs ~146 CKB to create (capacity = cell byte size). Transferring returns that CKB to you as change.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">→</span> The xUDT Type Script verifies token conservation: inputs total must equal outputs total.</li>
          </ul>
        </section>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-8 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-600">
        <span>Built on CKB · Powered by CCC</span>
        <a href="https://docs.ckbccc.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
          CCC Docs →
        </a>
      </footer>
    </div>
  );
}
