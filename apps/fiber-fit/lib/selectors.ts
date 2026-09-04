import type { Challenge, FitSnapshot, Member, Payout } from "./types";
import { dayIndex } from "./time";
import { findCheckin, isMissed, isSealed, memberCompleted } from "./settlement";
import { MIN_CELL_CKB } from "./ckb";

export function squadById(s: FitSnapshot, id: string | null) {
  return s.squads.find((q) => q.id === id) ?? null;
}

export function memberMap(s: FitSnapshot): Map<string, Member> {
  const map = new Map<string, Member>();
  for (const q of s.squads) for (const m of q.members) map.set(m.id, m);
  return map;
}

export function selfId(s: FitSnapshot, squadId?: string | null): string | null {
  const squads = squadId ? s.squads.filter((q) => q.id === squadId) : s.squads;
  for (const q of squads) {
    const me = q.members.find((m) => m.isSelf);
    if (me) return me.id;
  }
  return null;
}

export function potOf(ch: Challenge): number {
  return ch.memberIds.length * ch.stakeCkb;
}

export function dayMark(
  s: FitSnapshot,
  ch: Challenge,
  memberId: string,
  day: number
): "sealed" | "missed" | "pending" | "future" {
  const idx = dayIndex(ch.startDate, ch.days);
  if (day > idx) return "future";
  const row = findCheckin(s.checkins, ch.id, memberId, day);
  if (isSealed(row)) return "sealed";
  if (isMissed(row)) return "missed";
  if (day === idx) return "pending";
  return "missed";
}

export function projected(s: FitSnapshot, ch: Challenge) {
  const complete: string[] = [];
  const missed: string[] = [];
  for (const id of ch.memberIds) {
    if (memberCompleted(ch, id, s.checkins)) complete.push(id);
    else missed.push(id);
  }
  return { complete, missed };
}

export function vault(s: FitSnapshot, chainCkb: number | null) {
  const me = selfId(s);
  const locked = s.challenges
    .filter((c) => c.status !== "settled" && me && c.memberIds.includes(me))
    .reduce((n, c) => n + c.stakeCkb, 0);
  const earned = s.settlements.reduce((n, st) => {
    const ch = s.challenges.find((c) => c.id === st.challengeId);
    if (!ch || ch.status !== "settled") return n;
    const mine = st.payouts.find((p) => p.memberId === me);
    if (!mine) return n;
    const gain = mine.amountCkb - ch.stakeCkb;
    return n + Math.max(0, gain);
  }, 0);
  return { available: chainCkb ?? 0, locked, earned };
}

export function confirmsOf(s: FitSnapshot, challengeId: string): string[] {
  return s.settlements.find((x) => x.challengeId === challengeId)?.confirmedBy ?? [];
}

export function outboundPayouts(
  payouts: Payout[],
  members: Map<string, Member>,
  fromAddress: string | null
): { address: string; amountCkb: number }[] {
  return payouts.flatMap((p) => {
    const addr = members.get(p.memberId)?.ckbAddress;
    if (!addr || p.amountCkb < MIN_CELL_CKB) return [];
    if (fromAddress && addr === fromAddress) return [];
    return [{ address: addr, amountCkb: p.amountCkb }];
  });
}
