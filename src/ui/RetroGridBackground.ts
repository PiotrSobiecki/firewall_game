import Phaser from "phaser";
import { BTTF, COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * Animowana siatka neon + zachód słońca + scanline overlay.
 */
export class RetroGridBackground {
  private grid: Phaser.GameObjects.Graphics;
  private horizon: Phaser.GameObjects.Graphics;
  private offset = 0;
  private readonly spacing = 40;
  private readonly scrollSpeed = 60; // px/s
  private readonly sunY = GAME_HEIGHT * BTTF.sunYRatio;
  private readonly horizonY = GAME_HEIGHT * BTTF.sunYRatio - 6;

  constructor(private scene: Phaser.Scene) {
    scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg)
      .setDepth(-3);

    this.horizon = scene.add.graphics();
    this.horizon.setDepth(-2);
    this.drawSunset();

    this.grid = scene.add.graphics();
    this.grid.setDepth(-1);

    this.drawScanlines();
  }

  update(dtSec: number): void {
    this.offset = (this.offset + this.scrollSpeed * dtSec) % this.spacing;
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
