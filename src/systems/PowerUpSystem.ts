/**
 * Czysta logika czasów buffów (testowalna bez Phasera). Trzyma znaczniki
 * wygaśnięcia per typ; efekty (strzał, aura, promień tarczy, +HP) wpina
 * GameScene odpytując isActive(). FirewallRepair jest natychmiastowy.
 */
import { POWERUP, type PowerUpType } from "../config";

export class PowerUpSystem {
  private until: Record<PowerUpType, number> = {
    packetStream: 0,
    immunity: 0,
    shieldBoost: 0,
    firewallRepair: 0,
  };

  /**
   * Aktywuje buff. Zwraca true, gdy efekt jest natychmiastowy (czas trwania 0,
   * np. FirewallRepair) — wtedy GameScene aplikuje skutek od razu zamiast timera.
   */
  apply(type: PowerUpType, now: number): boolean {
    const dur = POWERUP.durations[type];
    if (dur <= 0) return true;
    // odnowienie/przedłużenie liczone od teraz
    this.until[type] = now + dur;
    return false;
  }

  isActive(type: PowerUpType, now: number): boolean {
    return now < this.until[type];
  }

  remaining(type: PowerUpType, now: number): number {
    return Math.max(0, this.until[type] - now);
  }

  reset(): void {
    this.until = { packetStream: 0, immunity: 0, shieldBoost: 0, firewallRepair: 0 };
  }
}
