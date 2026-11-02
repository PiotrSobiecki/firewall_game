import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

type Bindings = {
  DATABASE_URL: string;
  /** Opcjonalny binding Cloudflare Rate Limiting (wrangler.jsonc); bez niego POST nie jest limitowany. */
  SCORE_RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
};

const REASONS = ["win", "death", "timeout"] as const;

// Granice wiarygodności: klient jest niezaufany, więc odrzucamy wyniki, których
// gra nie jest w stanie wyprodukować (zamiast zapisywać np. score 1e15 albo
// wygraną w 0 ms). Rzeczywista runda to setki punktów i minuty, nie więcej.
const MAX_SCORE = 1_000_000;
const MAX_TIME_MS = 24 * 60 * 60 * 1000;
const MIN_WIN_TIME_MS = 1000;
const MAX_NAME_LENGTH = 12;

/** Nick: tylko litery, cyfry, spacja i kilka znaków; bez znaków sterujących i spoza BMP. */
function cleanName(raw: unknown): string {
  const name = String(raw ?? "")
    .replace(/[^\p{L}\p{N} _.\-]/gu, "")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return name || "GRACZ";
}

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
  // Limit na IP (binding opcjonalny): jedna runda trwa minuty, więc 10 zapisów
  // na minutę z jednego adresu to i tak dużo. Bez bindingu zapis idzie dalej.
  const limiter = c.env.SCORE_RATE_LIMITER;
  if (limiter) {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    const { success } = await limiter.limit({ key: `scores:${ip}` }).catch(() => ({ success: true }));
    if (!success) return c.json({ error: "too many requests" }, 429, { "Retry-After": "60" });
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "bad json" }, 400);

  const name = cleanName(body.name);
  const reason = body.reason;
  const score = Number(body.score);
  const timeMs = Number(body.timeMs);
  if (
    !REASONS.includes(reason) ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > MAX_SCORE ||
    !Number.isFinite(timeMs) ||
    timeMs < 0 ||
    timeMs > MAX_TIME_MS ||
    (reason === "win" && timeMs < MIN_WIN_TIME_MS)
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
