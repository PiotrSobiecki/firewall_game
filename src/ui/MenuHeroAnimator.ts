import Phaser from "phaser";
import { BTTF, COLORS, GAME_HEIGHT, GAME_WIDTH } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

const REF_TEX_W = 418;
const REF_TEX_H = 597;

const WALK_TEXTURES = [
  TEXTURE.menuHeroWalk1,
  TEXTURE.menuHeroWalk2,
  TEXTURE.menuHeroWalk3,
  TEXTURE.menuHeroWalk4,
] as const;

/** Bohaterka na menu: idle (menu_hero) + animacja chodu z 4 klatek. */
export class MenuHeroAnimator {
  private readonly container: Phaser.GameObjects.Container;
  private readonly facingPivot: Phaser.GameObjects.Container;
  private readonly heroPivot: Phaser.GameObjects.Container;
  private readonly hero: Phaser.GameObjects.Image;
  private readonly shieldLocal: Phaser.GameObjects.Container;
  private readonly baseY: number;
  private readonly xMin: number;
  private readonly xMax: number;
  private readonly walkSpeed: number;
  private readonly walkFrameSec: number;
  private readonly idleScale: number;
  private readonly walkScale: number;
  private readonly walkGroundYOffset: number;
  private readonly walkShieldExtraY: number;
  private readonly walkFrameFootLift: readonly number[];
  private xPos: number;
  private faceDir = 1;
  private walking = false;
  private walkFrameIdx = 0;
  private walkFrameClock = 0;
  private idlePivotTweens: Phaser.Tweens.Tween[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private lastShieldFlashAt = 0;
  private rippleTimer?: Phaser.Time.TimerEvent;
  private touchPointerId = -1;
  private touchDir = 0;
  private readonly scene: Phaser.Scene;

  /** Strefa przycisku START — nie przechwytuj dotyku do chodzenia. */
  private static readonly START_BLOCK_W = 140;
  private static readonly START_BLOCK_H = 44;
  private static readonly WALK_ZONE_Y_MIN = GAME_HEIGHT * 0.48;
  private static readonly TOUCH_DEADZONE = 14;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const {
      scale,
      xRatio,
      yRatio,
      depth,
      walkSpeed,
      xMin,
      xMax,
      walkFrameMs,
      walkScaleMul,
      walkFrameFootLift,
      walkGroundYOffset,
      walkShieldExtraY,
    } = BTTF.menuHero;
    this.idleScale = scale;
    this.walkScale = scale * walkScaleMul;
    this.walkGroundYOffset = walkGroundYOffset;
    this.walkShieldExtraY = walkShieldExtraY;
    this.walkFrameFootLift = walkFrameFootLift;
    this.xPos = GAME_WIDTH * xRatio;
    this.baseY = GAME_HEIGHT * yRatio;
    this.xMin = xMin;
    this.xMax = xMax;
    this.walkSpeed = walkSpeed;
    this.walkFrameSec = walkFrameMs / 1000;

    this.container = scene.add.container(this.xPos, this.baseY).setDepth(depth);
    this.facingPivot = scene.add.container(0, 0);
    this.container.add(this.facingPivot);

    this.heroPivot = scene.add.container(0, 0);
    this.heroPivot.setScale(this.idleScale);
    this.facingPivot.add(this.heroPivot);

    this.hero = scene.add.image(0, 0, TEXTURE.menuHero);
    this.hero.setOrigin(0.5, 1);
    this.heroPivot.add(this.hero);

    this.shieldLocal = scene.add.container(0, 0);
    this.heroPivot.add(this.shieldLocal);
    this.syncShieldPosition();

    const kb = scene.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.startIdleMotion(scene);
    this.startShieldAura(scene);
    this.setupTouch(scene);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Dotyk: palec po drodze = chodzenie, stuk w postać = tarcza. */
  private setupTouch(scene: Phaser.Scene): void {
    if (!scene.sys.game.device.input.touch) return;
    scene.input.on("pointerdown", this.onTouchStart, this);
    scene.input.on("pointermove", this.onTouchMove, this);
    scene.input.on("pointerup", this.onTouchEnd, this);
    scene.input.on("pointerupoutside", this.onTouchEnd, this);
  }

  private onTouchStart(p: Phaser.Input.Pointer): void {
    if (this.isTapOnHero(p)) {
      this.triggerShieldFlash();
      return;
    }
    if (!this.isWalkTouchZone(p)) return;
    this.touchPointerId = p.id;
    this.setTouchDir(p);
  }

  private onTouchMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.touchPointerId) return;
    this.setTouchDir(p);
  }

  private onTouchEnd(p: Phaser.Input.Pointer): void {
    if (p.id !== this.touchPointerId) return;
    this.touchPointerId = -1;
    this.touchDir = 0;
  }

  private setTouchDir(p: Phaser.Input.Pointer): void {
    const dx = p.x - this.xPos;
    this.touchDir =
      Math.abs(dx) < MenuHeroAnimator.TOUCH_DEADZONE ? 0 : Math.sign(dx);
  }

  private isWalkTouchZone(p: Phaser.Input.Pointer): boolean {
    if (p.y < MenuHeroAnimator.WALK_ZONE_Y_MIN) return false;
    const startY = GAME_HEIGHT * 0.55;
    const cx = GAME_WIDTH / 2;
    if (
      Math.abs(p.x - cx) < MenuHeroAnimator.START_BLOCK_W / 2 &&
      Math.abs(p.y - startY) < MenuHeroAnimator.START_BLOCK_H / 2
    ) {
      return false;
    }
    return true;
  }

  private isTapOnHero(p: Phaser.Input.Pointer): boolean {
    const b = this.container.getBounds();
    return Phaser.Geom.Rectangle.Contains(
      Phaser.Geom.Rectangle.Inflate(b, 24, 16),
      p.x,
      p.y,
    );
  }

  private teardownTouch(): void {
    this.scene.input.off("pointerdown", this.onTouchStart, this);
    this.scene.input.off("pointermove", this.onTouchMove, this);
    this.scene.input.off("pointerup", this.onTouchEnd, this);
    this.scene.input.off("pointerupoutside", this.onTouchEnd, this);
  }

  update(dtSec: number): void {
    let dir = 0;
    if (this.touchPointerId >= 0) {
      dir = this.touchDir;
    } else {
      if (this.cursors?.left.isDown || this.keyA?.isDown) dir -= 1;
      if (this.cursors?.right.isDown || this.keyD?.isDown) dir += 1;
    }

    if (dir !== 0) this.faceDir = dir;

    this.xPos = Phaser.Math.Clamp(
      this.xPos + dir * this.walkSpeed * dtSec,
      this.xMin,
      this.xMax,
    );
    this.container.x = this.xPos;
    this.facingPivot.scaleX = this.faceDir;

    const moving = dir !== 0;
    if (moving !== this.walking) this.setWalking(moving);

    if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.triggerShieldFlash();
    }

    if (moving) {
      this.walkFrameClock += dtSec;
      while (this.walkFrameClock >= this.walkFrameSec) {
        this.walkFrameClock -= this.walkFrameSec;
        this.walkFrameIdx = (this.walkFrameIdx + 1) % WALK_TEXTURES.length;
        this.applyWalkFrame(this.walkFrameIdx);
      }
    }
  }

  private applyWalkFrame(index: number): void {
    this.hero.setTexture(WALK_TEXTURES[index]);
    this.hero.setOrigin(0.5, 1);
    this.heroPivot.setScale(this.walkScale);
    this.heroPivot.angle = 0;
    const lift = this.walkFrameFootLift[index] ?? 0;
    this.hero.y = -lift;
    this.syncShieldPosition();
    this.heroPivot.bringToTop(this.shieldLocal);
  }

  private syncShieldPosition(): void {
    const { shieldOffset } = BTTF.menuHero;
    const w = this.hero.frame.width;
    const h = this.hero.frame.height;
    const extraY = this.walking ? this.walkShieldExtraY : 0;
    this.shieldLocal.setPosition(
      shieldOffset.x * (w / REF_TEX_W),
      shieldOffset.y * (h / REF_TEX_H) + extraY + this.hero.y,
    );
  }

  /** Skala bieżącej klatki względem menu_hero (do promienia tarczy). */
  private heroTexScale(): { sx: number; sy: number } {
    const w = this.hero.frame.width;
    const h = this.hero.frame.height;
    return { sx: w / REF_TEX_W, sy: h / REF_TEX_H };
  }

  private setWalking(active: boolean): void {
    this.walking = active;
    if (active) {
      this.stopIdlePivotTweens();
      this.heroPivot.angle = 0;
      this.lockGroundLine();
      this.walkFrameIdx = 0;
      this.walkFrameClock = 0;
      this.applyWalkFrame(0);
      return;
    }

    this.hero.setTexture(TEXTURE.menuHero);
    this.hero.setOrigin(0.5, 1);
    this.hero.y = 0;
    this.heroPivot.setScale(this.idleScale);
    this.heroPivot.angle = 0;
    this.syncShieldPosition();
    this.lockGroundLine();
    this.startIdleMotion(this.hero.scene);
  }

  /** Stopy zawsze na tej samej linii drogi — bez skoku kontenera. */
  private lockGroundLine(): void {
    this.container.y = this.baseY;
    this.heroPivot.y = this.walking ? this.walkGroundYOffset : 0;
  }

  private startIdleMotion(scene: Phaser.Scene): void {
    this.startIdlePivotTweens(scene);
  }

  private startIdlePivotTweens(scene: Phaser.Scene): void {
    if (this.walking) return;
    this.stopIdlePivotTweens();
    const s = this.idleScale;
    this.idlePivotTweens = [
      scene.tweens.add({
        targets: this.heroPivot,
        scaleX: s * 1.02,
        scaleY: s * 0.985,
        duration: 2_100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
      scene.tweens.add({
        targets: this.heroPivot,
        angle: 0.6,
        duration: 2_800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    ];
  }

  private stopIdleMotion(resetPose: boolean): void {
    this.stopIdlePivotTweens();
    if (resetPose) {
      this.heroPivot.setScale(this.walking ? this.walkScale : this.idleScale);
      this.heroPivot.y = 0;
      this.heroPivot.angle = 0;
    }
  }

  private stopIdlePivotTweens(): void {
    for (const t of this.idlePivotTweens) t.stop();
    this.idlePivotTweens = [];
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
    scene.tweens.add({
      targets: orbRing,
      angle: 360,
      duration: 4_200,
      repeat: -1,
    });

    const ripple = () => this.emitShieldRipple(scene);
    ripple();
    this.rippleTimer = scene.time.addEvent({
      delay: 2_000,
      loop: true,
      callback: ripple,
    });
  }

  /** Spacja — krótka tarcza z wyciągniętej rękawicy (błysk ~0,2 s). */
  private triggerShieldFlash(): void {
    const scene = this.hero.scene;
    const now = scene.time.now;
    if (now - this.lastShieldFlashAt < 320) return;
    this.lastShieldFlashAt = now;

    const { shieldRadius } = BTTF.menuHero;
    const { sy } = this.heroTexScale();
    const r = shieldRadius * sy * 2;

    const burst = scene.add.container(0, 0);
    this.shieldLocal.add(burst);
    this.shieldLocal.bringToTop(burst);

    const fill = scene.add.circle(0, 0, r * 0.88, BTTF.colors.fluxBlue, 0.28);
    fill.setStrokeStyle(2, COLORS.cyan, 0.7);
    fill.setBlendMode(Phaser.BlendModes.ADD);
    burst.add(fill);

    const gfx = scene.add.graphics();
    burst.add(gfx);
    this.drawHandShieldArc(gfx, r, 1);

    burst.setAlpha(0);
    burst.setScale(0.85);
    scene.tweens.add({
      targets: burst,
      alpha: 1,
      scale: 1,
      duration: 50,
      ease: "Quad.easeOut",
      onComplete: () => {
        scene.tweens.add({
          targets: burst,
          alpha: 0,
          scale: 1.08,
          duration: 160,
          ease: "Quad.easeIn",
          onComplete: () => burst.destroy(),
        });
      },
    });
  }

  /** Łuk tarczy przed postacią (w prawo w lokalnym układzie — obraca się z facingPivot). */
  private drawHandShieldArc(
    gfx: Phaser.GameObjects.Graphics,
    r: number,
    intensity: number,
  ): void {
    gfx.clear();
    const color = COLORS.cyan;
    const half = Phaser.Math.DegToRad(72);
    const center = 0;
    const steps = 24;
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = center - half + (2 * half * i) / steps;
      pts.push(new Phaser.Math.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }

    gfx.lineStyle(6, color, 0.15 * intensity);
    gfx.strokePoints(pts, false, false);
    gfx.lineStyle(2, color, 0.4 * intensity);
    gfx.strokePoints(
      pts.map((p) => p.clone().scale(0.8)),
      false,
      false,
    );
    gfx.lineStyle(3, color, 0.95 * intensity);
    gfx.strokePoints(pts, false, false);
    gfx.fillStyle(0xffffff, 0.4 * intensity);
    gfx.fillCircle(r * 0.15, 0, r * 0.14);
  }

  private spawnBurstRing(
    scene: Phaser.Scene,
    startScale: number,
    color: number,
    strokeAlpha: number,
    duration: number,
    endScale: number,
    strokeWidth: number,
  ): void {
    const { shieldRadius } = BTTF.menuHero;
    const { sy } = this.heroTexScale();
    const baseR = shieldRadius * sy;
    const ring = scene.add.circle(0, 0, baseR * startScale, color, 0);
    ring.setStrokeStyle(strokeWidth, color, strokeAlpha);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldLocal.add(ring);
    scene.tweens.add({
      targets: ring,
      scale: endScale / startScale,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }
  private emitShieldRipple(scene: Phaser.Scene): void {
    this.spawnBurstRing(scene, 0.45, COLORS.cyan, 0.65, 880, 1.7, 2);
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
    this.teardownTouch();
    this.stopIdleMotion(true);
    this.rippleTimer?.remove();
  }
}
