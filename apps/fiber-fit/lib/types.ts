export const FIBERS = [
  "Move",
  "Train",
  "Lift",
  "Run",
  "Ride",
  "Show up",
  "Custom",
] as const;

export type FiberKind = (typeof FIBERS)[number];

export type Unit =
  | "steps"
  | "active_min"
  | "workouts"
  | "sessions"
  | "km"
  | "minutes"
  | "checkin"
  | "yesno";

export type ChallengeStatus = "open" | "confirming" | "settled";

export type DayMark = "sealed" | "missed" | "pending" | "future";

export type Member = {
  id: string;
  name: string;
  createdAt: number;
  isSelf: boolean;
  ckbAddress?: string;
};

export type Squad = {
  id: string;
  name: string;
  members: Member[];
  potAddress?: string;
  inviteCode?: string;
};

export type Challenge = {
  id: string;
  squadId: string;
  name: string;
  fiber: FiberKind;
  bar: number;
  unit: Unit;
  customRule?: string;
  minDuration?: number;
  days: number;
  stakeCkb: number;
  startDate: string;
  status: ChallengeStatus;
  memberIds: string[];
  potAddress?: string;
  lockTxHash?: string;
};

export type Checkin = {
  challengeId: string;
  memberId: string;
  dayIndex: number;
  sealedAt?: string;
  missed?: boolean;
  proofValue?: number;
  proofMinutes?: number;
};

export type Payout = {
  memberId: string;
  amountCkb: number;
};

export type Settlement = {
  challengeId: string;
  confirmedBy: string[];
  payouts: Payout[];
  leftoverTo: string | null;
  leftoverCkb: number;
  settledAt: number;
  payoutTxHash?: string;
};

export type FitSnapshot = {
  squads: Squad[];
  challenges: Challenge[];
  checkins: Checkin[];
  settlements: Settlement[];
  availableCkb: number;
  selectedSquadId: string | null;
  selectedChallengeId: string | null;
};
