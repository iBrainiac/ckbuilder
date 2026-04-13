"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ccc } from "@ckb-ccc/connector-react";
import { fetchNotes, Note } from "@/lib/noteBoard";
import NoteCard from "@/components/NoteCard";
import NoteForm from "@/components/NoteForm";
import ConnectWallet from "@/components/ConnectWallet";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-40 rounded animate-shimmer" />
        <div className="h-3 w-16 rounded animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="h-3 w-3/4 rounded animate-shimmer" />
      </div>
      <div className="h-px bg-zinc-800" />
      <div className="flex justify-between">
        <div className="h-3 w-32 rounded animate-shimmer" />
        <div className="h-3 w-20 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export default function Home() {
  const { open, wallet, client } = ccc.useCcc();
  const signer = ccc.useSigner();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTx, setLastTx] = useState<string | null>(null);

  useEffect(() => {
    if (!signer) { setAddress(""); return; }
    signer.getRecommendedAddress().then(setAddress).catch(() => {});
  }, [signer]);

  const loadNotes = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const fetched = await fetchNotes(client);
      setNotes(fetched);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function handleNoteSubmitted(txHash: string) {
    setLastTx(txHash);
    // Optimistic: reload notes after a brief delay to allow indexer to catch up
    setTimeout(() => {
      setLastTx(null);
      loadNotes();
    }, 4000);
  }

  const totalCkbLocked = notes.reduce((sum, n) => sum + parseFloat(n.ckbLocked), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] dot-grid">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800/60 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/ccc-logo.svg" alt="CCC" width={24} height={24} className="opacity-90" />
            <span className="font-semibold text-zinc-100 tracking-tight">CKB NoteBoard</span>
            <span className="hidden sm:inline text-xs text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">testnet</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Your words,{" "}
            <span className="text-cyan-400">stored forever</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Each note is written directly into a CKB cell.{" "}
            <span className="text-zinc-400">1 CKB = 1 byte</span> — you pay for the space you use.
          </p>

          {/* Stats row */}
          {!loading && notes.length > 0 && (
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{notes.length}</p>
                <p className="text-xs text-zinc-600">notes stored</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{totalCkbLocked.toFixed(0)}</p>
                <p className="text-xs text-zinc-600">CKB locked</p>
              </div>
            </div>
          )}
        </section>

        {/* Note form / connect CTA */}
        <section>
          {wallet ? (
            <div className="space-y-2">
              <NoteForm address={address} onSubmitted={handleNoteSubmitted} />
              {lastTx && (
                <p className="text-xs text-center text-zinc-500">
                  Submitted!{" "}
                  <a
                    href={`https://pudge.explorer.nervos.org/transaction/${lastTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline font-mono"
                  >
                    {lastTx.slice(0, 18)}…
                  </a>
                  {" "}· feed refreshes in a few seconds
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center space-y-3">
              <p className="text-zinc-500 text-sm">Connect your wallet to leave a note on CKB</p>
              <button
                onClick={open}
                className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </section>

        {/* Notes feed */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">On-chain notes</h2>
            <div className="flex-1 h-px bg-zinc-800" />
            {!loading && (
              <button onClick={loadNotes} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center">
              <p className="text-zinc-600 text-sm">No notes yet. Be the first to write on CKB.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, i) => (
                <NoteCard key={note.txHash} note={note} index={i} />
              ))}
            </div>
          )}
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
