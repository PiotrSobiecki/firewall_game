import Phaser from "phaser";
import { BOSS, COLORS, GAME_WIDTH } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

/**
 * Mini-boss „Rootkit" (PRD #12). Wchodzi z góry, patroluje poziomo pod HUD
 * i ostrzeliwuje gracza. Ma własny pasek HP liczony w trafieniach (tarcza/
 * strzał). Jest do minięcia — można wygrać go ignorując; pokonanie daje bonus.
 */
export class Boss extends Phaser.Physics.Arcade.Image {
  contactDamage = BOSS.contactDamage;
  private hp = BOSS.hp;
  private mode: "enter" | "patrol" | "dive" | "return" = "enter";
  private dir = 1;
  private nextFireAt = 0;
  private nextDiveAt = 0;
  private hitCdUntil = 0;
  private bar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.boss);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(30, this.width / 2 - 30, this.height / 2 - 30);
    this.bar = scene.add.graphics();
    this.bar.setDepth(16);
    this.nextFireAt = scene.time.now + 900;
  }

  get hpRatio(): number {
    return this.hp / BOSS.hp;
  }

  /** Ruch + ostrzał. `fire` dostaje pozycję i poziomą prędkość pocisku. */
  behave(now: number, fire: (x: number, y: number, vx: number) => void): void {
    // pozioma składowa: patrol z odbiciem od krawędzi (poza fazą wejścia)
    if (this.x < 60) this.dir = 1;
    else if (this.x > GAME_WIDTH - 60) this.dir = -1;

    switch (this.mode) {
      case "enter":
        this.setVelocity(0, BOSS.enterSpeed);
        if (this.y >= BOSS.strafeY) {
          this.y = BOSS.strafeY;
          this.mode = "patrol";
          this.dir = Math.random() < 0.5 ? -1 : 1;
          this.nextDiveAt = now + BOSS.diveEveryMs;
        }
        break;

      case "patrol":
        this.setVelocity(this.dir * BOSS.strafeSpeed, 0);
        if (now >= this.nextDiveAt) this.mode = "dive";
        break;

      case "dive":
        // zjazd w zasięg gracza — wtedy można dosięgnąć go tarczą
        this.setVelocity(this.dir * BOSS.strafeSpeed * 0.4, BOSS.diveSpeed);
        if (this.y >= BOSS.diveY) this.mode = "return";
        break;

      case "return":
        this.setVelocity(this.dir * BOSS.strafeSpeed * 0.4, -BOSS.diveSpeed);
        if (this.y <= BOSS.strafeY) {
          this.y = BOSS.strafeY;
          this.mode = "patrol";
          this.nextDiveAt = now + BOSS.diveEveryMs;
        }
        break;
    }

    if (this.mode !== "enter" && now >= this.nextFireAt) {
      this.nextFireAt = now + BOSS.fireEveryMs;
      fire(this.x, this.y + 30, -120);
      fire(this.x, this.y + 34, 0);
      fire(this.x, this.y + 30, 120);
    }
    this.drawBar();
  }

  /** Trafienie tarczą (z cooldownem). Zwraca true, gdy boss pokonany. */
  hitByShield(now: number, power = 1): boolean {
    if (now < this.hitCdUntil) return false;
    this.hitCdUntil = now + BOSS.hitCooldownMs;
    return this.applyDamage(power);
  }

  /** Trafienie pociskiem gracza (bez cooldownu). Zwraca true, gdy pokonany. */
  takeShot(power = 1): boolean {
    return this.applyDamage(power);
  }

  private applyDamage(power: number): boolean {
    this.hp -= power;
    this.setTint(COLORS.cyan);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });
    return this.hp <= 0;
  }

  /** Pasek HP nad bossem. */
  private drawBar(): void {
    const w = 70;
    const x = this.x - w / 2;
    const y = this.y - this.height / 2 - 10;
    this.bar.clear();
    this.bar.fillStyle(0x10202c, 0.9);
    this.bar.fillRect(x - 1, y - 1, w + 2, 7);
    this.bar.fillStyle(COLORS.magenta, 1);
    this.bar.fillRect(x, y, w * Phaser.Math.Clamp(this.hpRatio, 0, 1), 5);
  }

  destroy(fromScene?: boolean): void {
    this.bar.destroy();
    super.destroy(fromScene);
  }
}
