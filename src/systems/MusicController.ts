import Phaser from "phaser";
import { AUDIO } from "../config";

/**
 * Sterowanie muzyką (PRD #27–28). Cienka warstwa nad globalnym Sound Managerem
 * Phasera — instancja utworu żyje w `game.registry`, więc gra przez wszystkie
 * sceny (Menu → Game → End) bez urywania.
 *
 * Utwór rusza na starcie rozgrywki (gest użytkownika — START/ENTER), leci w
 * pętli i nie urywa się przy zmianie scen. M włącza/wyłącza go w każdej chwili.
 * Menu jest ciche. Klucz cache audio = klucz w registry; ścieżka z `public/`.
 */
export const MUSIC_KEY = "firewallTrack";

export const musicPath = (): string => import.meta.env.BASE_URL + AUDIO.trackFile;

export class MusicController {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Czy plik mp3 załadował się do cache (false → nie ma czego grać, bez crasha). */
  get available(): boolean {
    return this.scene.cache.audio.exists(MUSIC_KEY);
  }

  private get music(): Phaser.Sound.BaseSound | undefined {
    return this.scene.game.registry.get(MUSIC_KEY) as Phaser.Sound.BaseSound | undefined;
  }

  /** Czy utwór aktualnie leci. */
  get isPlaying(): boolean {
    return Boolean(this.music?.isPlaying);
  }

  /**
   * Upewnia się, że utwór gra (wołane na starcie rozgrywki). Idempotentne:
   * jeśli już leci, nic nie robi. Brak pliku → ostrzeżenie, bez crasha.
   */
  start(): void {
    if (!this.available) {
      console.warn("[audio] Brak pliku firewall.mp3 — gra działa bez muzyki.");
      return;
    }
    if (this.music?.isPlaying) return;
    this.ensure().play();
  }

  /**
   * Ręczne wł./wył. muzyki (klawisz M). Zwraca nowy stan (true = gra).
   * Pierwsze wciśnięcie tworzy zapętlony utwór i go odpala; kolejne przełączają.
   * Brak pliku → tylko ostrzeżenie, bez crasha.
   */
  toggle(): boolean {
    if (!this.available) {
      console.warn("[audio] Brak pliku firewall.mp3 — nie ma czego odtworzyć.");
      return false;
    }
    if (this.music?.isPlaying) {
      this.music.stop();
      return false;
    }
    this.ensure().play();
    return true;
  }

  /** Zwraca instancję utworu, tworząc ją (zapętloną) i zapisując w registry raz. */
  private ensure(): Phaser.Sound.BaseSound {
    let music = this.music;
    if (!music) {
      music = this.scene.sound.add(MUSIC_KEY, { loop: true, volume: AUDIO.musicVolume });
      this.scene.game.registry.set(MUSIC_KEY, music);
    }
    return music;
  }
}
