import Phaser from "phaser";
import { TEXTURE } from "../art/SpriteTextures";
import { BTTF, GAME_WIDTH, GAME_HEIGHT } from "../config";

export type DeloreanPass = {
  car: Phaser.GameObjects.Image;
  rearFlames: Phaser.GameObjects.Particles.ParticleEmitter;
  wheelSmokeL: Phaser.GameObjects.Particles.ParticleEmitter;
  wheelSmokeR: Phaser.GameObjects.Particles.ParticleEmitter;
  dir: 1 | -1;
};

export type SpawnDeloreanOptions = {
  /** Mniej cząsteczek — rozgrywka bez zacięć. */
  lite?: boolean;
};

function trailSide(dir: 1 | -1): number {
  return dir === 1 ? -1 : 1;
}

function stopEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
  emitter.stop();
}

/** Wspólny wygląd przejazdu DeLoreana po drodze (menu + gra). */
export function spawnDeloreanPass(
  scene: Phaser.Scene,
  dir: 1 | -1,
  depth = 3,
  options: SpawnDeloreanOptions = {},
): DeloreanPass {
  const lite = options.lite ?? false;
  const { displayScale, originY, rearFlameOffset, wheelSmokeOffset } = BTTF.delorean;
  const y = GAME_HEIGHT * BTTF.flybyYRatio;
  const x = dir === 1 ? -90 : GAME_WIDTH + 90;
  const back = trailSide(dir);

  const car = scene.add.image(x, y, TEXTURE.delorean);
  car.setDepth(depth);
  car.setOrigin(0.5, originY);
  car.setScale(displayScale);
  car.setFlipX(dir === -1);

  const rearFlames = scene.add.particles(0, 0, TEXTURE.particle, {
    speed: { min: 40, max: lite ? 90 : 110 },
    lifespan: lite ? 220 : 280,
    scale: { start: lite ? 0.5 : 0.65, end: 0 },
    alpha: { start: 0.85, end: 0 },
    tint: [BTTF.colors.flameOrange, BTTF.colors.flameRed, 0xffcc00],
    frequency: lite ? 70 : 36,
    maxParticles: lite ? 14 : 28,
    angle: { min: back * 160, max: back * 200 },
    follow: car,
    followOffset: { x: back * rearFlameOffset.x, y: rearFlameOffset.y },
  });
  rearFlames.setDepth(depth - 1);

  const wheelSmoke = (localX: number) =>
    scene.add.particles(0, 0, TEXTURE.smoke, {
      speed: { min: 8, max: lite ? 28 : 35 },
      lifespan: lite ? 320 : 420,
      scale: { start: 0.35, end: lite ? 0.7 : 0.9 },
      alpha: { start: 0.35, end: 0 },
      tint: [0xc8b090, 0xa89070, 0x887860],
      frequency: lite ? 160 : 90,
      maxParticles: lite ? 10 : 20,
      angle: { min: 200, max: 340 },
      gravityY: -18,
      follow: car,
      followOffset: { x: localX, y: wheelSmokeOffset.y },
    });

  const wheelSmokeL = wheelSmoke(back * -wheelSmokeOffset.x);
  const wheelSmokeR = wheelSmoke(back * wheelSmokeOffset.x);
  wheelSmokeL.setDepth(depth - 1);
  wheelSmokeR.setDepth(depth - 1);

  return { car, rearFlames, wheelSmokeL, wheelSmokeR, dir };
}

export function destroyDeloreanPass(pass: DeloreanPass | undefined): void {
  if (!pass) return;
  stopEmitter(pass.rearFlames);
  stopEmitter(pass.wheelSmokeL);
  stopEmitter(pass.wheelSmokeR);
  pass.rearFlames.destroy();
  pass.wheelSmokeL.destroy();
  pass.wheelSmokeR.destroy();
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
      (dir === 1 && car.x > GAME_WIDTH + 140) || (dir === -1 && car.x < -140);
    if (off) this.endPass();
  }

  private startPass(): void {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    this.pass = spawnDeloreanPass(this.scene, dir, BTTF.menuDeloreanDepth);
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
