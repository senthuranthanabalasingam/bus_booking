import { readFile } from "node:fs/promises";
import pg from "pg";

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log("Database schema created.");
} catch (err) {
  console.error("Failed to initialise database:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
