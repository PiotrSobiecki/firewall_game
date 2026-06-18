import Phaser from "phaser";
import { BTTF, GAME_WIDTH } from "../config";
import type { Player } from "../entities/Player";
import { destroyDeloreanPass, spawnDeloreanPass, type DeloreanPass } from "./DeloreanDrive";

export type DeloreanFlybyHooks = {
  onCollect: () => void;
};

/**
 * Easter egg: DeLorean przejeżdża po dolnej „drodze”.
 * Kilka przejazdów na rundę; trafienie statkiem daje +88 pkt za każdy.
 */
export class DeloreanFlyby {
  private nextTriggerAtMs: number;
  private active = false;
  private caughtThisCar = false;
  private pass?: DeloreanPass;
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

    if (this.pass?.car.active) {
      const { car, dir } = this.pass;
      const off =
        (dir === 1 && car.x > GAME_WIDTH + 120) || (dir === -1 && car.x < -120);
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
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const visual = spawnDeloreanPass(this.scene, dir, 6);
    const car = this.scene.physics.add.existing(visual.car) as Phaser.Physics.Arcade.Image;
    (car.body as Phaser.Physics.Arcade.Body).setSize(90, 24).setOffset(11, 14);
    car.setVelocity(dir * BTTF.flybySpeed, 0);
    this.pass = { ...visual, car };

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
    destroyDeloreanPass(this.pass);
    this.pass = undefined;
  }

  destroy(): void {
    this.cleanupCar();
    this.active = false;
  }
}

// re-export dla wygody importów w scenach
export { DeloreanMenuDrive } from "./DeloreanDrive";
