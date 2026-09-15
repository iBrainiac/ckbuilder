import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { challengeMembers, checkins, confirmations } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { findSeat, getChallengeRow, loadBoard, persistSettlement, toClientChallenge } from "@/lib/server/board";
import { derivedStatus } from "@/lib/challenge-status";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { payoutTxHash?: string };
    const row = await getChallengeRow(params.id);
    if (!row) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }
    if (row.status === "settled") {
      return NextResponse.json(await loadBoard(session.address));
    }
    const db = await getDb();
    const roster = await db.select().from(challengeMembers).where(eq(challengeMembers.challengeId, params.id));
    const challenge = toClientChallenge(row, roster, session.address);
    if (derivedStatus(challenge) !== "confirming") {
      return NextResponse.json({ error: "Not confirm day yet." }, { status: 400 });
    }
    const seat = await findSeat(params.id, session.address);
    if (!seat) {
      return NextResponse.json({ error: "Not in this challenge." }, { status: 403 });
    }
    if (!seat.lockTxHash) {
      return NextResponse.json({ error: "Lock your stake first." }, { status: 400 });
    }

    await db
      .insert(confirmations)
      .values({
        id: crypto.randomUUID(),
        challengeId: params.id,
        memberId: seat.memberId,
      })
      .onConflictDoNothing();

    const votes = await db.select().from(confirmations).where(eq(confirmations.challengeId, params.id));
    const threshold = Math.ceil(challenge.memberIds.length / 2);
    if (votes.length >= threshold) {
      const checkinRows = await db.select().from(checkins).where(eq(checkins.challengeId, params.id));
      const mapped = checkinRows.map((c) => ({
        challengeId: c.challengeId,
        memberId: c.memberId,
        dayIndex: c.dayIndex,
        sealedAt: c.sealedAt ?? undefined,
        missed: c.missed || undefined,
        proofValue: c.proofValue ?? undefined,
        proofMinutes: c.proofMinutes ?? undefined,
      }));
      await persistSettlement(challenge, mapped, body.payoutTxHash?.trim() || undefined);
    }
    return NextResponse.json(await loadBoard(session.address));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
