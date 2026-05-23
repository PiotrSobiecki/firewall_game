import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLOR_HEX } from "./config";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { EndScene } from "./scenes/EndScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLOR_HEX.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
  scene: [BootScene, MenuScene, GameScene, EndScene],
};

const game = new Phaser.Game(config);

// Tylko w dev: dostęp do gry z konsoli/testów (wycinane z buildu produkcyjnego).
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
