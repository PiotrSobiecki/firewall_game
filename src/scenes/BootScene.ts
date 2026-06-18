import Phaser from "phaser";
import { registerGameTextures } from "../art/SpriteTextures";
import { loadDeloreanAsset } from "../art/DeloreanTexture";
import { loadMenuHeroAsset } from "../art/MenuAssets";
import { MUSIC_KEY, musicPath } from "../systems/MusicController";

/**
 * Preload: ładuje utwór i generuje proceduralne tekstury, potem menu.
 * Brak pliku mp3 nie blokuje gry — łapiemy błąd ładowania i jedziemy dalej.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.audio(MUSIC_KEY, musicPath());
    loadDeloreanAsset(this);
    loadMenuHeroAsset(this);
    // 404 na mp3 nie może wywalić preloadu — utwór po prostu nie trafi do cache
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.key === MUSIC_KEY) {
        console.warn("[audio] Nie udało się wczytać firewall.mp3 — gra będzie wyciszona.");
      }
    });
  }

  create(): void {
    registerGameTextures(this);
    this.scene.start("MenuScene");
  }
}
