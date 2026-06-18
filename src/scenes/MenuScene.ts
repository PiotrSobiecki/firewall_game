import Phaser from "phaser";
import { COLOR_HEX, GAME_WIDTH, GAME_HEIGHT } from "../config";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { topName, topEntries, type RunResult } from "../systems/ranking";
import { fetchTopScores } from "../systems/scoreApi";
import { MusicController } from "../systems/MusicController";
import { DeloreanMenuDrive } from "../systems/DeloreanDrive";
import { MenuHeroAnimator } from "../ui/MenuHeroAnimator";

/** mm:ss z milisekund. */
function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

const MARQUEE_SPEED = 70; // px/s
const MENU_START_Y = GAME_HEIGHT * 0.55;
const MENU_HELP_Y = MENU_START_Y + 38;

const CONTROLS_DESKTOP =
  "ENTER / klik — START · ← → / A D — chodzenie · SPACJA = tarcza · M = muzyka";
const CONTROLS_MOBILE =
  "Klik START · lewy dół: joystick (ruch)\nprawy dół: przytrzymaj TARCZA";

/** Ekran startowy: tytuł + HIGH SCORE + START + przewijany TOP 10 na dole. */
export class MenuScene extends Phaser.Scene {
  private bg!: RetroGridBackground;
  private music!: MusicController;
  private highText!: Phaser.GameObjects.Text;
  private marquee?: Phaser.GameObjects.Text;
  private deloreanDrive!: DeloreanMenuDrive;
  private menuHero!: MenuHeroAnimator;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.bg = new RetroGridBackground(this);
    this.music = new MusicController(this);
    this.deloreanDrive = new DeloreanMenuDrive(this);
    this.marquee = undefined;

    this.menuHero = new MenuHeroAnimator(this);

    this.highText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32 + 78, "TOP DEFENDER: —", {
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
      .text(GAME_WIDTH / 2, MENU_START_Y, "▶ START", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: COLOR_HEX.green,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: start,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const isTouch = this.sys.game.device.input.touch;
    this.add
      .text(
        GAME_WIDTH / 2,
        MENU_HELP_Y,
        isTouch ? CONTROLS_MOBILE : CONTROLS_DESKTOP,
        {
          fontFamily: "monospace",
          fontSize: isTouch ? "12px" : "11px",
          color: COLOR_HEX.yellow,
          align: "center",
        },
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
    this.highText.setText(`TOP DEFENDER: ${topName(list) || "—"}`);

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
    const dt = delta / 1000;
    this.bg.update(dt);
    this.deloreanDrive.update(dt);
    this.menuHero.update(dt);
    if (this.marquee) {
      this.marquee.x -= MARQUEE_SPEED * (delta / 1000);
      if (this.marquee.x < -this.marquee.width) this.marquee.x = GAME_WIDTH;
    }
  }
}
