import { NextResponse } from "next/server";
import { issueLoginMessage } from "@/lib/server/login-message";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { address?: string };
    const address = body.address?.trim();
    if (!address) {
      return NextResponse.json({ error: "Address required." }, { status: 400 });
    }
    return NextResponse.json({ message: issueLoginMessage(address) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
