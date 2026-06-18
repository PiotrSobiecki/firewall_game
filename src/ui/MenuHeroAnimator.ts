import Phaser from "phaser";
import { BTTF, COLORS, GAME_HEIGHT, GAME_WIDTH } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

/** Bohaterka na menu: idle + aura tarczy na prawej pięści (bez strzelania). */
export class MenuHeroAnimator {
  private readonly container: Phaser.GameObjects.Container;
  private readonly heroPivot: Phaser.GameObjects.Container;
  private readonly hero: Phaser.GameObjects.Image;
  private readonly shieldLocal: Phaser.GameObjects.Container;
  private readonly baseY: number;
  private rippleTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    const { scale, xRatio, yRatio, depth, shieldOffset } = BTTF.menuHero;
    const x = GAME_WIDTH * xRatio;
    this.baseY = GAME_HEIGHT * yRatio;

    this.container = scene.add.container(x, this.baseY).setDepth(depth);
    this.heroPivot = scene.add.container(0, 0);
    this.heroPivot.setScale(scale);
    this.container.add(this.heroPivot);

    this.hero = scene.add.image(0, 0, TEXTURE.menuHero);
    this.hero.setOrigin(0.5, 1);
    this.heroPivot.add(this.hero);

    // prawa pięść — efekt w układzie współrzędnych postaci
    this.shieldLocal = scene.add.container(shieldOffset.x, shieldOffset.y);
    this.heroPivot.add(this.shieldLocal);

    this.startIdle(scene);
    this.startShieldAura(scene);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private startIdle(scene: Phaser.Scene): void {
    const { scale } = BTTF.menuHero;

    scene.tweens.add({
      targets: this.container,
      y: this.baseY - 3,
      duration: 1_600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.tweens.add({
      targets: this.heroPivot,
      scaleX: scale * 1.02,
      scaleY: scale * 0.985,
      duration: 2_100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.tweens.add({
      targets: this.heroPivot,
      angle: 0.6,
      duration: 2_800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Miękka aura tarczy wokół pięści — puls, pierścień i unoszące się iskry. */
  private startShieldAura(scene: Phaser.Scene): void {
    const { shieldRadius } = BTTF.menuHero;
    const { fluxBlue } = BTTF.colors;
    const r = shieldRadius;

    const bubble = scene.add.circle(0, 0, r * 0.52, fluxBlue, 0.2);
    bubble.setStrokeStyle(3, COLORS.cyan, 0.6);
    bubble.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldLocal.add(bubble);
    scene.tweens.add({
      targets: bubble,
      scale: 1.2,
      alpha: 0.07,
      duration: 1_100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const outer = scene.add.circle(0, 0, r * 0.72, fluxBlue, 0);
    outer.setStrokeStyle(2, COLORS.cyan, 0.45);
    outer.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldLocal.add(outer);
    scene.tweens.add({
      targets: outer,
      scale: 1.25,
      alpha: 0.12,
      duration: 1_450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const core = scene.add.circle(0, 0, r * 0.18, 0xffffff, 0.4);
    core.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldLocal.add(core);
    scene.tweens.add({
      targets: core,
      alpha: 0.12,
      scale: 1.25,
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    const orbRing = scene.add.container(0, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const orb = scene.add.circle(
        Math.cos(a) * r * 0.7,
        Math.sin(a) * r * 0.7,
        3,
        COLORS.cyan,
        0.85,
      );
      orb.setBlendMode(Phaser.BlendModes.ADD);
      orbRing.add(orb);
      scene.tweens.add({
        targets: orb,
        alpha: 0.25,
        duration: 500 + i * 90,
        yoyo: true,
        repeat: -1,
      });
    }
    this.shieldLocal.add(orbRing);
    scene.tweens.add({ targets: orbRing, angle: 360, duration: 4_200, repeat: -1 });

    const ripple = () => this.emitShieldRipple(scene, r);
    ripple();
    this.rippleTimer = scene.time.addEvent({
      delay: 2_000,
      loop: true,
      callback: ripple,
    });
  }

  /** Delikatna fala tarczy — rozchodzi się na miejscu, nie jak pocisk. */
  private emitShieldRipple(scene: Phaser.Scene, r: number): void {
    const ring = scene.add.circle(0, 0, r * 0.45, BTTF.colors.fluxBlue, 0);
    ring.setStrokeStyle(2, COLORS.cyan, 0.65);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldLocal.add(ring);

    scene.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: 880,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });

    scene.tweens.add({
      targets: this.shieldLocal,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 160,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  destroy(): void {
    this.rippleTimer?.remove();
  }
}
