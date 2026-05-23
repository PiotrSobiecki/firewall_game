import { describe, it, expect } from "vitest";
import { followDrive } from "./TouchMove";

describe("followDrive — deadzone", () => {
  it("returns no movement when the target is within the deadzone", () => {
    const drive = followDrive({ x: 100, y: 100 }, { x: 105, y: 96 }, 10, 100);
    expect(drive).toEqual({ x: 0, y: 0 });
  });
});

describe("followDrive — narastanie i clamp", () => {
  it("ramps proportionally past the deadzone (excess distance / range)", () => {
    // dx = 60, deadzone 10 → nadmiar 50, range 100 → 0.5
    expect(followDrive({ x: 0, y: 0 }, { x: 60, y: 0 }, 10, 100).x).toBeCloseTo(0.5);
  });

  it("clamps to 1 once the target is a full range beyond the deadzone", () => {
    expect(followDrive({ x: 0, y: 0 }, { x: 500, y: 0 }, 10, 100).x).toBe(1);
  });
});

describe("followDrive — kierunek", () => {
  it("points up (negative y) and left (negative x) toward the target", () => {
    const drive = followDrive({ x: 200, y: 400 }, { x: 0, y: 0 }, 10, 100);
    expect(drive.x).toBe(-1);
    expect(drive.y).toBe(-1);
  });
});
