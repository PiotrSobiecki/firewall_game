import Phaser from "phaser";
import menuHeroUrl from "../assets/menu_hero.png?url";
import menuHeroWalk1Url from "../assets/1.png?url";
import menuHeroWalk2Url from "../assets/2.png?url";
import menuHeroWalk3Url from "../assets/3.png?url";
import menuHeroWalk4Url from "../assets/4.png?url";
import { TEXTURE } from "./SpriteTextures";

/** Ładuje postać na ekran startowy i klatki chodu. */
export function loadMenuHeroAsset(scene: Phaser.Scene): void {
  scene.load.image(TEXTURE.menuHero, menuHeroUrl);
  scene.load.image(TEXTURE.menuHeroWalk1, menuHeroWalk1Url);
  scene.load.image(TEXTURE.menuHeroWalk2, menuHeroWalk2Url);
  scene.load.image(TEXTURE.menuHeroWalk3, menuHeroWalk3Url);
  scene.load.image(TEXTURE.menuHeroWalk4, menuHeroWalk4Url);
  scene.load.image(TEXTURE.pilotFace, "pilot_face.png");
}
