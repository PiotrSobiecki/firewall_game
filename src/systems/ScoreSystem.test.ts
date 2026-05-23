import { describe, it, expect } from "vitest";
import { ScoreSystem } from "./ScoreSystem";
import { ENEMY_POINTS, TARGET_SCORE } from "../config";

// Pomocnik: zabójstwo „świeże" (poza oknem combo), więc mnożnik = ×1.
const FAR = 100_000;

describe("ScoreSystem — punkty i próg", () => {
  it("starts with a score of zero", () => {
    expect(new ScoreSystem().score).toBe(0);
  });

  it("awards table points per enemy type at ×1", () => {
    const s = new ScoreSystem();
    expect(s.addKill("virus", 0)).toBe(ENEMY_POINTS.virus);
    expect(s.addKill("trojan", FAR)).toBe(ENEMY_POINTS.trojan);
    expect(s.addKill("worm", 2 * FAR)).toBe(ENEMY_POINTS.worm);
    expect(s.addKill("spyware", 3 * FAR)).toBe(ENEMY_POINTS.spyware);
  });

  it("accumulates 10 spaced virus kills without combo", () => {
    const s = new ScoreSystem();
    for (let i = 0; i < 10; i++) s.addKill("virus", i * FAR);
    expect(s.score).toBe(10 * ENEMY_POINTS.virus);
  });

  it("crosses the win threshold after enough spaced virus kills", () => {
    const s = new ScoreSystem();
    const needed = Math.ceil(TARGET_SCORE / ENEMY_POINTS.virus);
    for (let i = 0; i < needed - 1; i++) s.addKill("virus", i * FAR);
    expect(s.hasReachedTarget()).toBe(false);
    s.addKill("virus", needed * FAR);
    expect(s.hasReachedTarget()).toBe(true);
  });
});

describe("ScoreSystem — combo", () => {
  it("raises the multiplier on consecutive kills within the window", () => {
    const s = new ScoreSystem();
    expect(s.addKill("virus", 0)).toBe(10); // combo 1 → ×1
    expect(s.addKill("virus", 500)).toBe(20); // combo 2 → ×2
    expect(s.addKill("virus", 1000)).toBe(30); // combo 3 → ×3
    expect(s.score).toBe(60);
  });

  it("caps the multiplier at ×3", () => {
    const s = new ScoreSystem();
    s.addKill("virus", 0);
    s.addKill("virus", 400);
    s.addKill("virus", 800);
    expect(s.addKill("virus", 1200)).toBe(30); // combo 4 → nadal ×3
    expect(s.multiplierAt(1200)).toBe(3);
  });

  it("resets the combo after a gap longer than the window", () => {
    const s = new ScoreSystem();
    s.addKill("virus", 0);
    s.addKill("virus", 500); // combo 2
    expect(s.addKill("virus", 3000)).toBe(10); // przerwa >2 s → combo 1 → ×1
    expect(s.multiplierAt(3000)).toBe(1);
  });

  it("reports no active combo once the window has elapsed", () => {
    const s = new ScoreSystem();
    s.addKill("virus", 0);
    expect(s.comboAt(500)).toBe(1);
    expect(s.comboAt(2500)).toBe(0);
    expect(s.multiplierAt(2500)).toBe(1);
  });
});

describe("ScoreSystem — bonus fali i śmierć", () => {
  it("adds a wave bonus without touching the combo", () => {
    const s = new ScoreSystem();
    s.addKill("virus", 0); // combo 1
    expect(s.addWaveBonus()).toBe(25);
    expect(s.score).toBe(35);
    expect(s.addKill("virus", 500)).toBe(20); // combo nadal rośnie → ×2
  });

  it("subtracts 15 on death, never below zero, and resets the combo", () => {
    const s = new ScoreSystem();
    s.addKill("virus", 0);
    s.addKill("virus", 500); // 30 pkt, combo 2
    s.onDeath();
    expect(s.score).toBe(15); // 30 - 15
    expect(s.multiplierAt(600)).toBe(1); // combo zresetowane

    const t = new ScoreSystem();
    t.addKill("virus", 0); // 10
    t.onDeath(); // 10 - 15 → 0
    expect(t.score).toBe(0);
  });
});
