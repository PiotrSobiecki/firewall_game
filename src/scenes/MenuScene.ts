import Phaser from "phaser";
import { COLOR_HEX, GAME_WIDTH, GAME_HEIGHT } from "../config";
import { RetroGridBackground } from "../ui/RetroGridBackground";

/** Ekran startowy: tytuł + START (Enter lub klik). */
export class MenuScene extends Phaser.Scene {
  private bg!: RetroGridBackground;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.bg = new RetroGridBackground(this);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, "FIREWALL", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: COLOR_HEX.cyan,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32 + 50, "opanuj chaos w sieci", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: COLOR_HEX.magenta,
      })
      .setOrigin(0.5);

    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, "▶ START", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: COLOR_HEX.green,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: start,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.62 + 40,
        "ENTER / klik — ruch: ← → ↑ ↓ / WASD · przytrzymaj SPACJĘ = tarcza",
        { fontFamily: "monospace", fontSize: "11px", color: COLOR_HEX.yellow },
      )
      .setOrigin(0.5);

    const begin = () => this.scene.start("GameScene");
    start.on("pointerdown", begin);
    this.input.keyboard?.once("keydown-ENTER", begin);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta / 1000);
  }
}
