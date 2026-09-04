import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export function issueLoginMessage(address: string): string {
  const issued = Date.now().toString();
  const mac = createHmac("sha256", secret()).update(`${address}|${issued}`).digest("hex");
  return [
    "Fiber Fit login",
    `Address: ${address}`,
    `Issued: ${issued}`,
    `Mac: ${mac}`,
  ].join("\n");
}

export function readLoginMessage(message: string): { address: string; issued: number } | null {
  const lines = message.split("\n");
  if (lines[0] !== "Fiber Fit login") return null;
  const address = lines.find((l) => l.startsWith("Address: "))?.slice("Address: ".length);
  const issuedRaw = lines.find((l) => l.startsWith("Issued: "))?.slice("Issued: ".length);
  const mac = lines.find((l) => l.startsWith("Mac: "))?.slice("Mac: ".length);
  if (!address || !issuedRaw || !mac) return null;
  const issued = Number(issuedRaw);
  if (!Number.isFinite(issued)) return null;
  if (Date.now() - issued > 10 * 60 * 1000) return null;
  const expected = createHmac("sha256", secret()).update(`${address}|${issuedRaw}`).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { address, issued };
}
