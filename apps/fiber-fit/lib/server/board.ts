import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  challengeMembers,
  challenges,
  checkins,
  confirmations,
  settlements,
} from "@/lib/db/schema";
import { derivedStatus } from "@/lib/challenge-status";
import { settlePayouts } from "@/lib/settlement";
import type { Challenge, Checkin, FitSnapshot, Settlement } from "@/lib/types";
import type { FiberKind, Unit } from "@/lib/types";

export type BoardPayload = Pick<FitSnapshot, "challenges" | "checkins" | "settlements">;

type ChallengeRow = typeof challenges.$inferSelect;
type ChallengeMemberRow = typeof challengeMembers.$inferSelect;
type CheckinRow = typeof checkins.$inferSelect;
type SettlementRow = typeof settlements.$inferSelect;

export function toClientChallenge(
  row: ChallengeRow,
  roster: ChallengeMemberRow[],
  selfAddress: string
): Challenge {
  const ordered = [...roster].sort((a, b) => a.memberId.localeCompare(b.memberId));
  const locks = ordered
    .filter((m) => m.lockTxHash)
    .map((m) => ({ memberId: m.memberId, txHash: m.lockTxHash as string }));
  const mine = ordered.find((m) => m.address === selfAddress);
  const ch: Challenge = {
    id: row.id,
    squadId: row.squadId,
    name: row.name,
    fiber: row.fiber as FiberKind,
    bar: row.bar,
    unit: row.unit as Unit,
    customRule: row.customRule ?? undefined,
    minDuration: row.minDuration ?? undefined,
    days: row.days,
    stakeCkb: row.stakeCkb,
    startDate: row.startDate,
    status: row.status as Challenge["status"],
    memberIds: ordered.map((m) => m.memberId),
    potAddress: row.potAddress,
    lockTxHash: mine?.lockTxHash ?? locks[0]?.txHash,
    locks,
  };
  ch.status = derivedStatus(ch);
  return ch;
}

function toClientCheckin(row: CheckinRow): Checkin {
  return {
    challengeId: row.challengeId,
    memberId: row.memberId,
    dayIndex: row.dayIndex,
    sealedAt: row.sealedAt ?? undefined,
    missed: row.missed || undefined,
    proofValue: row.proofValue ?? undefined,
    proofMinutes: row.proofMinutes ?? undefined,
  };
}

function toClientSettlement(row: SettlementRow, confirmedBy: string[]): Settlement {
  let payouts: Settlement["payouts"] = [];
  try {
    payouts = JSON.parse(row.payoutsJson) as Settlement["payouts"];
  } catch {
    payouts = [];
  }
  return {
    challengeId: row.challengeId,
    confirmedBy,
    payouts,
    leftoverTo: row.leftoverTo,
    leftoverCkb: row.leftoverCkb,
    settledAt: row.settledAt.getTime(),
    payoutTxHash: row.payoutTxHash ?? undefined,
  };
}

export async function loadBoard(selfAddress: string): Promise<BoardPayload> {
  const db = await getDb();
  const seats = await db.select().from(challengeMembers).where(eq(challengeMembers.address, selfAddress));
  const ids = [...new Set(seats.map((s) => s.challengeId))];
  if (ids.length === 0) {
    return { challenges: [], checkins: [], settlements: [] };
  }
  const chRows = await db.select().from(challenges).where(inArray(challenges.id, ids));
  const roster = await db.select().from(challengeMembers).where(inArray(challengeMembers.challengeId, ids));
  const checkinRows = await db.select().from(checkins).where(inArray(checkins.challengeId, ids));
  const confirmRows = await db.select().from(confirmations).where(inArray(confirmations.challengeId, ids));
  const settleRows = await db.select().from(settlements).where(inArray(settlements.challengeId, ids));

  const byChallenge = new Map<string, ChallengeMemberRow[]>();
  for (const row of roster) {
    const list = byChallenge.get(row.challengeId) ?? [];
    list.push(row);
    byChallenge.set(row.challengeId, list);
  }
  const confirms = new Map<string, string[]>();
  for (const row of confirmRows) {
    const list = confirms.get(row.challengeId) ?? [];
    list.push(row.memberId);
    confirms.set(row.challengeId, list);
  }

  const clientChallenges = chRows.map((row) =>
    toClientChallenge(row, byChallenge.get(row.id) ?? [], selfAddress)
  );

  const clientSettlements: Settlement[] = [];
  for (const row of settleRows) {
    clientSettlements.push(toClientSettlement(row, confirms.get(row.challengeId) ?? []));
  }
  for (const [challengeId, confirmedBy] of confirms) {
    if (clientSettlements.some((s) => s.challengeId === challengeId)) continue;
    clientSettlements.push({
      challengeId,
      confirmedBy,
      payouts: [],
      leftoverTo: null,
      leftoverCkb: 0,
      settledAt: 0,
    });
  }

  return {
    challenges: clientChallenges,
    checkins: checkinRows.map(toClientCheckin),
    settlements: clientSettlements,
  };
}

export async function findSeat(challengeId: string, address: string) {
  const db = await getDb();
  const [seat] = await db
    .select()
    .from(challengeMembers)
    .where(and(eq(challengeMembers.challengeId, challengeId), eq(challengeMembers.address, address)));
  return seat ?? null;
}

export async function getChallengeRow(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(challenges).where(eq(challenges.id, id));
  return row ?? null;
}

export async function persistSettlement(
  challenge: Challenge,
  checkinRows: Checkin[],
  payoutTxHash?: string
) {
  const db = await getDb();
  const { payouts, leftoverTo, leftoverCkb } = settlePayouts(challenge, checkinRows);
  await db.update(challenges).set({ status: "settled" }).where(eq(challenges.id, challenge.id));
  await db
    .insert(settlements)
    .values({
      challengeId: challenge.id,
      leftoverTo,
      leftoverCkb,
      payoutsJson: JSON.stringify(payouts),
      payoutTxHash,
    })
    .onConflictDoNothing({ target: settlements.challengeId });
}
