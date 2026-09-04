import { NextResponse } from "next/server";
import { Signer, Signature } from "@ckb-ccc/core";
import { readLoginMessage } from "@/lib/server/login-message";
import { createSessionCookie, sessionCookieName } from "@/lib/server/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

type SigBody = {
  signature?: string;
  identity?: string;
  signType?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      address?: string;
      message?: string;
      signature?: SigBody;
    };
    const address = body.address?.trim();
    const message = body.message;
    const raw = body.signature;
    if (!address || !message || !raw?.signature || !raw.identity || !raw.signType) {
      return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
    }

    const parsed = readLoginMessage(message);
    if (!parsed || parsed.address !== address) {
      return NextResponse.json({ error: "Login message expired or invalid." }, { status: 401 });
    }

    const sig = new Signature(raw.signature, raw.identity, raw.signType as never);
    const ok = await Signer.verifyMessage(message, sig);
    if (!ok) {
      return NextResponse.json({ error: "Bad signature." }, { status: 401 });
    }

    const identity = raw.identity.trim();
    const identIsAddr = identity.startsWith("ckt") || identity.startsWith("ckb");
    if (identIsAddr && identity !== address) {
      return NextResponse.json({ error: "Signature does not match address." }, { status: 401 });
    }

    const db = await getDb();
    await db.insert(users).values({ address }).onConflictDoNothing({ target: users.address });

    const token = await createSessionCookie(address);
    const res = NextResponse.json({ address });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
