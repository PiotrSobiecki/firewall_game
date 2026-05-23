import Phaser from "phaser";
import { COLOR_HEX, GAME_WIDTH, GAME_HEIGHT, YOUTUBE_URL } from "../config";
import { RetroGridBackground } from "../ui/RetroGridBackground";

/** Powód zakończenia rundy. (death/timeout rozbudowane w issue #3.) */
export interface EndData {
  reason: "win" | "death" | "timeout";
  score: number;
  timeMs: number;
}

const TITLES: Record<EndData["reason"], { text: string; color: string }> = {
  win: { text: "FIREWALL AKTYWNY!", color: COLOR_HEX.green },
  death: { text: "BAZA ZHAKOWANA", color: COLOR_HEX.magenta },
  timeout: { text: "CZAS MINĄŁ", color: COLOR_HEX.yellow },
};

/** Ekran końcowy: wynik + powód + retry + link do utworu na YouTube. */
export class EndScene extends Phaser.Scene {
  private bg!: RetroGridBackground;

  constructor() {
    super("EndScene");
  }

  create(data: EndData): void {
    this.bg = new RetroGridBackground(this);
    const title = TITLES[data.reason];
    const seconds = (data.timeMs / 1000).toFixed(1);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.26, title.text, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: title.color,
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.42,
        `WYNIK: ${data.score}\nCZAS: ${seconds}s`,
        {
          fontFamily: "monospace",
          fontSize: "20px",
          color: COLOR_HEX.cyan,
          align: "center",
        },
      )
      .setOrigin(0.5);

    const yt = this.makeButton(GAME_HEIGHT * 0.6, "▶ OBEJRZYJ NA YOUTUBE", COLOR_HEX.yellow);
    yt.on("pointerdown", () => window.open(YOUTUBE_URL, "_blank", "noopener"));

    const retry = this.makeButton(GAME_HEIGHT * 0.6 + 56, "↻ ZAGRAJ JESZCZE RAZ", COLOR_HEX.green);
    const replay = () => this.scene.start("GameScene");
    retry.on("pointerdown", replay);
    this.input.keyboard?.once("keydown-ENTER", replay);
  }

  private makeButton(y: number, label: string, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: "monospace",
        fontSize: "20px",
        color,
        backgroundColor: "#10202c",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta / 1000);
  }
}
