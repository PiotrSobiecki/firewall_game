import { describe, it, expect } from "vitest";
import { difficultyAt } from "./DifficultyCurve";
import { DIFFICULTY } from "../config";

describe("DifficultyCurve", () => {
  it("is neutral at the start of the run", () => {
    const d = difficultyAt(0);
    expect(d.hpMult).toBe(1);
    expect(d.speedMult).toBe(1);
    expect(d.spawnMult).toBe(1);
  });

  it("reaches the configured caps at the end of the ramp", () => {
    const d = difficultyAt(DIFFICULTY.rampMs);
    expect(d.hpMult).toBeCloseTo(DIFFICULTY.maxHpMult);
    expect(d.speedMult).toBeCloseTo(DIFFICULTY.maxSpeedMult);
    expect(d.spawnMult).toBeCloseTo(DIFFICULTY.minSpawnMult);
  });

  it("does not exceed the caps past the ramp", () => {
    const d = difficultyAt(DIFFICULTY.rampMs * 5);
    expect(d.hpMult).toBeCloseTo(DIFFICULTY.maxHpMult);
    expect(d.spawnMult).toBeCloseTo(DIFFICULTY.minSpawnMult);
  });

  it("increases HP/speed and shrinks spawn interval over time (monotonic)", () => {
    const early = difficultyAt(30_000);
    const late = difficultyAt(120_000);
    expect(late.hpMult).toBeGreaterThan(early.hpMult);
    expect(late.speedMult).toBeGreaterThan(early.speedMult);
    expect(late.spawnMult).toBeLessThan(early.spawnMult);
  });
});
