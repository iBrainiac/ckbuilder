import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { members, squads } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { newInviteCode } from "@/lib/server/invite";
import { toClientSquad } from "@/lib/server/map-squad";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const db = await getDb();
  const mine = await db.select().from(members).where(eq(members.address, session.address));
  const out = [];
  for (const row of mine) {
    const [squad] = await db.select().from(squads).where(eq(squads.id, row.squadId));
    if (!squad) continue;
    const roster = await db.select().from(members).where(eq(members.squadId, squad.id));
    out.push(toClientSquad(squad, roster, session.address));
  }
  return NextResponse.json({ squads: out });
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { name?: string; displayName?: string };
    const name = body.name?.trim();
    const displayName = body.displayName?.trim();
    if (!name || !displayName) {
      return NextResponse.json({ error: "Squad name and display name required." }, { status: 400 });
    }
    const db = await getDb();
    const id = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    let inviteCode = newInviteCode();
    for (let i = 0; i < 5; i += 1) {
      const clash = await db.select({ id: squads.id }).from(squads).where(eq(squads.inviteCode, inviteCode));
      if (clash.length === 0) break;
      inviteCode = newInviteCode();
    }
    await db.insert(squads).values({
      id,
      name,
      inviteCode,
      creatorAddress: session.address,
      potAddress: session.address,
    });
    await db.insert(members).values({
      id: memberId,
      squadId: id,
      address: session.address,
      displayName,
    });
    const [squad] = await db.select().from(squads).where(eq(squads.id, id));
    const roster = await db.select().from(members).where(eq(members.squadId, id));
    if (!squad) {
      return NextResponse.json({ error: "Could not load squad." }, { status: 500 });
    }
    return NextResponse.json({ squad: toClientSquad(squad, roster, session.address) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
