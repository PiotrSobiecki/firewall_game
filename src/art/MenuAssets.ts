import Phaser from "phaser";
import { TEXTURE } from "./SpriteTextures";

/** Ładuje postać na ekran startowy (`public/menu_hero.png`). */
export function loadMenuHeroAsset(scene: Phaser.Scene): void {
  scene.load.image(TEXTURE.menuHero, "menu_hero.png");
}
