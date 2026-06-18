import Phaser from "phaser";
import { AUDIO } from "../config";

/**
 * Proceduralne efekty dźwiękowe (Web Audio) — bez assetów. Krótkie, retro-
 * syntetyczne blipy pasujące do neonowej estetyki. Współdzielą AudioContext
 * Phasera (odblokowany gestem START), więc grają od razu w rozgrywce.
 *
 * Przy braku Web Audio (HTML5/NoAudio fallback) metody są no-opami — gra gra
 * dalej, tylko bez SFX. Niezależne od muzyki (klawisz M wycisza tylko utwór).
 */
export class Sfx {
  private ctx?: AudioContext;
  private master?: GainNode;

  constructor(scene: Phaser.Scene) {
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context;
    if (!ctx) return; // tylko Web Audio ma .context
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = AUDIO.sfxVolume;
    this.master.connect(ctx.destination);
  }

  /** Pojedynczy ton z obwiednią; opcjonalny zjazd/wzlot częstotliwości. */
  private tone(
    type: OscillatorType,
    freq: number,
    freqEnd: number,
    dur: number,
    vol: number,
  ): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    // obwiednia: szybki atak, wykładnicze wygaszenie (exp nie może dojść do 0)
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Krótki szum (eksplozja/zniszczenie) z pasmem i wygaszeniem. */
  private noise(dur: number, vol: number, bandHz: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = bandHz;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(band).connect(gain).connect(master);
    src.start(t0);
  }

  /** Włączenie tarczy — energetyczny wzlot „power-up". */
  shieldOn(): void {
    this.tone("square", 240, 720, 0.16, 0.3);
    this.tone("sine", 480, 960, 0.16, 0.16);
  }

  /** Eliminacja wroga — krótki opadający blip (lekko zmienna wysokość). */
  enemyDeath(): void {
    const base = 540 + Math.random() * 160;
    this.tone("square", base, base * 0.25, 0.09, 0.2);
    this.noise(0.06, 0.1, 1600);
  }

  /** Pokonanie mini-bossa — niski zjazd + szumowy wybuch. */
  bossDefeated(): void {
    this.tone("sawtooth", 220, 48, 0.5, 0.35);
    this.noise(0.5, 0.3, 700);
  }

  /** Bonus / easter egg (np. trafienie DeLoreana). */
  bonusCatch(): void {
    this.tone("square", 440, 880, 0.12, 0.22);
    this.tone("sine", 660, 1320, 0.14, 0.18);
  }
}
