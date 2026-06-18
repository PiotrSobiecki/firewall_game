import Phaser from "phaser";
import { TEXTURE } from "./SpriteTextures";

/** Ładuje postać na ekran startowy i twarz pilotki w kokpicie. */
export function loadMenuHeroAsset(scene: Phaser.Scene): void {
  scene.load.image(TEXTURE.menuHero, "menu_hero.png");
  scene.load.image(TEXTURE.pilotFace, "pilot_face.png");
}
