"use client";

import { useState } from "react";
import { Avatar } from "@/components/AvatarStack";
import { useFitStore } from "@/lib/store";
import { shortAddress } from "@/lib/ckb";

export default function SquadsScreen() {
  const squads = useFitStore((s) => s.squads);
  const selectedSquadId = useFitStore((s) => s.selectedSquadId);
  const selectSquad = useFitStore((s) => s.selectSquad);
  const setOverlay = useFitStore((s) => s.setOverlay);
  const [copied, setCopied] = useState(false);

  const squad = squads.find((q) => q.id === selectedSquadId) ?? squads[0];

  if (squads.length === 0 || !squad) {
    return (
      <div className="flex min-h-[70vh] flex-col justify-end px-1 pb-4">
        <p className="mb-6 text-[15px] text-fog">No squad yet.</p>
        <button
          type="button"
          onClick={() => setOverlay("squad")}
          className="h-14 w-full rounded-full bg-lime text-[15px] font-semibold text-void"
        >
          Create a squad
        </button>
      </div>
    );
  }

  const inviteUrl =
    typeof window !== "undefined" && squad.inviteCode
      ? `${window.location.origin}/app/join/${squad.inviteCode}`
      : "";

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-1 pb-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-paper">{squad.name}</h1>
          <p className="mt-1 text-[12px] text-fog">{squad.members.length} members. Roster, not chat.</p>
        </div>
        <div className="flex items-center gap-3">
          {squads.length > 1 ? (
            <select
              value={squad.id}
              onChange={(e) => selectSquad(e.target.value)}
              className="rounded-full border border-hairline bg-void px-3 py-1 text-[12px] text-paper"
            >
              {squads.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" onClick={() => setOverlay("squad")} className="text-[12px] font-medium text-lime">
            New squad
          </button>
        </div>
      </div>

      {squad.inviteCode ? (
        <div className="mt-6 rounded-[20px] border border-hairline bg-panel px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-fog">Invite</p>
          <p className="mt-2 font-mono text-[18px] tracking-[0.18em] text-lime">{squad.inviteCode}</p>
          <p className="mt-1 break-all font-mono text-[11px] text-fog">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => void copyInvite()}
            className="mt-3 h-11 w-full rounded-full border border-lime text-[13px] font-semibold text-lime"
          >
            {copied ? "Copied" : "Copy invite link"}
          </button>
        </div>
      ) : null}

      <ul className="mt-6 space-y-1">
        {squad.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-[20px] border border-hairline bg-panel px-3 py-3"
          >
            <Avatar name={m.name} size={36} ring={m.isSelf} />
            <p className="min-w-0 flex-1 text-[14px] font-medium text-paper">
              {m.name}
              {m.isSelf ? " · you" : ""}
              {m.ckbAddress ? (
                <span className="mt-0.5 block font-mono text-[11px] font-normal text-fog">
                  {shortAddress(m.ckbAddress)}
                </span>
              ) : (
                <span className="mt-0.5 block text-[11px] font-normal text-fog">No CKB address</span>
              )}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-fog">Squad pot address</p>
        <p className="mt-2 break-all rounded-[20px] border border-hairline bg-panel px-4 py-3 font-mono text-[12px] text-paper">
          {squad.potAddress ? shortAddress(squad.potAddress) : "—"}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-fog">
          Locks go to the creator until a contract holds the pot.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          selectSquad(squad.id);
          setOverlay("create");
        }}
        className="mt-8 h-14 w-full rounded-full bg-lime text-[15px] font-semibold text-void"
      >
        New challenge
      </button>
    </div>
  );
}
