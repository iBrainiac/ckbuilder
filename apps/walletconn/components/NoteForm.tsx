"use client";

import React, { useState } from "react";
import { ccc } from "@ckb-ccc/connector-react";
import { estimateCkb, submitNote } from "@/lib/noteBoard";

const MAX_CHARS = 200;

interface NoteFormProps {
  address: string;
  onSubmitted: (txHash: string) => void;
}

export default function NoteForm({ address, onSubmitted }: NoteFormProps) {
  const signer = ccc.useSigner();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charsLeft = MAX_CHARS - content.length;
  const ckbCost = address && content.trim() ? estimateCkb(content.trim(), address) : 0;
  const canSubmit = !!signer && content.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer || !content.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const txHash = await submitNote(signer, content.trim(), address);
      setContent("");
      onSubmitted(txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
        placeholder="What's on your mind? It'll stay here forever..."
        rows={4}
        className="w-full resize-none bg-transparent text-zinc-100 placeholder-zinc-600 outline-none text-sm leading-relaxed"
      />

      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {ckbCost > 0 && (
            <span>
              ~<span className="text-cyan-400 font-semibold">{ckbCost}</span> CKB
            </span>
          )}
          <span className={charsLeft <= 20 ? "text-amber-400" : ""}>
            {content.length}/{MAX_CHARS}
          </span>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Storing…
            </>
          ) : (
            "Store Forever"
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400 break-words">{error}</p>
      )}
    </form>
  );
}
