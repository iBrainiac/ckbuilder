"use client";

import React from "react";
import { Note } from "@/lib/noteBoard";
import { truncateAddress } from "@/utils/stringUtils";

const IS_MAINNET = process.env.NEXT_PUBLIC_IS_MAINNET === "true";

function explorerUrl(txHash: string): string {
  const base = IS_MAINNET
    ? "https://explorer.nervos.org"
    : "https://pudge.explorer.nervos.org";
  return `${base}/transaction/${txHash}`;
}

function formatRelativeTime(timestampMs: number): string {
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NoteCardProps {
  note: Note;
  index: number;
}

export default function NoteCard({ note, index }: NoteCardProps) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm hover:border-zinc-700 transition-colors"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
          <span className="text-sm font-mono text-zinc-300">
            {truncateAddress(note.a, 12, 8)}
          </span>
        </div>
        <span className="text-xs text-zinc-500">{formatRelativeTime(note.t)}</span>
      </div>

      <p className="text-zinc-100 leading-relaxed whitespace-pre-wrap break-words mb-4">
        {note.c}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <a
          href={explorerUrl(note.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-zinc-500 hover:text-cyan-400 transition-colors truncate max-w-[60%]"
        >
          tx: {truncateAddress(note.txHash, 10, 8)}
        </a>
        <span className="text-xs text-zinc-500 flex-shrink-0">
          <span className="text-cyan-500 font-semibold">{parseFloat(note.ckbLocked).toFixed(0)}</span>
          {" "}CKB locked
        </span>
      </div>
    </div>
  );
}
