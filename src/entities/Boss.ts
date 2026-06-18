import Phaser from "phaser";
import { BOSS, BTTF, COLORS, GAME_WIDTH } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

/**
 * Mini-boss „Paradoks Fluxu” — skorumpowany wehikuł czasu (BTTF).
 * Wchodzi z góry, patroluje poziomo pod HUD i ostrzeliwuje gracza
 * pomarańczowymi pociskami fluxu.
 */
export class Boss extends Phaser.Physics.Arcade.Image {
  contactDamage = BOSS.contactDamage;
  readonly bodyRadius = BOSS.bodyRadius;
  private hp = BOSS.hp;
  private mode: "enter" | "patrol" | "dive" | "return" = "enter";
  private dir = 1;
  private nextFireAt = 0;
  private nextDiveAt = 0;
  private hitCdUntil = 0;
  private bar: Phaser.GameObjects.Graphics;
  private aura: Phaser.GameObjects.Graphics;
  private flames?: Phaser.GameObjects.Particles.ParticleEmitter;
  private flamesL?: Phaser.GameObjects.Particles.ParticleEmitter;
  private flamesR?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.boss);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(BOSS.displayScale);
    this.setDepth(6);
    const r = BOSS.bodyRadius;
    (this.body as Phaser.Physics.Arcade.Body).setCircle(
      r,
      this.displayWidth / 2 - r,
      this.displayHeight / 2 - r + 4,
    );
    this.bar = scene.add.graphics();
    this.bar.setDepth(16);
    this.aura = scene.add.graphics();
    this.aura.setDepth(5);
    this.addFluxFlames(scene);
    this.nextFireAt = scene.time.now + 700;
  }

  private addFluxFlames(scene: Phaser.Scene): void {
    const { flameOrange, flameRed, fluxBlue } = BTTF.colors;
    const nozzle = (ox: number) =>
      scene.add.particles(0, 0, TEXTURE.particle, {
        speed: { min: 45, max: 95 },
        lifespan: { min: 120, max: 220 },
        scale: { start: 0.65, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [flameOrange, flameRed, fluxBlue],
        frequency: 38,
        maxParticles: 18,
        angle: { min: 84, max: 96 },
        follow: this,
        followOffset: { x: ox, y: this.displayHeight * 0.36 },
      });

    this.flames = nozzle(0);
    this.flamesL = nozzle(-this.displayWidth * 0.22);
    this.flamesR = nozzle(this.displayWidth * 0.22);
    this.flames.setDepth(5);
    this.flamesL.setDepth(5);
    this.flamesR.setDepth(5);
  }

  get hpRatio(): number {
    return this.hp / BOSS.hp;
  }

  behave(
    now: number,
    fire: (x: number, y: number, vx: number, tint?: number) => void,
  ): void {
    const edge = 72;
    if (this.x < edge) this.dir = 1;
    else if (this.x > GAME_WIDTH - edge) this.dir = -1;

    switch (this.mode) {
      case "enter":
        this.setVelocity(0, BOSS.enterSpeed);
        this.setAngle(0);
        if (this.y >= BOSS.strafeY) {
          this.y = BOSS.strafeY;
          this.mode = "patrol";
          this.dir = Math.random() < 0.5 ? -1 : 1;
          this.nextDiveAt = now + BOSS.diveEveryMs * 0.55;
        }
        break;

      case "patrol":
        this.setVelocity(this.dir * BOSS.strafeSpeed, 0);
        this.setAngle(this.dir * -4);
        if (now >= this.nextDiveAt) this.mode = "dive";
        break;

      case "dive":
        this.setVelocity(this.dir * BOSS.strafeSpeed * 0.55, BOSS.diveSpeed);
        this.setAngle(this.dir * 8);
        if (this.y >= BOSS.diveY) this.mode = "return";
        break;

      case "return":
        this.setVelocity(this.dir * BOSS.strafeSpeed * 0.5, -BOSS.diveSpeed * 0.92);
        this.setAngle(this.dir * -6);
        if (this.y <= BOSS.strafeY) {
          this.y = BOSS.strafeY;
          this.mode = "patrol";
          this.nextDiveAt = now + BOSS.diveEveryMs;
          this.setAngle(0);
        }
        break;
    }

    const bulletTint = BTTF.boss.bulletTint;
    if (this.mode !== "enter" && now >= this.nextFireAt) {
      this.nextFireAt = now + BOSS.fireEveryMs;
      fire(this.x, this.y + 30, -120, bulletTint);
      fire(this.x, this.y + 34, 0, bulletTint);
      fire(this.x, this.y + 30, 120, bulletTint);
    }

    const flameAlpha = this.mode === "dive" ? 1 : 0.82;
    this.flames?.setAlpha(flameAlpha);
    this.flamesL?.setAlpha(flameAlpha);
    this.flamesR?.setAlpha(flameAlpha);
    this.drawAura(now);
    this.drawBar();
  }

  hitByShield(now: number, power = 1): boolean {
    if (now < this.hitCdUntil) return false;
    this.hitCdUntil = now + BOSS.hitCooldownMs;
    return this.applyDamage(power);
  }

  takeShot(power = 1): boolean {
    return this.applyDamage(power);
  }

  private applyDamage(power: number): boolean {
    this.hp -= power;
    this.setTint(BTTF.colors.flameOrange);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });
    return this.hp <= 0;
  }

  private drawAura(now: number): void {
    const g = this.aura;
    g.clear();
    const base = this.bodyRadius + 8 + Math.sin(now * 0.01) * 6;
    const aggressive = this.mode === "dive";
    g.fillStyle(BTTF.colors.flameRed, aggressive ? 0.12 : 0.07);
    g.fillCircle(this.x, this.y, base + 18);
    g.fillStyle(BTTF.colors.fluxBlue, aggressive ? 0.14 : 0.09);
    g.fillCircle(this.x, this.y, base + 10);
    g.lineStyle(3, BTTF.colors.flameOrange, 0.35 + Math.sin(now * 0.015) * 0.12);
    g.strokeCircle(this.x, this.y, base);
    g.lineStyle(2, COLORS.magenta, 0.22);
    g.strokeCircle(this.x, this.y, base + 6);
  }

  private drawBar(): void {
    const w = 92;
    const x = this.x - w / 2;
    const y = this.y - this.displayHeight / 2 - 14;
    const ratio = Phaser.Math.Clamp(this.hpRatio, 0, 1);
    this.bar.clear();
    this.bar.fillStyle(0x10202c, 0.92);
    this.bar.fillRect(x - 1, y - 1, w + 2, 9);
    this.bar.fillStyle(BTTF.colors.flameOrange, 1);
    this.bar.fillRect(x, y, w * ratio, 7);
    this.bar.fillStyle(BTTF.colors.flameRed, 0.65);
    this.bar.fillRect(x, y, w * ratio * 0.45, 7);
    this.bar.lineStyle(1, BTTF.colors.deloreanSilver, 0.7);
    this.bar.strokeRect(x - 1, y - 1, w + 2, 9);
  }

  destroy(fromScene?: boolean): void {
    this.flames?.destroy();
    this.flamesL?.destroy();
    this.flamesR?.destroy();
    this.aura.destroy();
    this.bar.destroy();
    super.destroy(fromScene);
  }
}
