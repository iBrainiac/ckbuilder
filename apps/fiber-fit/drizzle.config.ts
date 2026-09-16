import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnv() {
  // File wins over a stale `source .env` in the shell.
  for (const name of [".env", ".env.local"]) {
    const file = resolve(process.cwd(), name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i === -1) continue;
      const key = trimmed.slice(0, i).trim();
      process.env[key] = stripQuotes(trimmed.slice(i + 1));
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error("DATABASE_URL is missing in .env or .env.local.");
}
if (url.includes("localhost") || url.includes("127.0.0.1")) {
  throw new Error(
    "DATABASE_URL still points at this laptop. Paste the Supabase Direct connection (port 5432) into .env, then run npm run db:push again. Do not run source .env.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
