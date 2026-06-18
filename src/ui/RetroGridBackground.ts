import Phaser from "phaser";
import { BTTF, COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";

type CactusKind = "saguaro" | "saguaroShort" | "barrel";

interface CactusPlacement {
  side: "left" | "right";
  offset: number;
  kind: CactusKind;
  scale: number;
}

const CACTUS_KINDS: CactusKind[] = ["saguaro", "barrel", "saguaroShort", "saguaro", "barrel", "saguaroShort"];

function buildCactusPlacements(): CactusPlacement[] {
  const { period, spacing } = BTTF.cactus;
  const out: CactusPlacement[] = [];
  for (let offset = 0; offset < period; offset += spacing) {
    const i = out.length;
    out.push({
      side: i % 2 === 0 ? "left" : "right",
      offset,
      kind: CACTUS_KINDS[i % CACTUS_KINDS.length],
      scale: 0.8 + (i % 4) * 0.08,
    });
  }
  return out;
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
  private readonly cactusScrollSpeed = BTTF.cactus.scrollSpeed;
  private readonly cactusPeriod = BTTF.cactus.period;
  private readonly cactusPlacements = buildCactusPlacements();
  private readonly horizonY = GAME_HEIGHT * BTTF.sunYRatio;
  private readonly sunX = GAME_WIDTH * BTTF.sunXRatio;

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
    const { edgeInset, roadDrift } = BTTF.cactus;
    const cull = 18;

    for (const p of this.cactusPlacements) {
      const travel = (p.offset - scroll + this.cactusPeriod) % this.cactusPeriod;
      const x =
        p.side === "left"
          ? edgeInset + travel * roadDrift
          : GAME_WIDTH - edgeInset - travel * roadDrift;
      if (x < 4 || x > GAME_WIDTH - 4) continue;
      if (travel > this.cactusPeriod - cull) continue;
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
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.62, w * 0.85, h * 0.22, 3);
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.78, w * 0.85, h * 0.2, 3);
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
    const sx = this.sunX;
    const bands = [
      { y: hy - 70, h: 40, color: BTTF.colors.sunsetTop, alpha: 0.55 },
      { y: hy - 30, h: 35, color: BTTF.colors.sunsetMid, alpha: 0.5 },
      { y: hy, h: GAME_HEIGHT - hy, color: BTTF.colors.sunsetLow, alpha: 0.28 },
    ];
    for (const b of bands) {
      g.fillStyle(b.color, b.alpha);
      g.fillRect(0, b.y, GAME_WIDTH, b.h);
    }
    g.fillStyle(0x8a4a18, 0.22);
    g.fillRect(0, hy + 8, GAME_WIDTH, GAME_HEIGHT - hy - 8);
    this.fillSunArc(g, sx, hy, 52, 0xffcc66, 0.2);
    this.fillSunArc(g, sx, hy, 36, 0xffe0a0, 0.38);
  }

  /** Górna połówka kuli — środek na linii horyzontu. */
  private fillSunArc(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    hy: number,
    radius: number,
    color: number,
    alpha: number,
  ): void {
    g.fillStyle(color, alpha);
    g.beginPath();
    g.arc(cx, hy, radius, Math.PI, 0, false);
    g.lineTo(cx, hy);
    g.closePath();
    g.fillPath();
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
