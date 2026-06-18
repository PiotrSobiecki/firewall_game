import Phaser from "phaser";
import { TEXTURE } from "../art/SpriteTextures";
import { BTTF, COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";
import type { Player } from "../entities/Player";

export type DeloreanFlybyHooks = {
  onCollect: () => void;
};

/**
 * Easter egg: DeLorean przejeżdża przez dolną część planszy.
 * Kilka przejazdów na rundę; trafienie statkiem daje +88 pkt za każdy.
 */
export class DeloreanFlyby {
  private nextTriggerAtMs: number;
  private active = false;
  private caughtThisCar = false;
  private car?: Phaser.Physics.Arcade.Image;
  private trails?: Phaser.GameObjects.Particles.ParticleEmitter;
  private dir: 1 | -1 = 1;
  private lastElapsedMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly hooks: DeloreanFlybyHooks,
  ) {
    const { min, max } = BTTF.flybyFirstMs;
    this.nextTriggerAtMs = Phaser.Math.Between(min, max);
  }

  update(elapsedMs: number, ended: boolean): void {
    if (ended) return;
    this.lastElapsedMs = elapsedMs;

    if (!this.active && elapsedMs >= this.nextTriggerAtMs) {
      this.spawn();
      return;
    }

    if (this.car?.active) {
      const off =
        (this.dir === 1 && this.car.x > GAME_WIDTH + 100) ||
        (this.dir === -1 && this.car.x < -100);
      if (off) this.finishPass(elapsedMs);
    }
  }

  private scheduleNext(fromMs: number): void {
    const { min, max } = BTTF.flybyIntervalMs;
    this.nextTriggerAtMs = fromMs + Phaser.Math.Between(min, max);
  }

  private spawn(): void {
    this.active = true;
    this.caughtThisCar = false;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    const y = GAME_HEIGHT * BTTF.flybyYRatio;
    const x = this.dir === 1 ? -70 : GAME_WIDTH + 70;

    const car = this.scene.physics.add.image(x, y, TEXTURE.delorean);
    car.setDepth(6);
    car.setFlipX(this.dir === -1);
    (car.body as Phaser.Physics.Arcade.Body).setSize(72, 22).setOffset(8, 8);
    car.setVelocity(this.dir * BTTF.flybySpeed, 0);
    this.car = car;

    this.trails = this.scene.add.particles(0, 0, TEXTURE.particle, {
      speed: { min: 40, max: 120 },
      lifespan: 320,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.85, end: 0 },
      tint: [BTTF.colors.flameOrange, BTTF.colors.flameRed, COLORS.yellow],
      frequency: 28,
      follow: car,
      followOffset: { x: this.dir === 1 ? -28 : 28, y: 4 },
    });
    this.trails.setDepth(5);

    this.scene.physics.add.overlap(this.player, car, () => {
      if (this.caughtThisCar) return;
      this.caughtThisCar = true;
      this.hooks.onCollect();
      this.finishPass(this.lastElapsedMs);
    });
  }

  private finishPass(elapsedMs: number): void {
    this.cleanupCar();
    this.active = false;
    this.scheduleNext(elapsedMs);
  }

  private cleanupCar(): void {
    this.trails?.destroy();
    this.trails = undefined;
    this.car?.destroy();
    this.car = undefined;
  }

  destroy(): void {
    this.cleanupCar();
    this.active = false;
  }
}
