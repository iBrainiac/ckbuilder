import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { members, squads } from "@/lib/db/schema";
import { readSession } from "@/lib/server/session";
import { toClientSquad } from "@/lib/server/map-squad";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { code?: string; displayName?: string };
    const code = body.code?.trim().toUpperCase();
    const displayName = body.displayName?.trim();
    if (!code || !displayName) {
      return NextResponse.json({ error: "Invite code and display name required." }, { status: 400 });
    }
    const db = await getDb();
    const [squad] = await db.select().from(squads).where(eq(squads.inviteCode, code));
    if (!squad) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    const roster = await db.select().from(members).where(eq(members.squadId, squad.id));
    const existing = roster.find((m) => m.address === session.address);
    if (existing) {
      return NextResponse.json({ squad: toClientSquad(squad, roster, session.address) });
    }
    await db.insert(members).values({
      id: crypto.randomUUID(),
      squadId: squad.id,
      address: session.address,
      displayName,
    });
    const next = await db.select().from(members).where(eq(members.squadId, squad.id));
    return NextResponse.json({ squad: toClientSquad(squad, next, session.address) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
