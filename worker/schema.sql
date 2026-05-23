-- Ranking gry Firewall. Uruchom raz: psql "$DATABASE_URL" -f schema.sql
CREATE TABLE IF NOT EXISTS scores (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  reason     TEXT NOT NULL,
  score      INTEGER NOT NULL,
  time_ms    INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scores_rank_idx ON scores (reason, time_ms, score DESC);
