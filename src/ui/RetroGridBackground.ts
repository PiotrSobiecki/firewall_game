import Phaser from "phaser";
import { BTTF, COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";
import { drawPixelTumbleweed } from "./PixelTumbleweed";

type CactusKind = "saguaro" | "saguaroShort" | "barrel";

interface CactusPlacement {
  side: "left" | "right";
  offset: number;
  kind: CactusKind;
  scale: number;
}

interface StaticCactus {
  x: number;
  y: number;
  kind: CactusKind;
  scale: number;
}

interface StaticScrub {
  x: number;
  y: number;
  scale: number;
}

interface ActiveTumbleweed {
  travel: number;
  roll: number;
  scale: number;
  yStart: number;
  yEnd: number;
}

const CACTUS_KINDS: CactusKind[] = ["saguaro", "barrel", "saguaroShort", "saguaro", "barrel", "saguaroShort"];

function buildCactusPlacements(period: number, spacing: number): CactusPlacement[] {
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

/** Nieruchome kaktusy pod horyzontem — rozłożone na całą szerokość. */
function buildStaticHorizonCacti(horizonY: number): StaticCactus[] {
  const { count, yBase, ySpread, scaleMin, scaleMax } = BTTF.cactus.background;
  const out: StaticCactus[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const jitter = Math.sin(i * 2.17) * 18;
    out.push({
      x: Phaser.Math.Clamp(14 + t * (GAME_WIDTH - 28) + jitter, 10, GAME_WIDTH - 10),
      y: horizonY + yBase + (i % 3) * (ySpread / 3),
      kind: CACTUS_KINDS[i % CACTUS_KINDS.length],
      scale: scaleMin + (i % 4) * ((scaleMax - scaleMin) / 3),
    });
  }
  return out;
}

/** Krzaki nieruchome — rzadkie, nad pasem bohaterki / drogi. */
function buildStaticScrub(horizonY: number): StaticScrub[] {
  const { count, yMin, yMax, scaleMin, scaleMax } = BTTF.cactus.scrub;
  const groundCap =
    GAME_HEIGHT - BTTF.cactus.tumbleweed.yOffset - BTTF.cactus.tumbleweed.groundClearance;
  const out: StaticScrub[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.37) / count;
    const xJitter = Math.cos(i * 1.73) * 22;
    const yJitter = Math.sin(i * 2.91) * 28;
    const y = horizonY + yMin + ((i * 47) % (yMax - yMin)) + yJitter * 0.35;
    out.push({
      x: Phaser.Math.Clamp(12 + t * (GAME_WIDTH - 24) + xJitter, 8, GAME_WIDTH - 8),
      y: Math.min(y, groundCap - 6),
      scale: scaleMin + (i % 3) * ((scaleMax - scaleMin) / 2),
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
  /** Dalekie kaktusy, krzaki i kłęby — pod kaktusami z przodu i graczem. */
  private cactiBack: Phaser.GameObjects.Graphics;
  /** Kaktusy przy krawędzi drogi (parallax). */
  private cactiFront: Phaser.GameObjects.Graphics;
  private offset = 0;
  private cactusScroll = 0;
  private activeTumbleweeds: ActiveTumbleweed[] = [];
  private tumbleSpawnCd = 1.2;
  private readonly spacing = 40;
  private readonly scrollSpeed = 60; // px/s
  private readonly cactusScrollSpeed = BTTF.cactus.scrollSpeed;
  private readonly cactusPeriod = BTTF.cactus.period;
  private readonly cactusPlacements = buildCactusPlacements(
    BTTF.cactus.period,
    BTTF.cactus.spacing,
  );
  private readonly horizonY = GAME_HEIGHT * BTTF.sunYRatio;
  private readonly sunX = GAME_WIDTH * BTTF.sunXRatio;
  private readonly staticHorizonCacti: StaticCactus[];
  private readonly staticScrub: StaticScrub[];

  constructor(private scene: Phaser.Scene) {
    this.staticHorizonCacti = buildStaticHorizonCacti(this.horizonY);
    this.staticScrub = buildStaticScrub(this.horizonY);

    scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg)
      .setDepth(-3);

    this.horizon = scene.add.graphics();
    this.horizon.setDepth(-2);
    this.drawSunset();

    this.cactiBack = scene.add.graphics();
    this.cactiBack.setDepth(-1.85);

    this.cactiFront = scene.add.graphics();
    this.cactiFront.setDepth(-1.55);

    this.grid = scene.add.graphics();
    this.grid.setDepth(-1);

    this.drawScanlines();
  }

  update(dtSec: number): void {
    this.offset = (this.offset + this.scrollSpeed * dtSec) % this.spacing;
    this.cactusScroll += this.cactusScrollSpeed * dtSec;
    this.updateTumbleweeds(dtSec);

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

  private drawCacti(): void {
    const back = this.cactiBack;
    back.clear();
    this.drawStaticHorizonCacti(back);
    this.drawStaticScrub(back);
    this.drawTumbleweeds(back);

    const front = this.cactiFront;
    front.clear();
    this.drawForegroundCacti(front);
  }

  /** Dalekie kaktusy pod horyzontem — bez parallaxu. */
  private drawStaticHorizonCacti(g: Phaser.GameObjects.Graphics): void {
    const { alpha } = BTTF.cactus.background;
    for (const p of this.staticHorizonCacti) {
      this.drawCactus(g, p.x, p.y, p.kind, p.scale, alpha);
    }
  }

  /** Krzaki rozrzucone po pustyni — nieruchome. */
  private drawStaticScrub(g: Phaser.GameObjects.Graphics): void {
    const { scrub, scrubHi, alpha } = BTTF.cactus.scrub;
    for (const p of this.staticScrub) {
      this.drawScrub(g, p.x, p.y, p.scale, scrub, scrubHi, alpha);
    }
  }

  /** Kaktusy blisko — parallax przy krawędziach drogi (jak wcześniej). */
  private drawForegroundCacti(g: Phaser.GameObjects.Graphics): void {
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

  /** Pojedyncze kłęby — max 2, w tym samym kierunku, z odstępem. */
  private updateTumbleweeds(dtSec: number): void {
    const cfg = BTTF.cactus.tumbleweed;
    const { scrollSpeed, maxTravel, maxOnScreen, minTravelGap, rollSpeed } = cfg;

    for (const t of this.activeTumbleweeds) {
      t.travel += scrollSpeed * dtSec;
      t.roll += rollSpeed * dtSec;
    }
    this.activeTumbleweeds = this.activeTumbleweeds.filter((t) => t.travel < maxTravel);

    this.tumbleSpawnCd -= dtSec;
    if (this.tumbleSpawnCd > 0 || this.activeTumbleweeds.length >= maxOnScreen) return;

    if (this.activeTumbleweeds.length > 0) {
      const leadTravel = Math.max(...this.activeTumbleweeds.map((t) => t.travel));
      if (leadTravel < minTravelGap) return;
    }

    const desertTop = this.horizonY + cfg.yMin;
    const groundY = GAME_HEIGHT - cfg.yOffset;
    const maxY = groundY - cfg.groundClearance;
    const yBand = Math.max(36, maxY - desertTop);

    this.activeTumbleweeds.push({
      travel: 0,
      roll: 0,
      scale: 0.92 + Math.random() * 0.28,
      yStart: desertTop + Math.random() * yBand * 0.82,
      yEnd: 0,
    });
    const t = this.activeTumbleweeds[this.activeTumbleweeds.length - 1];
    const slant = Phaser.Math.FloatBetween(cfg.slantYMin, cfg.slantYMax);
    t.yEnd = Phaser.Math.Clamp(t.yStart + slant, desertTop + 8, maxY);
    if (Math.abs(t.yEnd - t.yStart) < 18) {
      t.yEnd = Phaser.Math.Clamp(t.yStart + 28, desertTop + 8, maxY);
    }

    this.tumbleSpawnCd =
      Phaser.Math.Between(cfg.spawnDelayMs.min, cfg.spawnDelayMs.max) / 1000;
  }

  /** Kłęby — pixel art, ukośnie przez całą pustynię (warstwa pod kaktusami z przodu). */
  private drawTumbleweeds(g: Phaser.GameObjects.Graphics): void {
    const { scaleMin, scaleMax, alpha, maxTravel } = BTTF.cactus.tumbleweed;
    const cull = 16;
    const farLimit = maxTravel - cull;
    const palette = {
      base: BTTF.colors.tumbleweed,
      hi: BTTF.colors.tumbleweedHi,
      dark: BTTF.colors.tumbleweedOutline,
      strand: BTTF.colors.tumbleweedStrand,
    };

    for (const t of this.activeTumbleweeds) {
      if (t.travel > farLimit) continue;

      const progress = t.travel / farLimit;
      const depthEase = progress * progress;
      const x = Phaser.Math.Linear(-55, GAME_WIDTH + 55, progress);
      const y = Phaser.Math.Linear(t.yStart, t.yEnd, progress);
      const scale = t.scale * Phaser.Math.Linear(scaleMin, scaleMax, depthEase);
      drawPixelTumbleweed(g, x, y, scale, t.roll, palette, alpha);
    }
  }

  private drawCactus(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    kind: CactusKind,
    scale: number,
    alpha = 0.92,
  ): void {
    const { cactus, cactusHi } = BTTF.colors;
    if (kind === "barrel") {
      this.drawBarrelCactus(g, x, groundY, scale, cactus, cactusHi, alpha);
    } else {
      this.drawSaguaro(g, x, groundY, scale, kind === "saguaroShort", cactus, cactusHi, alpha);
    }
  }

  private drawSaguaro(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    short: boolean,
    fill: number,
    hi: number,
    alpha: number,
  ): void {
    const h = (short ? 52 : 78) * scale;
    const w = 14 * scale;
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(x - w / 2, groundY - h, w, h, 4);
    if (!short) {
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.62, w * 0.85, h * 0.22, 3);
      g.fillRoundedRect(x - w * 1.9, groundY - h * 0.78, w * 0.85, h * 0.2, 3);
      g.fillRoundedRect(x + w * 0.55, groundY - h * 0.48, w * 0.85, h * 0.2, 3);
      g.fillRoundedRect(x + w * 0.55, groundY - h * 0.64, w * 0.85, h * 0.18, 3);
    }
    g.fillStyle(hi, alpha * 0.48);
    g.fillRect(x - w * 0.15, groundY - h, w * 0.22, h * 0.7);
  }

  private drawBarrelCactus(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    fill: number,
    hi: number,
    alpha: number,
  ): void {
    const r = 11 * scale;
    g.fillStyle(fill, alpha);
    g.fillCircle(x, groundY - r, r);
    g.fillCircle(x - r * 0.75, groundY - r * 0.55, r * 0.72);
    g.fillCircle(x + r * 0.7, groundY - r * 0.5, r * 0.65);
    g.fillStyle(hi, alpha * 0.4);
    g.fillCircle(x - r * 0.25, groundY - r * 1.1, r * 0.28);
  }

  /** Niski, szeroki krzak — rozproszony po całej pustyni. */
  private drawScrub(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    fill: number,
    hi: number,
    alpha: number,
  ): void {
    const w = 22 * scale;
    const h = 10 * scale;
    g.fillStyle(fill, alpha);
    g.fillEllipse(x - w * 0.35, groundY - h * 0.6, w * 0.7, h);
    g.fillEllipse(x + w * 0.25, groundY - h * 0.55, w * 0.65, h * 0.9);
    g.fillEllipse(x, groundY - h * 0.85, w * 0.55, h * 0.75);
    g.fillStyle(hi, alpha * 0.45);
    g.fillEllipse(x - w * 0.1, groundY - h * 1.1, w * 0.25, h * 0.35);
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
