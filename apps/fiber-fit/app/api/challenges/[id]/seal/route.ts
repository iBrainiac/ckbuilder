import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { checkins } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { findSeat, getChallengeRow, loadBoard, toClientChallenge } from "@/lib/server/board";
import { challengeMembers } from "@/lib/db/schema";
import { barMet } from "@/lib/settlement";
import { derivedStatus } from "@/lib/challenge-status";
import { dayIndex, nowStamp } from "@/lib/time";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      dayIndex?: number;
      proofValue?: number;
      proofMinutes?: number;
    };
    const day = Math.trunc(Number(body.dayIndex));
    if (!Number.isFinite(day) || day < 0) {
      return NextResponse.json({ error: "Invalid day." }, { status: 400 });
    }
    const row = await getChallengeRow(params.id);
    if (!row) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }
    const db = await getDb();
    const roster = await db.select().from(challengeMembers).where(eq(challengeMembers.challengeId, params.id));
    const challenge = toClientChallenge(row, roster, session.address);
    if (derivedStatus(challenge) === "settled" || row.status === "settled") {
      return NextResponse.json({ error: "Board is locked." }, { status: 400 });
    }
    const seat = await findSeat(params.id, session.address);
    if (!seat) {
      return NextResponse.json({ error: "Not in this challenge." }, { status: 403 });
    }
    if (!seat.lockTxHash) {
      return NextResponse.json({ error: "Lock your stake first." }, { status: 400 });
    }
    if (day >= challenge.days) {
      return NextResponse.json({ error: "Invalid day." }, { status: 400 });
    }
    const idx = dayIndex(challenge.startDate, challenge.days);
    if (day > idx) {
      return NextResponse.json({ error: "That day is not open." }, { status: 400 });
    }

    const existingRows = await db
      .select()
      .from(checkins)
      .where(and(eq(checkins.challengeId, params.id), eq(checkins.memberId, seat.memberId), eq(checkins.dayIndex, day)));
    const existing = existingRows[0];
    if (existing?.sealedAt || existing?.missed) {
      return NextResponse.json({ error: "Day already marked." }, { status: 400 });
    }

    const proofValue =
      body.proofValue != null && Number.isFinite(Number(body.proofValue))
        ? Math.trunc(Number(body.proofValue))
        : existing?.proofValue ?? undefined;
    const proofMinutes =
      body.proofMinutes != null && Number.isFinite(Number(body.proofMinutes))
        ? Math.trunc(Number(body.proofMinutes))
        : existing?.proofMinutes ?? undefined;
    const draft = {
      challengeId: params.id,
      memberId: seat.memberId,
      dayIndex: day,
      proofValue,
      proofMinutes,
    };
    if (!barMet(challenge, draft)) {
      return NextResponse.json({ error: "Bar not met." }, { status: 400 });
    }

    const sealedAt = nowStamp();
    if (existing) {
      await db
        .update(checkins)
        .set({
          proofValue: proofValue ?? null,
          proofMinutes: proofMinutes ?? null,
          sealedAt,
          missed: false,
        })
        .where(eq(checkins.id, existing.id));
    } else {
      await db.insert(checkins).values({
        id: crypto.randomUUID(),
        challengeId: params.id,
        memberId: seat.memberId,
        dayIndex: day,
        proofValue: proofValue ?? null,
        proofMinutes: proofMinutes ?? null,
        sealedAt,
        missed: false,
      });
    }
    return NextResponse.json(await loadBoard(session.address));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
