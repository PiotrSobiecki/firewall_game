import Phaser from "phaser";
import { BTTF, COLORS, PLAYER, GAME_HEIGHT } from "../config";
import { SPRITE, TEXTURE } from "../art/SpriteTextures";

/**
 * Statek „flux interceptor” — kadłub + twarz pilotki w okienku kokpitu.
 * Tarcza (odpych) jest w ShieldSystem i włącza ją gracz Spacją.
 */
export class Player extends Phaser.Physics.Arcade.Image {
  hp: number = PLAYER.maxHp;
  private invulnUntil = 0;
  private immuneUntil = 0;
  private glow: Phaser.GameObjects.Graphics;
  private pilot?: Phaser.GameObjects.Image;
  private engineL?: Phaser.GameObjects.Particles.ParticleEmitter;
  private engineR?: Phaser.GameObjects.Particles.ParticleEmitter;
  private engineCore?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(6);

    this.glow = scene.add.graphics();
    this.glow.setDepth(5);

    const pilotTex = scene.textures.exists(TEXTURE.pilotFace)
      ? TEXTURE.pilotFace
      : scene.textures.exists(TEXTURE.menuHero)
        ? TEXTURE.menuHero
        : null;

    if (pilotTex) {
      const { scale, angle } = BTTF.playerPilot;
      this.pilot = scene.add.image(x, y, pilotTex);
      this.pilot.setOrigin(0.5, 0.5);
      this.pilot.setScale(scale);
      this.pilot.setAngle(angle);
      this.pilot.setDepth(7);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      PLAYER.bodyRadius,
      this.width / 2 - PLAYER.bodyRadius,
      this.height / 2 - PLAYER.bodyRadius + 2,
    );

    this.addEngineFlames(scene);
  }

  /** Płomienie fluxu z dysz — lecą w dół (tył statku). */
  private addEngineFlames(scene: Phaser.Scene): void {
    const { nozzleY, nozzleX } = BTTF.playerEngine;
    const { flameOrange, flameRed, fluxBlue } = BTTF.colors;
    const depth = 5;

    const nozzle = (ox: number, spread: number) =>
      scene.add.particles(0, 0, TEXTURE.particle, {
        speed: { min: 35, max: 85 },
        lifespan: { min: 160, max: 260 },
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.85, end: 0 },
        tint: [flameOrange, flameRed, 0xffcc00],
        frequency: 42,
        maxParticles: 14,
        angle: { min: 88 - spread, max: 92 + spread },
        follow: this,
        followOffset: { x: ox, y: nozzleY },
      });

    this.engineL = nozzle(-nozzleX, 6);
    this.engineR = nozzle(nozzleX, 6);
    this.engineCore = scene.add.particles(0, 0, TEXTURE.particle, {
      speed: { min: 20, max: 50 },
      lifespan: 180,
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [fluxBlue, 0x88ddff, flameOrange],
      frequency: 55,
      maxParticles: 10,
      angle: { min: 85, max: 95 },
      follow: this,
      followOffset: { x: 0, y: nozzleY + 2 },
    });

    this.engineL.setDepth(depth);
    this.engineR.setDepth(depth);
    this.engineCore.setDepth(depth);
  }

  private syncEngineFlames(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = body.velocity.length() > 25;
    const alpha = moving ? 1 : 0.55;
    this.engineL?.setAlpha(alpha);
    this.engineR?.setAlpha(alpha);
    this.engineCore?.setAlpha(moving ? 0.9 : 0.45);
  }

  /** Twarz w okienku — offset od środka statku (nie od rogu tekstury). */
  private syncPilot(): void {
    if (!this.pilot) return;
    const { localX, localY, scale } = BTTF.playerPilot;
    const { w, h } = SPRITE.player;
    const sx = this.displayWidth / w;
    const sy = this.displayHeight / h;
    const s = scale * ((sx + sy) / 2);
    this.pilot.setPosition(this.x + localX * sx, this.y + localY * sy);
    this.pilot.setScale(s);
    this.pilot.setAlpha(this.alpha);
    this.pilot.setDepth(this.depth + 1);
  }

  preUpdate(): void {
    const now = this.scene.time.now;
    this.glow.clear();
    if (now < this.immuneUntil) {
      this.setAlpha(1);
      const pulse = 22 + Math.sin(now * 0.012) * 4;
      this.glow.fillStyle(COLORS.green, 0.16);
      this.glow.fillCircle(this.x, this.y, pulse + 6);
      this.glow.lineStyle(2, COLORS.green, 0.8);
      this.glow.strokeCircle(this.x, this.y, pulse + 6);
    } else if (now < this.invulnUntil) {
      const blink = Math.sin(now * 0.04) > 0;
      this.setAlpha(blink ? 0.4 : 1);
      this.glow.fillStyle(COLORS.magenta, 0.18);
      this.glow.fillCircle(this.x, this.y, 24);
    } else {
      this.setAlpha(1);
    }
    this.syncPilot();
    this.syncEngineFlames();
  }

  destroy(fromScene?: boolean): void {
    this.pilot?.destroy();
    this.engineL?.destroy();
    this.engineR?.destroy();
    this.engineCore?.destroy();
    this.glow.destroy();
    super.destroy(fromScene);
  }

  drive(dx: number, dy: number): void {
    const len = Math.hypot(dx, dy) || 1;
    this.setVelocity((dx / len) * PLAYER.speed, (dy / len) * PLAYER.speed);
    this.y = Phaser.Math.Clamp(this.y, PLAYER.zoneTop, GAME_HEIGHT - 24);
  }

  driveProportional(sx: number, sy: number): void {
    this.setVelocity(sx * PLAYER.speed, sy * PLAYER.speed);
    this.y = Phaser.Math.Clamp(this.y, PLAYER.zoneTop, GAME_HEIGHT - 24);
  }

  respawn(x: number, y: number, now: number): void {
    this.hp = PLAYER.maxHp;
    this.invulnUntil = now + PLAYER.respawnIframesMs;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }

  takeDamage(amount: number, now: number): boolean {
    if (now < this.invulnUntil || now < this.immuneUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + PLAYER.iframesMs;
    return true;
  }

  setImmuneUntil(until: number): void {
    this.immuneUntil = until;
  }

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
