import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
