import Phaser from "phaser";
import { COLORS, PLAYER, GAME_HEIGHT } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

/**
 * Statek-tarcza. Sterowanie klawiaturą: ruch w poziomie + lekki pion
 * w dolnej strefie. Tarcza (odpych) jest w ShieldSystem i włącza ją gracz
 * Spacją; Player trzyma HP i nietykalność (i-frames) po trafieniu.
 */
export class Player extends Phaser.Physics.Arcade.Image {
  hp: number = PLAYER.maxHp;
  private invulnUntil = 0;
  private immuneUntil = 0; // power-up Immunity (PRD #24)
  private glow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(6);

    this.glow = scene.add.graphics();
    this.glow.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      PLAYER.bodyRadius,
      this.width / 2 - PLAYER.bodyRadius,
      this.height / 2 - PLAYER.bodyRadius + 2,
    );
  }

  preUpdate(): void {
    const now = this.scene.time.now;
    this.glow.clear();
    if (now < this.immuneUntil) {
      // aura Immunity — zielony, pulsujący pierścień
      this.setAlpha(1);
      const pulse = 22 + Math.sin(now * 0.012) * 4;
      this.glow.fillStyle(COLORS.green, 0.16);
      this.glow.fillCircle(this.x, this.y, pulse + 6);
      this.glow.lineStyle(2, COLORS.green, 0.8);
      this.glow.strokeCircle(this.x, this.y, pulse + 6);
    } else if (now < this.invulnUntil) {
      // miganie przy nietykalności po trafieniu/respawnie
      const blink = Math.sin(now * 0.04) > 0;
      this.setAlpha(blink ? 0.4 : 1);
      this.glow.fillStyle(COLORS.magenta, 0.18);
      this.glow.fillCircle(this.x, this.y, 24);
    } else {
      this.setAlpha(1);
    }
  }

  destroy(fromScene?: boolean): void {
    this.glow.destroy();
    super.destroy(fromScene);
  }

  /** Ustawia prędkość z kierunku (dx, dy ∈ {-1,0,1}) i pilnuje dolnej strefy. */
  drive(dx: number, dy: number): void {
    const len = Math.hypot(dx, dy) || 1;
    this.setVelocity((dx / len) * PLAYER.speed, (dy / len) * PLAYER.speed);
    this.y = Phaser.Math.Clamp(this.y, PLAYER.zoneTop, GAME_HEIGHT - 24);
  }

  /**
   * Jak `drive`, ale ZACHOWUJE wielkość wektora (sx, sy ∈ [-1,1]) — prędkość
   * proporcjonalna do dystansu. Dla dotyku: statek zwalnia i staje przy palcu.
   */
  driveProportional(sx: number, sy: number): void {
    this.setVelocity(sx * PLAYER.speed, sy * PLAYER.speed);
    this.y = Phaser.Math.Clamp(this.y, PLAYER.zoneTop, GAME_HEIGHT - 24);
  }

  /** Respawn po stracie życia: pełne HP, dłuższa nietykalność, reset pozycji/prędkości. */
  respawn(x: number, y: number, now: number): void {
    this.hp = PLAYER.maxHp;
    this.invulnUntil = now + PLAYER.respawnIframesMs;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }

  /**
   * Zadaje obrażenia, jeśli nie trwają i-frames ani Immunity.
   * Zwraca true, gdy trafienie zaliczone.
   */
  takeDamage(amount: number, now: number): boolean {
    if (now < this.invulnUntil || now < this.immuneUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + PLAYER.iframesMs;
    return true;
  }

  /** Włącza Immunity do podanego czasu (power-up). Nie koliduje z i-frames. */
  setImmuneUntil(until: number): void {
    this.immuneUntil = until;
  }

  /** Leczenie (FirewallRepair) — do pełni HP. */
  heal(amount: number): void {
    this.hp = Math.min(PLAYER.maxHp, this.hp + amount);
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  get hpRatio(): number {
    return this.hp / PLAYER.maxHp;
  }
}
