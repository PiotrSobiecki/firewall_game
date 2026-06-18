import Phaser from "phaser";
import { TEXTURE } from "./SpriteTextures";

/** Ładuje pixel-art DeLoreana (PNG z przezroczystym tłem) z `public/delorean.png`. */
export function loadDeloreanAsset(scene: Phaser.Scene): void {
  scene.load.image(TEXTURE.delorean, "delorean.png");
}
