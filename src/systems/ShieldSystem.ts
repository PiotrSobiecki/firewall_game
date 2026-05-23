import Phaser from "phaser";
import { SHIELD, COLORS, POWERUP } from "../config";
import type { Player } from "../entities/Player";
import type { Enemy } from "../entities/Enemy";

/**
 * Tarcza NIE jest domyślna: gracz włącza ją przytrzymaniem Spacji.
 * Aktywna tarcza to świecący łuk nad statkiem (od strony nadlatujących
 * wrogów), który odpycha i niszczy wrogów w swoim sektorze, ale zużywa
 * energię. Po puszczeniu energia się regeneruje; po pełnym wyczerpaniu
 * tarcza jest zablokowana, aż energia odbije do progu reaktywacji.
 */
export class ShieldSystem {
  private gfx: Phaser.GameObjects.Graphics;
  private energy: number = SHIELD.maxEnergy;
  private active = false;
  private exhausted = false;
  private boosted = false;

  /** ShieldBoost (Faza 4): większy promień + mocniejsze odbicia, na czas buffa. */
  setBoosted(boosted: boolean): void {
    this.boosted = boosted;
  }

  private get radius(): number {
    return this.boosted ? SHIELD.radius * POWERUP.boostRadiusMult : SHIELD.radius;
  }

  private get bouncePower(): number {
    return this.boosted ? POWERUP.boostBouncesPerHit : 1;
  }

  constructor(
    scene: Phaser.Scene,
    private player: Player,
  ) {
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(5);
  }

  get energyRatio(): number {
    return this.energy / SHIELD.maxEnergy;
  }

  get isExhausted(): boolean {
    return this.exhausted;
  }

  /** Czy tarcza jest aktywna w tej klatce (do kolizji bossa poza poolem). */
  get isActive(): boolean {
    return this.active;
  }

  /** Bieżący promień (z uwzględnieniem ShieldBoost). */
  get currentRadius(): number {
    return this.radius;
  }

  /** Siła trafienia (liczba odbić/obrażeń z uwzględnieniem ShieldBoost). */
  get hitPower(): number {
    return this.bouncePower;
  }

  /**
   * Aktualizuje energię i — gdy tarcza aktywna — odpycha oraz rani wrogów
   * w łuku nad statkiem. `holding` = czy Spacja jest wciśnięta w tej klatce.
   */
  update(
    dtSec: number,
    holding: boolean,
    enemies: Phaser.Physics.Arcade.Group,
    onKill: (enemy: Enemy) => void,
  ): void {
    if (holding && !this.exhausted && this.energy > 0) {
      this.active = true;
      this.energy = Math.max(0, this.energy - SHIELD.drainPerSec * dtSec);
      if (this.energy <= 0) {
        this.exhausted = true;
        this.active = false;
      }
    } else {
      this.active = false;
      this.energy = Math.min(SHIELD.maxEnergy, this.energy + SHIELD.regenPerSec * dtSec);
      if (this.exhausted && this.energy >= SHIELD.reactivateAt) this.exhausted = false;
    }

    this.gfx.clear();
    if (this.active) {
      this.repel(enemies, onKill);
      this.drawArc();
    }
  }

  /**
   * Odbija aktywnych wrogów w sektorze tarczy (nad statkiem): mocny odrzut na
   * zewnątrz + zliczenie odbicia. Po wyczerpaniu puli odbić wróg ginie.
   */
  private repel(enemies: Phaser.Physics.Arcade.Group, onKill: (enemy: Enemy) => void): void {
    const now = this.player.scene.time.now;
    const px = this.player.x;
    const py = this.player.y;
    for (const obj of enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      if (dy > 0) continue; // tarcza chroni tylko sektor nad statkiem
      const dist = Math.hypot(dx, dy);
      if (dist > this.radius) continue;

      const res = enemy.hitByShield(now, this.bouncePower);
      if (res === "none") continue;

      // odrzut na zewnątrz od gracza — także przy trafieniu śmiertelnym,
      // by zawsze było widać odbicie (wróg odlatuje, dopiero potem znika).
      const inv = dist === 0 ? 0 : 1 / dist;
      enemy.setVelocity(dx * inv * SHIELD.pushForce, dy * inv * SHIELD.pushForce);
      if (res === "killed") onKill(enemy);
    }
  }

  /** Świecący łuk nad statkiem; przygasa, gdy energia jest niska. */
  private drawArc(): void {
    const px = this.player.x;
    const py = this.player.y;
    const r = this.radius;
    const color = this.boosted ? COLORS.yellow : COLORS.cyan;
    const half = Phaser.Math.DegToRad(SHIELD.arcHalfDeg);
    const center = -Math.PI / 2; // pion w górę
    const intensity = this.energyRatio < 0.25 ? 0.5 : 1;

    const steps = 28;
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = center - half + (2 * half * i) / steps;
      pts.push(new Phaser.Math.Vector2(px + Math.cos(a) * r, py + Math.sin(a) * r));
    }

    // poświata
    this.gfx.lineStyle(9, color, 0.1 * intensity);
    this.gfx.strokePoints(pts, false, false);
    // wewnętrzny, słabszy łuk
    this.gfx.lineStyle(2, color, 0.25 * intensity);
    const inner: Phaser.Math.Vector2[] = pts.map((p) => {
      const ax = p.x - px;
      const ay = p.y - py;
      const k = (r - 10) / r;
      return new Phaser.Math.Vector2(px + ax * k, py + ay * k);
    });
    this.gfx.strokePoints(inner, false, false);
    // główny, mocny łuk
    this.gfx.lineStyle(this.boosted ? 4 : 3, color, 0.95 * intensity);
    this.gfx.strokePoints(pts, false, false);
    // węzły na końcach łuku
    this.gfx.fillStyle(color, 0.9 * intensity);
    this.gfx.fillCircle(pts[0].x, pts[0].y, 2.5);
    this.gfx.fillCircle(pts[steps].x, pts[steps].y, 2.5);
  }
}
