import Phaser from "phaser";
import { TEXTURE } from "./SpriteTextures";

/** Win / lose bohaterka na ekranie wyników (`public/win.png`, `public/lose.png`). */
export function loadEndHeroAssets(scene: Phaser.Scene): void {
  scene.load.image(TEXTURE.endWin, "win.png");
  scene.load.image(TEXTURE.endLose, "lose.png");
}
