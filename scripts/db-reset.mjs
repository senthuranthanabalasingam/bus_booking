// Local development only: wipes the database and re-applies all migrations.
import pg from "pg";
import { migrate } from "./db-migrate.mjs";

const url = process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : "";
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`Refusing to reset a non-local database (host: "${host || "unset"}").`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await client.end();
  await migrate(url);
  console.log("Database reset.");
} catch (err) {
  console.error("Reset failed:", err.message);
  process.exit(1);
}
