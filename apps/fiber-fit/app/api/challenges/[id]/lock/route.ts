import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { challengeMembers } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { findSeat, getChallengeRow, loadBoard } from "@/lib/server/board";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { txHash?: string };
    const txHash = body.txHash?.trim();
    if (!txHash) {
      return NextResponse.json({ error: "Lock transaction required." }, { status: 400 });
    }
    const row = await getChallengeRow(params.id);
    if (!row) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }
    if (row.status === "settled") {
      return NextResponse.json({ error: "Already settled." }, { status: 400 });
    }
    const seat = await findSeat(params.id, session.address);
    if (!seat) {
      return NextResponse.json({ error: "Not in this challenge." }, { status: 403 });
    }
    if (seat.lockTxHash) {
      return NextResponse.json({ error: "Already locked." }, { status: 400 });
    }
    const db = await getDb();
    await db
      .update(challengeMembers)
      .set({ lockTxHash: txHash, lockedAt: new Date() })
      .where(and(eq(challengeMembers.challengeId, params.id), eq(challengeMembers.address, session.address)));
    return NextResponse.json(await loadBoard(session.address));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
