import Phaser from "phaser";
import { registerGameTextures } from "../art/SpriteTextures";

/**
 * Preload: generuje proceduralne tekstury, potem menu.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    registerGameTextures(this);
    this.scene.start("MenuScene");
  }
}
