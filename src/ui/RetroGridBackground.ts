import Phaser from "phaser";
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * Animowana siatka neon + scanline overlay. Tło scen rozgrywki/menu.
 */
export class RetroGridBackground {
  private grid: Phaser.GameObjects.Graphics;
  private offset = 0;
  private readonly spacing = 40;
  private readonly scrollSpeed = 60; // px/s

  constructor(private scene: Phaser.Scene) {
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.bg,
    ).setDepth(-2);

    this.grid = scene.add.graphics();
    this.grid.setDepth(-1);

    this.drawScanlines();
  }

  update(dtSec: number): void {
    this.offset = (this.offset + this.scrollSpeed * dtSec) % this.spacing;
    this.grid.clear();
    this.grid.lineStyle(1, COLORS.cyan, 0.18);

    for (let x = 0; x <= GAME_WIDTH; x += this.spacing) {
      this.grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = this.offset; y <= GAME_HEIGHT; y += this.spacing) {
      this.grid.lineBetween(0, y, GAME_WIDTH, y);
    }
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
