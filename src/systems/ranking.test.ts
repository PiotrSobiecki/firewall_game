import { describe, it, expect } from "vitest";
import { sortEntries, topEntries, qualifies, highScore, topName, type RunResult } from "./ranking";
import { LEADERBOARD_SIZE } from "../config";

const win = (name: string, score: number, timeMs: number): RunResult => ({
  name,
  reason: "win",
  score,
  timeMs,
});
const loss = (name: string, score: number): RunResult => ({
  name,
  reason: "timeout",
  score,
  timeMs: 390_000,
});

describe("ranking — sortowanie", () => {
  it("ranks wins by time ascending (faster first)", () => {
    const out = sortEntries([win("A", 1000, 120_000), win("B", 1000, 80_000), win("C", 1000, 95_000)]);
    expect(out.map((e) => e.timeMs)).toEqual([80_000, 95_000, 120_000]);
  });

  it("breaks a time tie between wins by score descending", () => {
    const out = sortEntries([win("LOW", 900, 95_000), win("HIGH", 1100, 95_000)]);
    expect(out.map((e) => e.name)).toEqual(["HIGH", "LOW"]);
  });

  it("ranks all wins above non-wins, then non-wins by score descending", () => {
    const out = sortEntries([
      loss("T1", 600),
      win("W", 1000, 100_000),
      { name: "D", reason: "death", score: 820, timeMs: 100_000 },
      loss("T2", 300),
    ]);
    expect(out.map((e) => [e.reason, e.score])).toEqual([
      ["win", 1000],
      ["death", 820],
      ["timeout", 600],
      ["timeout", 300],
    ]);
  });
});

describe("ranking — TOP N i kwalifikacja", () => {
  it("returns only the top N entries", () => {
    const list = Array.from({ length: LEADERBOARD_SIZE + 3 }, (_, i) =>
      win(`P${i}`, 1000, 60_000 + i * 1000),
    );
    const top = topEntries(list);
    expect(top).toHaveLength(LEADERBOARD_SIZE);
    expect(top[0].timeMs).toBe(60_000);
    expect(top[top.length - 1].timeMs).toBe(60_000 + (LEADERBOARD_SIZE - 1) * 1000);
  });

  it("qualifies any run while the board has fewer than N entries", () => {
    expect(qualifies([], loss("X", 10))).toBe(true);
  });

  it("qualifies a run only if it beats the current worst once the board is full", () => {
    const full = Array.from({ length: LEADERBOARD_SIZE }, (_, i) =>
      win(`P${i}`, 1000, 60_000 + i * 1000),
    );
    expect(qualifies(full, win("FAST", 1000, 50_000))).toBe(true);
    expect(qualifies(full, win("SLOW", 1000, 999_000))).toBe(false);
    expect(qualifies(full, loss("LOSS", 9999))).toBe(false);
  });
});

describe("ranking — highScore", () => {
  it("is zero for an empty list and the max score otherwise", () => {
    expect(highScore([])).toBe(0);
    expect(highScore([win("A", 700, 70_000), loss("B", 1200)])).toBe(1200);
  });
});

describe("ranking — topName", () => {
  it("is empty for an empty list", () => {
    expect(topName([])).toBe("");
  });

  it("returns the name of the #1 entry (win beats higher-scoring loss)", () => {
    expect(topName([loss("LOSER", 5000), win("ADMIN", 800, 70_000)])).toBe("ADMIN");
  });
});
