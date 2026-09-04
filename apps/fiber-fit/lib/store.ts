"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type {
  Challenge,
  Checkin,
  FiberKind,
  FitSnapshot,
  Squad,
  Unit,
} from "./types";
import { dayIndex, newId, nowStamp, ymd } from "./time";
import {
  barMet,
  findCheckin,
  isSealed,
  settlePayouts,
} from "./settlement";

export type Tab = "home" | "board" | "squads" | "vault";

type CreateChallengeInput = {
  squadId: string;
  name: string;
  fiber: FiberKind;
  bar: number;
  unit: Unit;
  customRule?: string;
  minDuration?: number;
  days: number;
  stakeCkb: number;
  startDate: string;
  lockTxHash?: string;
  potAddress?: string;
};

type FitActions = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  overlay: "none" | "create" | "confirm" | "squad";
  setOverlay: (o: FitActions["overlay"]) => void;
  createSquad: (name: string, displayName: string) => string;
  addMember: (squadId: string, name: string, ckbAddress?: string) => string | { error: string };
  removeMember: (squadId: string, memberId: string) => { error?: string };
  setMemberAddress: (squadId: string, memberId: string, ckbAddress: string) => void;
  setSelfAddress: (ckbAddress: string) => void;
  setPotAddress: (squadId: string, potAddress: string) => void;
  selectSquad: (id: string | null) => void;
  replaceSquads: (squads: Squad[]) => void;
  selectChallenge: (id: string | null) => void;
  createChallenge: (input: CreateChallengeInput) => { error?: string; id?: string };
  setProof: (
    challengeId: string,
    memberId: string,
    dayIndex: number,
    proofValue?: number,
    proofMinutes?: number
  ) => void;
  seal: (challengeId: string, memberId: string, day: number) => { error?: string };
  miss: (challengeId: string, memberId: string, day: number) => { error?: string };
  toggleMark: (challengeId: string, memberId: string, day: number) => void;
  confirm: (challengeId: string, memberId: string, payoutTxHash?: string) => void;
  deleteChallenge: (id: string) => { error?: string };
  abandonChallenge: (id: string) => { error?: string };
  syncStatuses: () => void;
};

const empty: FitSnapshot = {
  squads: [],
  challenges: [],
  checkins: [],
  settlements: [],
  availableCkb: 0,
  selectedSquadId: null,
  selectedChallengeId: null,
};

function upsertCheckin(checkins: Checkin[], next: Checkin): Checkin[] {
  const rest = checkins.filter(
    (c) =>
      !(
        c.challengeId === next.challengeId &&
        c.memberId === next.memberId &&
        c.dayIndex === next.dayIndex
      )
  );
  return [...rest, next];
}

function derivedStatus(ch: Challenge, now = new Date()): Challenge["status"] {
  if (ch.status === "settled") return "settled";
  const idx = dayIndex(ch.startDate, ch.days, now);
  if (idx >= ch.days - 1) return "confirming";
  return "open";
}

export const useFitStore = create<FitSnapshot & FitActions>()(
  persist(
    (set, get) => ({
      ...empty,
      tab: "home",
      overlay: "none",
      setTab: (tab) => set({ tab }),
      setOverlay: (overlay) => set({ overlay }),
      selectSquad: (selectedSquadId) => set({ selectedSquadId }),
      replaceSquads: (next) =>
        set((s) => ({
          squads: next,
          selectedSquadId:
            s.selectedSquadId && next.some((q) => q.id === s.selectedSquadId)
              ? s.selectedSquadId
              : next[0]?.id ?? null,
        })),
      selectChallenge: (selectedChallengeId) => set({ selectedChallengeId, tab: "board" }),

      createSquad: (name, displayName) => {
        const id = newId();
        const me = {
          id: newId(),
          name: displayName.trim() || "Me",
          createdAt: Date.now(),
          isSelf: true,
        };
        const squad: Squad = {
          id,
          name: name.trim() || "Squad",
          members: [me],
        };
        set((s) => ({
          squads: [...s.squads, squad],
          selectedSquadId: id,
          overlay: "none",
        }));
        return id;
      },

      addMember: (squadId, name, ckbAddress) => {
        const trimmed = name.trim();
        if (!trimmed) return { error: "Name required." };
        const squad = get().squads.find((x) => x.id === squadId);
        if (!squad) return { error: "No squad." };
        const addr = ckbAddress?.trim();
        const member = {
          id: newId(),
          name: trimmed,
          createdAt: Date.now(),
          isSelf: false,
          ckbAddress: addr || undefined,
        };
        set((s) => ({
          squads: s.squads.map((q) =>
            q.id === squadId ? { ...q, members: [...q.members, member] } : q
          ),
        }));
        return member.id;
      },

      removeMember: (squadId, memberId) => {
        const squad = get().squads.find((x) => x.id === squadId);
        const member = squad?.members.find((m) => m.id === memberId);
        if (!member) return { error: "No member." };
        if (member.isSelf) return { error: "Cannot remove yourself." };
        const live = get().challenges.some(
          (c) =>
            c.squadId === squadId &&
            c.status !== "settled" &&
            c.memberIds.includes(memberId)
        );
        if (live) return { error: "Member is in a live challenge." };
        set((s) => ({
          squads: s.squads.map((q) =>
            q.id === squadId
              ? { ...q, members: q.members.filter((m) => m.id !== memberId) }
              : q
          ),
        }));
        return {};
      },

      setMemberAddress: (squadId, memberId, ckbAddress) => {
        const addr = ckbAddress.trim();
        set((s) => ({
          squads: s.squads.map((q) =>
            q.id !== squadId
              ? q
              : {
                  ...q,
                  members: q.members.map((m) =>
                    m.id === memberId ? { ...m, ckbAddress: addr || undefined } : m
                  ),
                }
          ),
        }));
      },

      setSelfAddress: (ckbAddress) => {
        const addr = ckbAddress.trim();
        if (!addr) return;
        set((s) => ({
          squads: s.squads.map((q) => ({
            ...q,
            potAddress: q.potAddress ?? addr,
            members: q.members.map((m) => (m.isSelf ? { ...m, ckbAddress: addr } : m)),
          })),
        }));
      },

      setPotAddress: (squadId, potAddress) => {
        const addr = potAddress.trim();
        set((s) => ({
          squads: s.squads.map((q) => (q.id === squadId ? { ...q, potAddress: addr || undefined } : q)),
        }));
      },

      createChallenge: (input) => {
        const squad = get().squads.find((x) => x.id === input.squadId);
        if (!squad) return { error: "Create a squad first." };
        if (squad.members.length < 1) return { error: "Squad is empty." };
        const stake = Math.trunc(input.stakeCkb);
        if (!Number.isFinite(stake) || stake < 62) return { error: "Stake must be at least 62 CKB." };
        const days = Math.trunc(input.days);
        if (!Number.isFinite(days) || days < 1) return { error: "Days must be at least 1." };
        const bar = Math.trunc(input.bar);
        if (!Number.isFinite(bar) || bar < 1) return { error: "Bar must be a positive integer." };
        const me = squad.members.find((m) => m.isSelf);
        if (!me) return { error: "No self member." };

        const id = newId();
        const challenge: Challenge = {
          id,
          squadId: squad.id,
          name: input.name.trim() || "Untitled",
          fiber: input.fiber,
          bar,
          unit: input.unit,
          customRule: input.customRule,
          minDuration: input.minDuration,
          days,
          stakeCkb: stake,
          startDate: input.startDate || ymd(),
          status: "open",
          memberIds: squad.members.map((m) => m.id),
          lockTxHash: input.lockTxHash,
          potAddress: input.potAddress ?? squad.potAddress,
        };
        challenge.status = derivedStatus(challenge);
        set((s) => ({
          challenges: [...s.challenges, challenge],
          selectedChallengeId: id,
          overlay: "none",
          tab: "home",
        }));
        return { id };
      },

      setProof: (challengeId, memberId, day, proofValue, proofMinutes) => {
        const ch = get().challenges.find((c) => c.id === challengeId);
        if (!ch || ch.status === "settled") return;
        const existing = findCheckin(get().checkins, challengeId, memberId, day);
        if (existing?.sealedAt || existing?.missed) return;
        set((s) => ({
          checkins: upsertCheckin(s.checkins, {
            challengeId,
            memberId,
            dayIndex: day,
            proofValue,
            proofMinutes,
            sealedAt: existing?.sealedAt,
            missed: existing?.missed,
          }),
        }));
      },

      seal: (challengeId, memberId, day) => {
        const ch = get().challenges.find((c) => c.id === challengeId);
        if (!ch || ch.status === "settled") return { error: "Board is locked." };
        if (day < 0 || day >= ch.days) return { error: "Invalid day." };
        const idx = dayIndex(ch.startDate, ch.days);
        if (day > idx) return { error: "That day is not open." };
        const row = findCheckin(get().checkins, challengeId, memberId, day);
        if (!barMet(ch, row)) return { error: "Bar not met." };
        set((s) => ({
          checkins: upsertCheckin(s.checkins, {
            challengeId,
            memberId,
            dayIndex: day,
            proofValue: row?.proofValue,
            proofMinutes: row?.proofMinutes,
            sealedAt: nowStamp(),
            missed: false,
          }),
        }));
        return {};
      },

      miss: (challengeId, memberId, day) => {
        const ch = get().challenges.find((c) => c.id === challengeId);
        if (!ch || ch.status === "settled") return { error: "Board is locked." };
        const idx = dayIndex(ch.startDate, ch.days);
        if (day > idx) return { error: "That day is not open." };
        const row = findCheckin(get().checkins, challengeId, memberId, day);
        set((s) => ({
          checkins: upsertCheckin(s.checkins, {
            challengeId,
            memberId,
            dayIndex: day,
            proofValue: row?.proofValue,
            proofMinutes: row?.proofMinutes,
            missed: true,
            sealedAt: undefined,
          }),
        }));
        return {};
      },

      toggleMark: (challengeId, memberId, day) => {
        const ch = get().challenges.find((c) => c.id === challengeId);
        if (!ch || ch.status === "settled") return;
        const idx = dayIndex(ch.startDate, ch.days);
        if (day > idx || day < 0 || day >= ch.days) return;
        const row = findCheckin(get().checkins, challengeId, memberId, day);
        if (isSealed(row)) {
          get().miss(challengeId, memberId, day);
          return;
        }
        if (row?.missed) {
          set((s) => ({
            checkins: s.checkins.filter(
              (c) =>
                !(
                  c.challengeId === challengeId &&
                  c.memberId === memberId &&
                  c.dayIndex === day
                )
            ),
          }));
          return;
        }
        set((s) => ({
          checkins: upsertCheckin(s.checkins, {
            challengeId,
            memberId,
            dayIndex: day,
            proofValue: Math.max(ch.bar, row?.proofValue ?? ch.bar),
            proofMinutes: ch.minDuration ?? row?.proofMinutes,
            sealedAt: nowStamp(),
            missed: false,
          }),
        }));
      },

      confirm: (challengeId, memberId, payoutTxHash) => {
        const ch = get().challenges.find((c) => c.id === challengeId);
        if (!ch || ch.status === "settled") return;
        get().syncStatuses();
        const live = get().challenges.find((c) => c.id === challengeId);
        if (!live || live.status !== "confirming") return;

        let confirmedBy = get().settlements.find((x) => x.challengeId === challengeId)?.confirmedBy ?? [];
        if (!confirmedBy.includes(memberId)) confirmedBy = [...confirmedBy, memberId];

        const threshold = Math.ceil(live.memberIds.length / 2);
        if (confirmedBy.length < threshold) {
          set((s) => ({
            settlements: [
              ...s.settlements.filter((x) => x.challengeId !== challengeId),
              {
                challengeId,
                confirmedBy,
                payouts: [],
                leftoverTo: null,
                leftoverCkb: 0,
                settledAt: 0,
              },
            ],
          }));
          return;
        }

        const { payouts, leftoverTo, leftoverCkb } = settlePayouts(live, get().checkins);
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === challengeId ? { ...c, status: "settled" as const } : c
          ),
          settlements: [
            ...s.settlements.filter((x) => x.challengeId !== challengeId),
            {
              challengeId,
              confirmedBy,
              payouts,
              leftoverTo,
              leftoverCkb,
              settledAt: Date.now(),
              payoutTxHash,
            },
          ],
        }));
      },

      deleteChallenge: (id) => {
        const ch = get().challenges.find((c) => c.id === id);
        if (!ch) return { error: "No challenge." };
        if (ch.status === "settled") return { error: "Settled boards stay." };
        const seals = get().checkins.some((c) => c.challengeId === id && c.sealedAt);
        if (seals) return { error: "Has seals. Abandon instead." };
        set((s) => ({
          challenges: s.challenges.filter((c) => c.id !== id),
          checkins: s.checkins.filter((c) => c.challengeId !== id),
          settlements: s.settlements.filter((c) => c.challengeId !== id),
          selectedChallengeId: s.selectedChallengeId === id ? null : s.selectedChallengeId,
        }));
        return {};
      },

      abandonChallenge: (id) => {
        const ch = get().challenges.find((c) => c.id === id);
        if (!ch) return { error: "No challenge." };
        if (ch.status === "settled") return { error: "Already settled." };
        set((s) => ({
          challenges: s.challenges.filter((c) => c.id !== id),
          checkins: s.checkins.filter((c) => c.challengeId !== id),
          settlements: s.settlements.filter((c) => c.challengeId !== id),
          selectedChallengeId: s.selectedChallengeId === id ? null : s.selectedChallengeId,
        }));
        return {};
      },

      syncStatuses: () => {
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.status === "settled" ? c : { ...c, status: derivedStatus(c) }
          ),
        }));
      },
    }),
    {
      name: "fiber-fit-v3",
      skipHydration: true,
      partialize: (s) => ({
        challenges: s.challenges,
        checkins: s.checkins,
        settlements: s.settlements,
        availableCkb: s.availableCkb,
        selectedSquadId: s.selectedSquadId,
        selectedChallengeId: s.selectedChallengeId,
      }),
    }
  )
);

export function selfMember(squad: Squad | undefined) {
  return squad?.members.find((m) => m.isSelf) ?? null;
}

export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useFitStore.persist.onFinishHydration(() => setHydrated(true));
    void useFitStore.persist.rehydrate();
    setHydrated(useFitStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
