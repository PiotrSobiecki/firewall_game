import Phaser from "phaser";
import { BTTF, COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";

type CactusKind = "saguaro" | "saguaroShort" | "barrel";

interface CactusPlacement {
  side: "left" | "right";
  offset: number;
  kind: CactusKind;
  scale: number;
}

/**
 * Animowana siatka neon + zachód słońca + pustynne kaktusy przy drodze.
 */
export class RetroGridBackground {
  private grid: Phaser.GameObjects.Graphics;
  private horizon: Phaser.GameObjects.Graphics;
  private cacti: Phaser.GameObjects.Graphics;
  private offset = 0;
  private cactusScroll = 0;
  private readonly spacing = 40;
  private readonly scrollSpeed = 60; // px/s
  private readonly cactusScrollSpeed = 32; // px/s — wolny parallax przy drodze
  private readonly cactusPeriod = 300;
  private readonly sunY = GAME_HEIGHT * BTTF.sunYRatio;
  private readonly horizonY = GAME_HEIGHT * BTTF.sunYRatio - 6;
  private readonly cactusPlacements: CactusPlacement[] = [
    { side: "left", offset: 0, kind: "saguaro", scale: 1 },
    { side: "left", offset: 95, kind: "barrel", scale: 0.95 },
    { side: "right", offset: 45, kind: "saguaroShort", scale: 0.88 },
    { side: "right", offset: 140, kind: "saguaro", scale: 1.05 },
    { side: "left", offset: 200, kind: "saguaroShort", scale: 0.82 },
    { side: "right", offset: 245, kind: "barrel", scale: 1.1 },
    { side: "left", offset: 270, kind: "barrel", scale: 0.9 },
  ];

  constructor(private scene: Phaser.Scene) {
    scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg)
      .setDepth(-3);

    this.horizon = scene.add.graphics();
    this.horizon.setDepth(-2);
    this.drawSunset();

    this.cacti = scene.add.graphics();
    this.cacti.setDepth(-1.5);

    this.grid = scene.add.graphics();
    this.grid.setDepth(-1);

    this.drawScanlines();
  }

  update(dtSec: number): void {
    this.offset = (this.offset + this.scrollSpeed * dtSec) % this.spacing;
    this.cactusScroll += this.cactusScrollSpeed * dtSec;

    this.grid.clear();

    const vx = GAME_WIDTH / 2;
    const { sunsetLow } = BTTF.colors;
    this.grid.lineStyle(2, sunsetLow, 0.22);
    for (let i = -3; i <= 3; i++) {
      const bx = vx + i * 52;
      this.grid.lineBetween(bx, this.horizonY, vx + i * 140, GAME_HEIGHT + 20);
    }

    this.grid.lineStyle(1, COLORS.cyan, 0.14);
    for (let x = 0; x <= GAME_WIDTH; x += this.spacing) {
      this.grid.lineBetween(x, 0, x, this.horizonY);
    }
    for (let y = this.offset; y <= this.horizonY; y += this.spacing) {
      this.grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    this.drawCacti();
  }

  /** Kaktusy po bokach drogi — powoli mijane w parallaxie. */
  private drawCacti(): void {
    const g = this.cacti;
    g.clear();
    const groundY = GAME_HEIGHT - 5;
    const scroll = this.cactusScroll % this.cactusPeriod;

    for (const p of this.cactusPlacements) {
      let travel = (p.offset - scroll + this.cactusPeriod) % this.cactusPeriod;
      const x =
        p.side === "left"
          ? 16 + travel * 0.24
          : GAME_WIDTH - 16 - travel * 0.24;
      if (x < 8 || x > GAME_WIDTH - 8) continue;
      if (travel > this.cactusPeriod - 24) continue;
      this.drawCactus(g, x, groundY, p.kind, p.scale);
    }
  }

  private drawCactus(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    kind: CactusKind,
    scale: number,
  ): void {
    const { cactus, cactusHi } = BTTF.colors;
    if (kind === "barrel") {
      this.drawBarrelCactus(g, x, groundY, scale, cactus, cactusHi);
    } else {
      this.drawSaguaro(g, x, groundY, scale, kind === "saguaroShort", cactus, cactusHi);
    }
  }

  /** Klasyczny saguaro z ramionami (sylwetka). */
  private drawSaguaro(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    short: boolean,
    fill: number,
    hi: number,
  ): void {
    const h = (short ? 52 : 78) * scale;
    const w = 14 * scale;
    g.fillStyle(fill, 0.92);
    g.fillRoundedRect(x - w / 2, groundY - h, w, h, 4);
    if (!short) {
      // ramię lewe
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.62, w * 0.85, h * 0.22, 3);
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.78, w * 0.85, h * 0.2, 3);
      // ramię prawe
      g.fillRoundedRect(x + w * 0.55, groundY - h * 0.48, w * 0.85, h * 0.2, 3);
      g.fillRoundedRect(x + w * 0.55, groundY - h * 0.64, w * 0.85, h * 0.18, 3);
    }
    g.fillStyle(hi, 0.45);
    g.fillRect(x - w * 0.15, groundY - h, w * 0.22, h * 0.7);
  }

  /** Niski, okrągły kaktus jak na pustyni Arizona. */
  private drawBarrelCactus(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    fill: number,
    hi: number,
  ): void {
    const r = 11 * scale;
    g.fillStyle(fill, 0.92);
    g.fillCircle(x, groundY - r, r);
    g.fillCircle(x - r * 0.75, groundY - r * 0.55, r * 0.72);
    g.fillCircle(x + r * 0.7, groundY - r * 0.5, r * 0.65);
    g.fillStyle(hi, 0.4);
    g.fillCircle(x - r * 0.25, groundY - r * 1.1, r * 0.28);
  }

  private drawSunset(): void {
    const g = this.horizon;
    const hy = this.horizonY;
    const sy = this.sunY;
    const bands = [
      { y: hy - 70, h: 40, color: BTTF.colors.sunsetTop, alpha: 0.55 },
      { y: hy - 30, h: 35, color: BTTF.colors.sunsetMid, alpha: 0.5 },
      { y: hy, h: GAME_HEIGHT - hy, color: BTTF.colors.sunsetLow, alpha: 0.28 },
    ];
    for (const b of bands) {
      g.fillStyle(b.color, b.alpha);
      g.fillRect(0, b.y, GAME_WIDTH, b.h);
    }
    // ciemniejszy pas „ziemi” przy krawędzi drogi
    g.fillStyle(0x8a4a18, 0.22);
    g.fillRect(0, hy + 8, GAME_WIDTH, GAME_HEIGHT - hy - 8);
    g.fillStyle(0xffe0a0, 0.35);
    g.fillCircle(GAME_WIDTH / 2, sy, 36);
    g.fillStyle(0xffcc66, 0.2);
    g.fillCircle(GAME_WIDTH / 2, sy, 52);
  }

  private drawScanlines(): void {
    const scan = this.scene.add.graphics();
    scan.setDepth(20);
    scan.fillStyle(0x000000, 0.18);
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      scan.fillRect(0, y, GAME_WIDTH, 1);
    }
  }
}
