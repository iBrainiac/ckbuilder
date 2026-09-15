export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  address text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS squads (
  id text PRIMARY KEY,
  name text NOT NULL,
  invite_code text NOT NULL,
  creator_address text NOT NULL,
  pot_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS squads_invite_code_uniq ON squads (invite_code);
CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  squad_id text NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  address text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS members_squad_address_uniq ON members (squad_id, address);
CREATE TABLE IF NOT EXISTS challenges (
  id text PRIMARY KEY,
  squad_id text NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  name text NOT NULL,
  fiber text NOT NULL,
  bar integer NOT NULL,
  unit text NOT NULL,
  custom_rule text,
  min_duration integer,
  days integer NOT NULL,
  stake_ckb integer NOT NULL,
  start_date text NOT NULL,
  status text NOT NULL,
  pot_address text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS challenge_members (
  id text PRIMARY KEY,
  challenge_id text NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  address text NOT NULL,
  lock_tx_hash text,
  locked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS challenge_members_addr_uniq ON challenge_members (challenge_id, address);
CREATE UNIQUE INDEX IF NOT EXISTS challenge_members_member_uniq ON challenge_members (challenge_id, member_id);
CREATE TABLE IF NOT EXISTS checkins (
  id text PRIMARY KEY,
  challenge_id text NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  day_index integer NOT NULL,
  sealed_at text,
  missed boolean NOT NULL DEFAULT false,
  proof_value integer,
  proof_minutes integer
);
CREATE UNIQUE INDEX IF NOT EXISTS checkins_day_uniq ON checkins (challenge_id, member_id, day_index);
CREATE TABLE IF NOT EXISTS confirmations (
  id text PRIMARY KEY,
  challenge_id text NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS confirmations_member_uniq ON confirmations (challenge_id, member_id);
CREATE TABLE IF NOT EXISTS settlements (
  challenge_id text PRIMARY KEY REFERENCES challenges(id) ON DELETE CASCADE,
  leftover_to text,
  leftover_ckb integer NOT NULL DEFAULT 0,
  payouts_json text NOT NULL,
  payout_tx_hash text,
  settled_at timestamptz NOT NULL DEFAULT now()
);
`;
