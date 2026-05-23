import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

type Bindings = { DATABASE_URL: string };

const REASONS = ["win", "death", "timeout"] as const;

const app = new Hono<{ Bindings: Bindings }>();

// Front to statyczna strona na innym originie (CF Pages) → potrzebny CORS.
app.use("/*", cors());

/**
 * TOP 10: wygrani nad przegranymi; wygrani po czasie rosnąco (remis → pkt
 * malejąco); przegrani po pkt malejąco. Zgodne z frontowym `ranking.ts`.
 */
app.get("/scores", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    SELECT name, reason, score, time_ms AS "timeMs"
    FROM scores
    ORDER BY (reason = 'win') DESC,
             CASE WHEN reason = 'win' THEN time_ms END ASC NULLS LAST,
             score DESC
    LIMIT 10`;
  return c.json(rows);
});

/** Zapis wyniku rundy. Walidacja typu/zakresu (klient i tak jest niezaufany). */
app.post("/scores", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "bad json" }, 400);

  const name = String(body.name ?? "GRACZ").trim().slice(0, 12) || "GRACZ";
  const reason = body.reason;
  const score = Number(body.score);
  const timeMs = Number(body.timeMs);
  if (
    !REASONS.includes(reason) ||
    !Number.isFinite(score) ||
    score < 0 ||
    !Number.isFinite(timeMs) ||
    timeMs < 0
  ) {
    return c.json({ error: "invalid payload" }, 400);
  }

  const sql = neon(c.env.DATABASE_URL);
  await sql`
    INSERT INTO scores (name, reason, score, time_ms)
    VALUES (${name}, ${reason}, ${Math.round(score)}, ${Math.round(timeMs)})`;
  return c.json({ ok: true });
});

export default app;
