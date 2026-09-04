import type { Checkin, Challenge, Payout } from "./types";

export function isSealed(c: Checkin | undefined): boolean {
  return Boolean(c?.sealedAt) && !c?.missed;
}

export function isMissed(c: Checkin | undefined): boolean {
  return Boolean(c?.missed);
}

export function findCheckin(
  checkins: Checkin[],
  challengeId: string,
  memberId: string,
  dayIndex: number
): Checkin | undefined {
  return checkins.find(
    (c) => c.challengeId === challengeId && c.memberId === memberId && c.dayIndex === dayIndex
  );
}

export function barMet(challenge: Challenge, checkin: Checkin | undefined): boolean {
  if (challenge.unit === "checkin" || challenge.unit === "yesno") return true;
  const value = checkin?.proofValue ?? 0;
  if (value < challenge.bar) return false;
  if (challenge.unit === "workouts" && challenge.minDuration) {
    return (checkin?.proofMinutes ?? 0) >= challenge.minDuration;
  }
  return true;
}

export function memberCompleted(
  challenge: Challenge,
  memberId: string,
  checkins: Checkin[]
): boolean {
  for (let d = 0; d < challenge.days; d += 1) {
    const row = findCheckin(checkins, challenge.id, memberId, d);
    if (!isSealed(row)) return false;
  }
  return true;
}

/**
 * Integer CKB settlement. No floating dust.
 *
 * Completer = every day sealed.
 * Miss = any missed day, or any unsealed day at confirm time.
 *
 * Each completer receives: stake + floor(missedStakes / completerCount)
 * Remainder (missedStakes % completerCount) CKB goes to the first completer
 * by memberId localeCompare — not left in the pot.
 *
 * If nobody completes, or nobody misses, everyone is refunded their stake.
 */
export function settlePayouts(
  challenge: Challenge,
  checkins: Checkin[]
): { payouts: Payout[]; leftoverTo: string | null; leftoverCkb: number } {
  const stake = challenge.stakeCkb;
  const completed: string[] = [];
  const missed: string[] = [];
  for (const id of challenge.memberIds) {
    if (memberCompleted(challenge, id, checkins)) completed.push(id);
    else missed.push(id);
  }

  if (completed.length === 0 || missed.length === 0) {
    return {
      leftoverTo: null,
      leftoverCkb: 0,
      payouts: challenge.memberIds.map((memberId) => ({
        memberId,
        amountCkb: stake,
      })),
    };
  }

  const missedStakes = missed.length * stake;
  const share = Math.floor(missedStakes / completed.length);
  const leftoverCkb = missedStakes % completed.length;
  const ordered = [...completed].sort((a, b) => a.localeCompare(b));
  const leftoverTo = leftoverCkb > 0 ? ordered[0] : null;

  const payouts: Payout[] = [
    ...completed.map((memberId) => ({
      memberId,
      amountCkb: stake + share + (memberId === leftoverTo ? leftoverCkb : 0),
    })),
    ...missed.map((memberId) => ({ memberId, amountCkb: 0 })),
  ];
  return { payouts, leftoverTo, leftoverCkb };
}

export function formatCkb(amount: number): string {
  return Math.trunc(amount).toLocaleString("en-US");
}
