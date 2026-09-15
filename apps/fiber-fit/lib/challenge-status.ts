import type { Challenge } from "./types";
import { dayIndex } from "./time";

export function derivedStatus(ch: Pick<Challenge, "status" | "startDate" | "days">, now = new Date()): Challenge["status"] {
  if (ch.status === "settled") return "settled";
  const idx = dayIndex(ch.startDate, ch.days, now);
  if (idx >= ch.days - 1) return "confirming";
  return "open";
}

export function hasLocked(ch: Pick<Challenge, "locks">, memberId: string): boolean {
  return ch.locks.some((l) => l.memberId === memberId);
}
