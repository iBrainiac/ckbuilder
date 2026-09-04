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
`;
