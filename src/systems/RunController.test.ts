import { describe, it, expect } from "vitest";
import { RunController } from "./RunController";
import { SESSION_MAX_MS, TARGET_SCORE } from "../config";

describe("RunController", () => {
  it("starts with 3 lives and not over", () => {
    const run = new RunController();
    expect(run.lives).toBe(3);
    expect(run.isOver).toBe(false);
    expect(run.endReason).toBe(null);
  });

  it("survives the first two deaths (respawn), ends on the third", () => {
    const run = new RunController(3);
    expect(run.loseLife()).toBe(true); // 2 left
    expect(run.isOver).toBe(false);
    expect(run.loseLife()).toBe(true); // 1 left
    expect(run.isOver).toBe(false);
    expect(run.loseLife()).toBe(false); // 0 left → death
    expect(run.isOver).toBe(true);
    expect(run.endReason).toBe("death");
  });

  it("reaching the target sets state to win", () => {
    const run = new RunController();
    expect(run.update(TARGET_SCORE, 1000)).toBe("win");
    expect(run.endReason).toBe("win");
  });

  it("exceeding the time limit without the target sets timeout", () => {
    const run = new RunController();
    expect(run.update(50, SESSION_MAX_MS)).toBe("timeout");
    expect(run.endReason).toBe("timeout");
  });

  it("returns null while the run is still in progress", () => {
    const run = new RunController();
    expect(run.update(50, 1000)).toBe(null);
    expect(run.isOver).toBe(false);
  });

  it("prioritizes win over timeout when both conditions hold", () => {
    const run = new RunController();
    expect(run.update(TARGET_SCORE, SESSION_MAX_MS)).toBe("win");
  });

  it("keeps the first end reason on later updates (idempotent)", () => {
    const run = new RunController();
    run.update(TARGET_SCORE, 1000); // win
    expect(run.update(0, SESSION_MAX_MS)).toBe("win");
  });

  it("does not change state via loseLife once the run has ended", () => {
    const run = new RunController();
    run.update(TARGET_SCORE, 1000); // win
    expect(run.loseLife()).toBe(false);
    expect(run.endReason).toBe("win");
    expect(run.lives).toBe(3);
  });
});
