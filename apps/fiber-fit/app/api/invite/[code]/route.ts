import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { members, squads } from "@/lib/db/schema";

export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Code required." }, { status: 400 });
  }
  try {
    const db = await getDb();
    const [squad] = await db.select().from(squads).where(eq(squads.inviteCode, code));
    if (!squad) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    const roster = await db.select().from(members).where(eq(members.squadId, squad.id));
    return NextResponse.json({
      name: squad.name,
      memberCount: roster.length,
      code: squad.inviteCode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
