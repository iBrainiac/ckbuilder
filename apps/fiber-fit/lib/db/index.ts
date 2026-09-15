import { mkdirSync } from "fs";
import { join } from "path";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import { SCHEMA_SQL } from "./ensure-schema";

type AppDb =
  | ReturnType<typeof drizzlePg<typeof schema>>
  | ReturnType<typeof drizzlePglite<typeof schema>>;

type SqlExec = (sql: string) => Promise<void>;

/** Bump when SCHEMA_SQL gains tables so an already-open process reapplies IF NOT EXISTS. */
const SCHEMA_REV = 2;

const globalForDb = globalThis as unknown as {
  appDb?: AppDb;
  appDbReady?: Promise<AppDb>;
  appDbExec?: SqlExec;
  appSchemaRev?: number;
};

function postgresUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return url;
  return null;
}

async function ensureSchema(exec: SqlExec) {
  if (globalForDb.appSchemaRev === SCHEMA_REV) return;
  await exec(SCHEMA_SQL);
  globalForDb.appSchemaRev = SCHEMA_REV;
}

async function openPostgres(url: string): Promise<{ db: AppDb; exec: SqlExec }> {
  const sql = postgres(url, { max: 5, connect_timeout: 4 });
  await sql`select 1`;
  const exec: SqlExec = async (raw) => {
    await sql.unsafe(raw);
  };
  await exec(SCHEMA_SQL);
  return { db: drizzlePg(sql, { schema }), exec };
}

async function openPglite(): Promise<{ db: AppDb; exec: SqlExec }> {
  const dir = join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(join(dir, "fiberfit"));
  await client.waitReady;
  const exec: SqlExec = async (raw) => {
    await client.exec(raw);
  };
  await exec(SCHEMA_SQL);
  return { db: drizzlePglite({ client, schema }), exec };
}

async function createDb(): Promise<AppDb> {
  const url = postgresUrl();
  let opened: { db: AppDb; exec: SqlExec };
  if (url) {
    try {
      opened = await openPostgres(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Postgres unavailable (${msg}). Using local file database in .data/fiberfit.`);
      opened = await openPglite();
    }
  } else {
    opened = await openPglite();
  }
  globalForDb.appDbExec = opened.exec;
  globalForDb.appSchemaRev = SCHEMA_REV;
  return opened.db;
}

export async function getDb(): Promise<AppDb> {
  if (globalForDb.appDb && globalForDb.appSchemaRev !== SCHEMA_REV && !globalForDb.appDbExec) {
    globalForDb.appDb = undefined;
    globalForDb.appDbReady = undefined;
  }
  if (globalForDb.appDb) {
    if (globalForDb.appDbExec) await ensureSchema(globalForDb.appDbExec);
    return globalForDb.appDb;
  }
  if (!globalForDb.appDbReady) {
    globalForDb.appDbReady = createDb()
      .then((db) => {
        globalForDb.appDb = db;
        return db;
      })
      .catch((err) => {
        globalForDb.appDbReady = undefined;
        throw err;
      });
  }
  return globalForDb.appDbReady;
}
