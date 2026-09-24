import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const isCloudDb =
  process.env.DATABASE_URL?.includes("supabase.co") ||
  process.env.DATABASE_URL?.includes("pooler.supabase.com") ||
  process.env.DATABASE_URL?.includes("neon.tech") ||
  process.env.NODE_ENV === "production";

const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export const db = drizzle(pool, { schema });

