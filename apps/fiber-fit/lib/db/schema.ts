import { pgTable, text, timestamp, uniqueIndex, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  address: text("address").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const squads = pgTable(
  "squads",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    inviteCode: text("invite_code").notNull(),
    creatorAddress: text("creator_address").notNull(),
    potAddress: text("pot_address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    inviteUniq: uniqueIndex("squads_invite_code_uniq").on(t.inviteCode),
  })
);

export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    squadId: text("squad_id")
      .notNull()
      .references(() => squads.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memberUniq: uniqueIndex("members_squad_address_uniq").on(t.squadId, t.address),
  })
);

export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  squadId: text("squad_id")
    .notNull()
    .references(() => squads.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fiber: text("fiber").notNull(),
  bar: integer("bar").notNull(),
  unit: text("unit").notNull(),
  customRule: text("custom_rule"),
  minDuration: integer("min_duration"),
  days: integer("days").notNull(),
  stakeCkb: integer("stake_ckb").notNull(),
  startDate: text("start_date").notNull(),
  status: text("status").notNull(),
  potAddress: text("pot_address").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeMembers = pgTable(
  "challenge_members",
  {
    id: text("id").primaryKey(),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    memberId: text("member_id").notNull(),
    address: text("address").notNull(),
    lockTxHash: text("lock_tx_hash"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
  },
  (t) => ({
    addrUniq: uniqueIndex("challenge_members_addr_uniq").on(t.challengeId, t.address),
    memberUniq: uniqueIndex("challenge_members_member_uniq").on(t.challengeId, t.memberId),
  })
);

export const checkins = pgTable(
  "checkins",
  {
    id: text("id").primaryKey(),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    memberId: text("member_id").notNull(),
    dayIndex: integer("day_index").notNull(),
    sealedAt: text("sealed_at"),
    missed: boolean("missed").notNull().default(false),
    proofValue: integer("proof_value"),
    proofMinutes: integer("proof_minutes"),
  },
  (t) => ({
    dayUniq: uniqueIndex("checkins_day_uniq").on(t.challengeId, t.memberId, t.dayIndex),
  })
);

export const confirmations = pgTable(
  "confirmations",
  {
    id: text("id").primaryKey(),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    memberId: text("member_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    confirmUniq: uniqueIndex("confirmations_member_uniq").on(t.challengeId, t.memberId),
  })
);

export const settlements = pgTable("settlements", {
  challengeId: text("challenge_id")
    .primaryKey()
    .references(() => challenges.id, { onDelete: "cascade" }),
  leftoverTo: text("leftover_to"),
  leftoverCkb: integer("leftover_ckb").notNull().default(0),
  payoutsJson: text("payouts_json").notNull(),
  payoutTxHash: text("payout_tx_hash"),
  settledAt: timestamp("settled_at", { withTimezone: true }).notNull().defaultNow(),
});
