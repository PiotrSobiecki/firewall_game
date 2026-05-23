import { describe, it, expect } from "vitest";
import { PowerUpSystem } from "./PowerUpSystem";
import { POWERUP } from "../config";

describe("PowerUpSystem", () => {
  it("activates a timed buff for its duration and expires after", () => {
    const p = new PowerUpSystem();
    const instant = p.apply("packetStream", 1000);
    expect(instant).toBe(false);
    expect(p.isActive("packetStream", 1000)).toBe(true);
    expect(p.isActive("packetStream", 1000 + POWERUP.durations.packetStream - 1)).toBe(true);
    expect(p.isActive("packetStream", 1000 + POWERUP.durations.packetStream)).toBe(false);
  });

  it("reports FirewallRepair as instant (no timer)", () => {
    const p = new PowerUpSystem();
    expect(p.apply("firewallRepair", 0)).toBe(true);
    expect(p.isActive("firewallRepair", 0)).toBe(false);
  });

  it("tracks remaining time and re-applying refreshes from now", () => {
    const p = new PowerUpSystem();
    p.apply("immunity", 0);
    expect(p.remaining("immunity", 0)).toBe(POWERUP.durations.immunity);
    p.apply("immunity", 2000); // odnowienie
    expect(p.remaining("immunity", 2000)).toBe(POWERUP.durations.immunity);
  });

  it("keeps buffs independent of each other", () => {
    const p = new PowerUpSystem();
    p.apply("shieldBoost", 0);
    expect(p.isActive("shieldBoost", 100)).toBe(true);
    expect(p.isActive("packetStream", 100)).toBe(false);
  });

  it("reset clears all buffs", () => {
    const p = new PowerUpSystem();
    p.apply("packetStream", 0);
    p.reset();
    expect(p.isActive("packetStream", 0)).toBe(false);
  });
});
