import Phaser from "phaser";
import { COLOR_HEX, GAME_WIDTH, GAME_HEIGHT } from "../config";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { highScore, topEntries, type RunResult } from "../systems/ranking";
import { fetchTopScores } from "../systems/scoreApi";
import { MusicController } from "../systems/MusicController";

/** mm:ss z milisekund. */
function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const MARQUEE_SPEED = 70; // px/s

/** Ekran startowy: tytuł + HIGH SCORE + START + przewijany TOP 10 na dole. */
export class MenuScene extends Phaser.Scene {
  private bg!: RetroGridBackground;
  private music!: MusicController;
  private highText!: Phaser.GameObjects.Text;
  private marquee?: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.bg = new RetroGridBackground(this);
    this.music = new MusicController(this);
    this.marquee = undefined;

    this.highText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32 + 78, "HIGH SCORE: —", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLOR_HEX.green,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, "FIREWALL", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: COLOR_HEX.cyan,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32 + 50, "opanuj chaos w sieci", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: COLOR_HEX.magenta,
      })
      .setOrigin(0.5);

    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, "▶ START", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: COLOR_HEX.green,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.62 + 40,
        "ENTER / klik — ruch: ← → ↑ ↓ / WASD · SPACJA = tarcza · M = muzyka",
        { fontFamily: "monospace", fontSize: "11px", color: COLOR_HEX.yellow },
      )
      .setOrigin(0.5);

    // START to gest użytkownika → tu odpalamy utwór (potem leci przez grę).
    const begin = () => {
      this.music.start();
      this.scene.start("GameScene");
    };
    start.on("pointerdown", begin);
    this.input.keyboard?.once("keydown-ENTER", begin);
    this.input.keyboard?.on("keydown-M", () => this.music.toggle());

    void this.loadRanking();
  }

  /** Pobiera globalny ranking: aktualizuje HIGH SCORE i buduje przewijany pasek. */
  private async loadRanking(): Promise<void> {
    let list: RunResult[];
    try {
      list = await fetchTopScores();
    } catch {
      return; // brak sieci → HIGH SCORE zostaje „—", brak paska
    }
    this.highText.setText(`HIGH SCORE: ${highScore(list)}`);

    const top = topEntries(list);
    if (top.length === 0) return;
    const parts = top.map((e, i) => {
      const t = e.reason === "win" ? ` ${formatTime(e.timeMs)}` : "";
      return `${i + 1}. ${e.name} ${e.score}${t}`;
    });
    const text = `★ TOP 10:   ${parts.join("    ·    ")}`;
    this.marquee = this.add
      .text(GAME_WIDTH, GAME_HEIGHT - 14, text, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLOR_HEX.cyan,
      })
      .setOrigin(0, 0.5)
      .setDepth(20);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta / 1000);
    if (this.marquee) {
      this.marquee.x -= MARQUEE_SPEED * (delta / 1000);
      if (this.marquee.x < -this.marquee.width) this.marquee.x = GAME_WIDTH;
    }
  }
}
