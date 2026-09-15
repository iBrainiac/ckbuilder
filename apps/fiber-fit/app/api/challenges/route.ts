import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { challengeMembers, challenges, members, squads } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { loadBoard } from "@/lib/server/board";
import { derivedStatus } from "@/lib/challenge-status";
import { FIBERS, type FiberKind, type Unit } from "@/lib/types";

const UNITS: Unit[] = [
  "steps",
  "active_min",
  "workouts",
  "sessions",
  "km",
  "minutes",
  "checkin",
  "yesno",
];

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const board = await loadBoard(session.address);
    return NextResponse.json(board);
  } catch (err) {
    console.error("GET /api/challenges", err);
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      squadId?: string;
      name?: string;
      fiber?: string;
      bar?: number;
      unit?: string;
      customRule?: string;
      minDuration?: number;
      days?: number;
      stakeCkb?: number;
      startDate?: string;
      lockTxHash?: string;
      potAddress?: string;
    };
    const squadId = body.squadId?.trim();
    const name = body.name?.trim();
    const fiber = body.fiber as FiberKind | undefined;
    const unit = body.unit as Unit | undefined;
    const lockTxHash = body.lockTxHash?.trim();
    const startDate = body.startDate?.trim();
    const stake = Math.trunc(Number(body.stakeCkb));
    const days = Math.trunc(Number(body.days));
    const bar = Math.trunc(Number(body.bar));
    if (!squadId || !name || !fiber || !unit || !lockTxHash || !startDate) {
      return NextResponse.json({ error: "Missing challenge fields." }, { status: 400 });
    }
    if (!FIBERS.includes(fiber) || !UNITS.includes(unit)) {
      return NextResponse.json({ error: "Invalid fiber or unit." }, { status: 400 });
    }
    if (!Number.isFinite(stake) || stake < 62) {
      return NextResponse.json({ error: "Stake must be at least 62 CKB." }, { status: 400 });
    }
    if (!Number.isFinite(days) || days < 1) {
      return NextResponse.json({ error: "Days must be at least 1." }, { status: 400 });
    }
    if (!Number.isFinite(bar) || bar < 1) {
      return NextResponse.json({ error: "Bar must be a positive integer." }, { status: 400 });
    }

    const db = await getDb();
    const [squad] = await db.select().from(squads).where(eq(squads.id, squadId));
    if (!squad) {
      return NextResponse.json({ error: "Squad not found." }, { status: 404 });
    }
    const roster = [...(await db.select().from(members).where(eq(members.squadId, squadId)))].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const me = roster.find((m) => m.address === session.address);
    if (!me) {
      return NextResponse.json({ error: "Join the squad first." }, { status: 403 });
    }
    if (roster.length < 1) {
      return NextResponse.json({ error: "Squad is empty." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const potAddress = (body.potAddress?.trim() || squad.potAddress).trim();
    const status = derivedStatus({
      status: "open",
      startDate,
      days,
    });
    const minDuration =
      body.minDuration != null && Number.isFinite(Number(body.minDuration))
        ? Math.trunc(Number(body.minDuration))
        : null;

    await db.insert(challenges).values({
      id,
      squadId,
      name,
      fiber,
      bar,
      unit,
      customRule: body.customRule?.trim() || null,
      minDuration,
      days,
      stakeCkb: stake,
      startDate,
      status,
      potAddress,
      createdBy: session.address,
    });
    await db.insert(challengeMembers).values(
      roster.map((m) => ({
        id: crypto.randomUUID(),
        challengeId: id,
        memberId: m.id,
        address: m.address,
        lockTxHash: m.address === session.address ? lockTxHash : null,
        lockedAt: m.address === session.address ? new Date() : null,
      }))
    );
    const board = await loadBoard(session.address);
    return NextResponse.json({ id, ...board });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
