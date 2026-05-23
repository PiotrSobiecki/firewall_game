import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: brak DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);
try {
  const [info] = await sql`SELECT current_database() AS db, current_user AS usr`;
  console.log("OK connect:", info);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY 1`;
  console.log(
    "Tables:",
    tables.length ? tables.map((t) => t.table_name).join(", ") : "(brak)",
  );

  const hasScores = tables.some((t) => t.table_name === "scores");
  if (hasScores) {
    const [row] = await sql`SELECT COUNT(*)::int AS c FROM scores`;
    console.log("scores rows:", row.c);
  } else {
    console.log("scores: tabela nie istnieje — uruchom schema.sql");
  }
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
