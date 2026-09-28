// Applies pending SQL files from db/migrations in filename order. Safe to run repeatedly.
import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = new URL("../db/migrations/", import.meta.url);
const LOCK_ID = 727_001; // arbitrary constant for pg_advisory_lock

export async function migrate(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    // Only one migrator at a time, e.g. if two deploys build concurrently.
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.name));
    const pending = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql") && !applied.has(f)).sort();

    if (!pending.length) console.log("No pending migrations.");
    for (const file of pending) {
      const sql = await readFile(new URL(file, MIGRATIONS_DIR), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

// Run directly (not when imported by db-reset.mjs).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") {
    console.log(`Skipping migrations for ${process.env.VERCEL_ENV} deployment.`);
    process.exit(0);
  }
  // Prefer the direct (non-pooled) connection that Neon provides for schema changes.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  try {
    await migrate(url);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
