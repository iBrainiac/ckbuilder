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

const globalForDb = globalThis as unknown as {
  appDb?: AppDb;
  appDbReady?: Promise<AppDb>;
};

function postgresUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return url;
  return null;
}

async function openPostgres(url: string): Promise<AppDb> {
  const sql = postgres(url, { max: 5, connect_timeout: 4 });
  await sql`select 1`;
  await sql.unsafe(SCHEMA_SQL);
  return drizzlePg(sql, { schema });
}

async function openPglite(): Promise<AppDb> {
  const dir = join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(join(dir, "fiberfit"));
  await client.waitReady;
  await client.exec(SCHEMA_SQL);
  return drizzlePglite({ client, schema });
}

async function createDb(): Promise<AppDb> {
  const url = postgresUrl();
  if (url) {
    try {
      return await openPostgres(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Postgres unavailable (${msg}). Using local file database in .data/fiberfit.`);
    }
  }
  return openPglite();
}

export async function getDb(): Promise<AppDb> {
  if (globalForDb.appDb) return globalForDb.appDb;
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
