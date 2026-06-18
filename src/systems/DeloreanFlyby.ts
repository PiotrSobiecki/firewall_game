import Phaser from "phaser";
import { BTTF, GAME_WIDTH, PLAYER } from "../config";
import type { Player } from "../entities/Player";
import { destroyDeloreanPass, spawnDeloreanPass, type DeloreanPass } from "./DeloreanDrive";

export type DeloreanFlybyHooks = {
  onCollect: () => void;
};

/** Czy statek nachodzi na przejeżdżającego DeLoreana (prostokąt + promień gracza). */
function canCatchDelorean(player: Player, car: Phaser.GameObjects.Image): boolean {
  const { catchPadX, catchPadY } = BTTF.delorean;
  const padX = Math.max(catchPadX, car.displayWidth * 0.42) + PLAYER.bodyRadius;
  const padY = Math.max(catchPadY, car.displayHeight * 0.45) + PLAYER.bodyRadius;
  return Math.abs(player.x - car.x) < padX && Math.abs(player.y - car.y) < padY;
}

/**
 * Easter egg: DeLorean przejeżdża po dolnej „drodze”.
 * Bez fizyki Arcade — ruch + dystans do gracza (brak wycieku colliderów).
 */
export class DeloreanFlyby {
  private nextTriggerAtMs: number;
  private active = false;
  private caughtThisCar = false;
  private pass?: DeloreanPass;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly hooks: DeloreanFlybyHooks,
  ) {
    const { min, max } = BTTF.flybyFirstMs;
    this.nextTriggerAtMs = Phaser.Math.Between(min, max);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  update(elapsedMs: number, ended: boolean): void {
    if (ended) return;

    if (!this.active && elapsedMs >= this.nextTriggerAtMs) {
      this.spawn();
      return;
    }

    if (!this.pass?.car.active) return;

    const dt = this.scene.game.loop.delta / 1000;
    const { car, dir } = this.pass;
    car.x += dir * BTTF.flybySpeed * dt;

    if (!this.caughtThisCar && canCatchDelorean(this.player, car)) {
      this.caughtThisCar = true;
      this.hooks.onCollect();
      this.finishPass(elapsedMs);
      return;
    }

    const off =
      (dir === 1 && car.x > GAME_WIDTH + 120) || (dir === -1 && car.x < -120);
    if (off) this.finishPass(elapsedMs);
  }

  private scheduleNext(fromMs: number): void {
    const { min, max } = BTTF.flybyIntervalMs;
    this.nextTriggerAtMs = fromMs + Phaser.Math.Between(min, max);
  }

  private spawn(): void {
    this.active = true;
    this.caughtThisCar = false;
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    this.pass = spawnDeloreanPass(this.scene, dir, BTTF.menuDeloreanDepth);
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

export { DeloreanMenuDrive } from "./DeloreanDrive";
