import Phaser from "phaser";
import { TEXTURE } from "../art/SpriteTextures";
import { BTTF, GAME_WIDTH, GAME_HEIGHT } from "../config";

export type DeloreanPass = {
  car: Phaser.GameObjects.Image;
  trails: Phaser.GameObjects.Particles.ParticleEmitter;
  dir: 1 | -1;
};

/** Wspólny wygląd przejazdu DeLoreana po drodze (menu + gra). */
export function spawnDeloreanPass(
  scene: Phaser.Scene,
  dir: 1 | -1,
  depth = 3,
): DeloreanPass {
  const y = GAME_HEIGHT * BTTF.flybyYRatio;
  const x = dir === 1 ? -80 : GAME_WIDTH + 80;
  const tex = dir === 1 ? TEXTURE.deloreanR : TEXTURE.deloreanL;

  const car = scene.add.image(x, y, tex);
  car.setDepth(depth);
  car.setOrigin(0.5, 0.88);

  const trails = scene.add.particles(0, 0, TEXTURE.particle, {
    speed: { min: 30, max: 90 },
    lifespan: 260,
    scale: { start: 0.55, end: 0 },
    alpha: { start: 0.7, end: 0 },
    tint: [BTTF.colors.flameOrange, BTTF.colors.flameRed],
    frequency: 50,
    follow: car,
    followOffset: { x: dir === 1 ? -42 : 42, y: 2 },
  });
  trails.setDepth(depth - 1);

  return { car, trails, dir };
}

export function destroyDeloreanPass(pass: DeloreanPass | undefined): void {
  if (!pass) return;
  pass.trails.destroy();
  pass.car.destroy();
}

/** Pętla przejazdów DeLoreana na ekranie startowym (bez kolizji). */
export class DeloreanMenuDrive {
  private pass?: DeloreanPass;
  private cooldownMs = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.cooldownMs = Phaser.Math.Between(400, 1400);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  update(dtSec: number): void {
    if (!this.pass) {
      this.cooldownMs -= dtSec * 1000;
      if (this.cooldownMs <= 0) this.startPass();
      return;
    }

    const { car, dir } = this.pass;
    car.x += dir * BTTF.flybySpeed * dtSec;
    const off =
      (dir === 1 && car.x > GAME_WIDTH + 120) || (dir === -1 && car.x < -120);
    if (off) this.endPass();
  }

  private startPass(): void {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    this.pass = spawnDeloreanPass(this.scene, dir, 3);
  }

  private endPass(): void {
    destroyDeloreanPass(this.pass);
    this.pass = undefined;
    const { min, max } = BTTF.menuDriveBetweenMs;
    this.cooldownMs = Phaser.Math.Between(min, max);
  }

  destroy(): void {
    destroyDeloreanPass(this.pass);
    this.pass = undefined;
  }
}
