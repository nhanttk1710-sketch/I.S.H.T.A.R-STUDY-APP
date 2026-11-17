import { Pool } from "pg";

const globalForPool = globalThis as unknown as { ishtarPool?: Pool };

function createPool() {
  const connectionString =
    process.env.ISHTAR_POSTGRES_DATABASE_URL ||
    process.env.ISHTAR_POSTGRES_POSTGRES_URL ||
    process.env.ISHTAR_DATABASE_URL ||
    process.env.ISHTAR_POSTGRES_URL;
  if (!connectionString) {
    throw new Error("Missing ISHTAR_POSTGRES_DATABASE_URL (or a compatible ISHTAR database URL) environment variable.");
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });
}

export const db = globalForPool.ishtarPool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForPool.ishtarPool = db;
