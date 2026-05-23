import { describe, it, expect } from "vitest";
import { RunController } from "./RunController";
import { SESSION_MAX_MS, WIN_SCORE_AFTER_MINI_BOSS } from "../config";

describe("RunController", () => {
  it("starts with 3 lives and not over", () => {
    const run = new RunController();
    expect(run.lives).toBe(3);
    expect(run.isOver).toBe(false);
    expect(run.endReason).toBe(null);
  });

  it("survives the first two deaths (respawn), ends on the third", () => {
    const run = new RunController(3);
    expect(run.loseLife()).toBe(true);
    expect(run.loseLife()).toBe(true);
    expect(run.loseLife()).toBe(false);
    expect(run.endReason).toBe("death");
  });

  it("cannot win before the boss is defeated", () => {
    const run = new RunController();
    run.addPointsAfterBoss(999);
    expect(run.update(999_999, 1000)).toBe(null);
  });

  it("wins after WIN_SCORE_AFTER_MINI_BOSS points earned post-boss", () => {
    const run = new RunController();
    run.onBossDefeated();
    expect(run.addPointsAfterBoss(99)).toBe(false);
    expect(run.update(0, 1000)).toBe(null);
    expect(run.addPointsAfterBoss(1)).toBe(true);
    expect(run.endReason).toBe("win");
  });

  it("does not count pre-boss addPointsAfterBoss calls", () => {
    const run = new RunController();
    run.addPointsAfterBoss(100);
    run.onBossDefeated();
    expect(run.pointsAfterBoss).toBe(0);
    expect(run.update(0, 1000)).toBe(null);
  });

  it("exceeding the time limit without a win sets timeout", () => {
    const run = new RunController();
    expect(run.update(999_999, SESSION_MAX_MS)).toBe("timeout");
  });

  it("prioritizes win over timeout when both conditions hold", () => {
    const run = new RunController();
    run.onBossDefeated();
    run.addPointsAfterBoss(WIN_SCORE_AFTER_MINI_BOSS);
    expect(run.update(0, SESSION_MAX_MS)).toBe("win");
  });

  it("keeps the first end reason on later updates (idempotent)", () => {
    const run = new RunController();
    run.onBossDefeated();
    run.addPointsAfterBoss(WIN_SCORE_AFTER_MINI_BOSS);
    run.update(0, 1000);
    expect(run.update(0, SESSION_MAX_MS)).toBe("win");
  });
});
