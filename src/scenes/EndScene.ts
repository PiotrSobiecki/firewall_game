import Phaser from "phaser";
import {
  COLOR_HEX,
  COLORS,
  GAME_WIDTH,
  GAME_HEIGHT,
  MUSIC_URL,
  LEADERBOARD_SIZE,
  BTTF,
} from "../config";
import { TEXTURE } from "../art/SpriteTextures";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import {
  findPlayerIndex,
  qualifies,
  topEntries,
  type RunResult,
} from "../systems/ranking";
import { fetchTopScores, submitScore } from "../systems/scoreApi";
import { MusicController } from "../systems/MusicController";
import { DeloreanMenuDrive } from "../systems/DeloreanDrive";

/** Powód zakończenia rundy + wynik i czas (z GameScene). */
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

const RANKING_TOP_Y = 150;
/** Przyciski nad zachodzącym słońcem (horyzont w BTTF.sunYRatio). */
const END_BTN_PRESAVE_Y = GAME_HEIGHT * BTTF.sunYRatio - 142;
const END_BTN_RETRY_Y = GAME_HEIGHT * BTTF.sunYRatio - 86;

/** mm:ss z milisekund. */
function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Ekran końcowy: wynik + ranking + retry + link do utworu. */
export class EndScene extends Phaser.Scene {
  private bg!: RetroGridBackground;
  private deloreanDrive!: DeloreanMenuDrive;

  constructor() {
    super("EndScene");
  }

  create(data: EndData): void {
    this.bg = new RetroGridBackground(this);
    this.deloreanDrive = new DeloreanMenuDrive(this);

    // Jeśli muzyka gra, leci dalej (nie urywamy jej przy końcu); M ją wł./wył.
    const music = new MusicController(this);
    this.input.keyboard?.on("keydown-M", () => music.toggle());

    const title = TITLES[data.reason];
    this.add
      .text(GAME_WIDTH / 2, 60, title.text, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: title.color,
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        104,
        `WYNIK ${data.score} · CZAS ${formatTime(data.timeMs)}`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: COLOR_HEX.cyan,
        },
      )
      .setOrigin(0.5);

    // przyciski (klik zawsze; Enter dopiero gdy nie ma już pola na imię)
    const musicBtn = this.makeButton(
      END_BTN_PRESAVE_Y,
      "▶ ZAPISZ SIĘ NA PRE-SAVE FIREWALL",
      COLOR_HEX.yellow,
    );
    musicBtn.on("pointerdown", () =>
      window.open(MUSIC_URL, "_blank", "noopener"),
    );

    const retry = this.makeButton(
      END_BTN_RETRY_Y,
      "↻ ZAGRAJ JESZCZE RAZ",
      COLOR_HEX.green,
    );
    retry.on("pointerdown", () => this.scene.start("GameScene"));

    this.showResultHero(data.reason);

    void this.loadRanking({ name: "", ...data });
  }

  /** Bohaterka win/lose — ta sama pozycja co na menu + chmurka z napisem. */
  private showResultHero(reason: EndData["reason"]): void {
    const { scale, xRatio, yRatio, depth } = BTTF.menuHero;
    const x = GAME_WIDTH * xRatio;
    const y = GAME_HEIGHT * yRatio;
    const won = reason === "win";

    const hero = this.add
      .image(x, y, won ? TEXTURE.endWin : TEXTURE.endLose)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(depth);

    const caption = won ? "Firewall działa!" : "Następnym razem!";
    const accent = won ? COLOR_HEX.green : COLOR_HEX.magenta;

    const heroTop = y - hero.displayHeight;
    const bubbleX = x + hero.displayWidth * 0.52;
    const bubbleY = heroTop + 2;

    this.addSpeechBubble(bubbleX, bubbleY, caption, accent, depth + 1);
  }

  private addSpeechBubble(
    x: number,
    y: number,
    text: string,
    accent: string,
    depth: number,
  ): Phaser.GameObjects.Container {
    const padX = 12;
    const padY = 8;
    const label = this.add
      .text(0, 0, text, {
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const w = Math.ceil(label.width + padX * 2);
    const h = Math.ceil(label.height + padY * 2);
    const r = 6;
    const left = -w / 2;
    const top = -h / 2;

    const bubbleBottom = top + h;
    const tailLeft = left + 14;
    const tailRight = left + 28;
    const tailTipX = tailLeft - 10;
    const tailTipY = bubbleBottom + 9;

    const gfx = this.add.graphics();
    const fill = 0x122033;

    gfx.fillStyle(fill, 0.96);
    gfx.fillRoundedRect(left, top, w, h, r);
    gfx.fillTriangle(tailLeft, bubbleBottom, tailRight, bubbleBottom, tailTipX, tailTipY);

    gfx.lineStyle(2, COLORS.cyan, 1);
    gfx.strokeRoundedRect(left, top, w, h, r);
    gfx.beginPath();
    gfx.moveTo(tailLeft, bubbleBottom);
    gfx.lineTo(tailTipX, tailTipY);
    gfx.lineTo(tailRight, bubbleBottom);
    gfx.strokePath();

    gfx.lineStyle(3, fill, 0.96);
    gfx.beginPath();
    gfx.moveTo(tailLeft + 1, bubbleBottom);
    gfx.lineTo(tailRight - 1, bubbleBottom);
    gfx.strokePath();

    gfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(accent).color, 0.55);
    gfx.strokeRoundedRect(left + 2, top + 2, w - 4, h - 4, r - 1);

    label.setColor(accent);

    const bubble = this.add.container(x, y, [gfx, label]).setDepth(depth);
    return bubble;
  }

  /** Pobiera ranking, ew. pyta o imię i zapisuje wynik. Offline → komunikat. */
  private async loadRanking(result: RunResult): Promise<void> {
    let top: RunResult[];
    try {
      top = await fetchTopScores();
    } catch {
      this.renderUnavailable();
      this.bindRetryEnter();
      return;
    }

    if (qualifies(top, result)) {
      this.promptName(async (name) => {
        const mine: RunResult = {
          ...result,
          name,
          score: Math.round(result.score),
          timeMs: Math.round(result.timeMs),
        };
        try {
          await submitScore(mine);
          top = await fetchTopScores();
        } catch {
          /* zapis się nie udał — pokażemy ostatnio pobrany ranking */
        }
        this.renderRanking(top, mine);
        this.bindRetryEnter();
      });
    } else {
      this.renderRanking(top, null);
      this.bindRetryEnter();
    }
  }

  private renderUnavailable(): void {
    this.add
      .text(
        GAME_WIDTH / 2,
        RANKING_TOP_Y + 20,
        "RANKING NIEDOSTĘPNY\n(brak połączenia)",
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: COLOR_HEX.magenta,
          align: "center",
        },
      )
      .setOrigin(0.5);
  }

  /** Rysuje listę TOP N, podświetlając wpis gracza (jeśli jest). */
  private renderRanking(list: RunResult[], mine: RunResult | null): void {
    const top = topEntries(list, LEADERBOARD_SIZE);
    this.add
      .text(
        GAME_WIDTH / 2,
        RANKING_TOP_Y,
        `— RANKING TOP ${LEADERBOARD_SIZE} —`,
        {
          fontFamily: "monospace",
          fontSize: "13px",
          color: COLOR_HEX.magenta,
        },
      )
      .setOrigin(0.5);

    if (top.length === 0) {
      this.add
        .text(GAME_WIDTH / 2, RANKING_TOP_Y + 30, "(brak wyników)", {
          fontFamily: "monospace",
          fontSize: "13px",
          color: COLOR_HEX.cyan,
        })
        .setOrigin(0.5);
      return;
    }

    const mineIndex = mine === null ? -1 : findPlayerIndex(top, mine);
    top.forEach((e, i) => {
      const y = RANKING_TOP_Y + 26 + i * 25;
      const isMine = i === mineIndex;
      const rank = (i + 1).toString().padStart(2, " ");
      const name = e.name.slice(0, 11).padEnd(11, " ");
      const timeCol = (
        e.reason === "win" ? formatTime(e.timeMs) : "—"
      ).padStart(8, " ");
      const score = e.score.toString().padStart(4, " ");
      const color = isMine
        ? COLOR_HEX.yellow
        : e.reason === "win"
          ? COLOR_HEX.green
          : COLOR_HEX.cyan;
      this.add
        .text(
          GAME_WIDTH / 2,
          y,
          `${isMine ? "►" : " "}${rank} ${name}${timeCol}  ${score}`,
          {
            fontFamily: "monospace",
            fontSize: "14px",
            color,
            fontStyle: isMine ? "bold" : "normal",
          },
        )
        .setOrigin(0.5);
    });
  }

  /** Modalne pole na imię (HTML overlay — działa na desktop i mobile). */
  private promptName(onName: (name: string) => void): void {
    // Phaser domyślnie robi preventDefault na WASD/strzałkach/spacji (capture),
    // przez co nie wpisałyby się do pola HTML. Wyłączamy na czas wpisywania.
    this.input.keyboard?.disableGlobalCapture();

    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(10,14,23,0.85);z-index:1000;font-family:monospace;";
    const box = document.createElement("div");
    box.style.cssText =
      "background:#0d1622;border:2px solid #00f0ff;border-radius:10px;padding:22px 26px;" +
      "text-align:center;box-shadow:0 0 26px rgba(0,240,255,0.45);";
    const label = document.createElement("div");
    label.textContent = `TOP ${LEADERBOARD_SIZE}! WPISZ IMIĘ:`;
    label.style.cssText =
      "color:#00f0ff;font-size:15px;margin-bottom:12px;letter-spacing:1px;";
    const input = document.createElement("input");
    input.maxLength = 12;
    input.placeholder = "GRACZ";
    input.autocapitalize = "characters";
    input.style.cssText =
      "font-family:monospace;font-size:20px;text-align:center;text-transform:uppercase;" +
      "padding:8px 10px;width:180px;background:#08111c;color:#00ff88;border:1px solid #00f0ff;" +
      "border-radius:6px;outline:none;";
    const btn = document.createElement("button");
    btn.textContent = "OK";
    btn.style.cssText =
      "display:block;margin:14px auto 0;font-family:monospace;font-size:18px;color:#0a0e17;" +
      "background:#00ff88;border:none;border-radius:6px;padding:8px 28px;cursor:pointer;";
    box.append(label, input, btn);
    wrap.append(box);
    document.body.append(wrap);
    window.setTimeout(() => input.focus(), 50);

    const submit = () => {
      const name = (input.value.trim() || "GRACZ").toUpperCase().slice(0, 12);
      this.input.keyboard?.enableGlobalCapture(); // przywróć przechwytywanie do gry
      wrap.remove();
      onName(name);
    };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.enableGlobalCapture();
      wrap.remove();
    });
  }

  private bindRetryEnter(): void {
    this.input.keyboard?.once("keydown-ENTER", () =>
      this.scene.start("GameScene"),
    );
  }

  private makeButton(
    y: number,
    label: string,
    color: string,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: "monospace",
        fontSize: "20px",
        color,
        backgroundColor: "#10202c",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.bg.update(dt);
    this.deloreanDrive.update(dt);
  }
}
