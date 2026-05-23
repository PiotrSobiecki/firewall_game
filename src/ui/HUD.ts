import Phaser from "phaser";
import {
  COLOR_HEX,
  COLORS,
  BOSS,
  WIN_SCORE_AFTER_MINI_BOSS,
  GAME_WIDTH,
  GAME_HEIGHT,
  POWERUP,
  type PowerUpType,
} from "../config";
import type { PowerUpSystem } from "../systems/PowerUpSystem";

const BUFF_LABEL: Record<PowerUpType, string> = {
  packetStream: "STRZAŁ",
  immunity: "NIETYKALNOŚĆ",
  shieldBoost: "TARCZA+",
  firewallRepair: "+HP",
};
const TIMED_BUFFS: PowerUpType[] = ["packetStream", "immunity", "shieldBoost"];

/**
 * HUD rozgrywki. Trzy odrębne wskaźniki, celowo różne wizualnie, by ich
 * nie mylić (PRD #37):
 *  - WYNIK x/100 + cienki cyan pasek progresu do celu,
 *  - HP (gruby pasek, zielony→żółty→czerwony),
 *  - TARCZA = energia (cyan, żółty gdy wyczerpana).
 */
export class HUD {
  private label: Phaser.GameObjects.Text;
  private progressFill: Phaser.GameObjects.Rectangle;
  private hpFill: Phaser.GameObjects.Rectangle;
  private energyFill: Phaser.GameObjects.Rectangle;
  private timeText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;
  private buffText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;

  private readonly progressWidth = GAME_WIDTH - 32;
  private readonly barX = 56;
  private readonly barWidth = GAME_WIDTH - 56 - 16;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // --- Panel tła HUD (zasłania wrogów wlatujących z góry) ---
    scene.add
      .rectangle(0, 0, GAME_WIDTH, 110, COLORS.bg, 0.82)
      .setOrigin(0, 0)
      .setDepth(14);
    scene.add
      .rectangle(0, 110, GAME_WIDTH, 2, COLORS.cyan, 0.25)
      .setOrigin(0, 0)
      .setDepth(14);

    // --- Czas + życia (prawy górny róg) ---
    this.timeText = scene.add
      .text(GAME_WIDTH - 16, 12, "0:00", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_HEX.cyan,
      })
      .setOrigin(1, 0)
      .setDepth(15);
    this.livesText = scene.add
      .text(GAME_WIDTH - 16, 90, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: COLOR_HEX.green,
      })
      .setOrigin(1, 0)
      .setDepth(15);
    this.waveText = scene.add
      .text(16, 88, "FALA 1", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLOR_HEX.magenta,
      })
      .setOrigin(0, 0)
      .setDepth(15);
    // combo (środek-góra, pojawia się przy ×2+)
    this.comboText = scene.add
      .text(GAME_WIDTH / 2, 96, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_HEX.yellow,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(16);
    // aktywne buffy z odliczaniem (pod panelem HUD, lewy bok)
    this.buffText = scene.add
      .text(16, 118, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: COLOR_HEX.yellow,
        lineSpacing: 2,
      })
      .setOrigin(0, 0)
      .setDepth(15);

    // --- WYNIK + progres do celu (boss, potem +100 do wygranej) ---
    this.label = scene.add
      .text(16, 12, "WYNIK 0", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_HEX.cyan,
      })
      .setDepth(15);

    scene.add.rectangle(16, 38, this.progressWidth, 5, 0x10202c).setOrigin(0, 0).setDepth(15);
    this.progressFill = scene.add
      .rectangle(16, 38, 0, 5, COLORS.cyan)
      .setOrigin(0, 0)
      .setDepth(16);

    // --- HP ---
    this.hpFill = this.makeBar(scene, "HP", 54, COLORS.green, 11);
    // --- TARCZA (energia) ---
    this.energyFill = this.makeBar(scene, "TAR", 72, COLORS.cyan, 9);
  }

  private makeBar(
    scene: Phaser.Scene,
    name: string,
    y: number,
    color: number,
    height: number,
  ): Phaser.GameObjects.Rectangle {
    scene.add
      .text(16, y - 1, name, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: COLOR_HEX.cyan,
      })
      .setDepth(15);
    scene.add.rectangle(this.barX, y, this.barWidth, height, 0x10202c).setOrigin(0, 0).setDepth(15);
    return scene.add.rectangle(this.barX, y, this.barWidth, height, color).setOrigin(0, 0).setDepth(16);
  }

  setScore(score: number): void {
    this.label.setText(`WYNIK ${score}`);
  }

  /**
   * Pasek + opis celu rundy. Dopóki boss nie pokonany: progres do spawnu bossa.
   * Po pokonaniu: odliczanie 100 pkt zdobytych po bossie (bez bonusu za bossa).
   */
  setObjective(score: number, bossDefeated: boolean, pointsAfterBoss: number): void {
    if (!bossDefeated) {
      const ratio = Phaser.Math.Clamp(score / BOSS.spawnAtScore, 0, 1);
      this.progressFill.width = this.progressWidth * ratio;
      this.progressFill.fillColor = COLORS.cyan;
      this.label.setText(`WYNIK ${score}`);
    } else {
      const ratio = Phaser.Math.Clamp(pointsAfterBoss / WIN_SCORE_AFTER_MINI_BOSS, 0, 1);
      this.progressFill.width = this.progressWidth * ratio;
      this.progressFill.fillColor = COLORS.green;
      this.label.setText(
        `WYNIK ${score} · PO BOSSIE: ${Math.min(pointsAfterBoss, WIN_SCORE_AFTER_MINI_BOSS)}/${WIN_SCORE_AFTER_MINI_BOSS}`,
      );
    }
  }

  setHp(ratio: number): void {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    this.hpFill.width = this.barWidth * r;
    this.hpFill.fillColor = r > 0.4 ? COLORS.green : r > 0.2 ? COLORS.yellow : COLORS.magenta;
  }

  setEnergy(ratio: number, exhausted: boolean): void {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    this.energyFill.width = this.barWidth * r;
    this.energyFill.fillColor = exhausted ? COLORS.yellow : COLORS.cyan;
  }

  setLives(lives: number): void {
    this.livesText.setText(lives > 0 ? "♦".repeat(lives) : "—");
  }

  setTime(elapsedMs: number, maxMs: number): void {
    const totalSec = Math.floor(elapsedMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = (totalSec % 60).toString().padStart(2, "0");
    this.timeText.setText(`${mm}:${ss}`);
    // ostrzegawczo, gdy zbliżej twardego limitu czasu
    const ratio = maxMs > 0 ? elapsedMs / maxMs : 0;
    this.timeText.setColor(ratio > 0.85 ? COLOR_HEX.magenta : ratio > 0.6 ? COLOR_HEX.yellow : COLOR_HEX.cyan);
  }

  setWave(wave: number): void {
    this.waveText.setText(`FALA ${wave}`);
  }

  /** Mnożnik combo widoczny przy serii ≥2; w przeciwnym razie ukryty. */
  setCombo(combo: number, multiplier: number): void {
    if (combo >= 2 && multiplier >= 2) {
      this.comboText.setText(`COMBO ×${multiplier}`).setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }
  }

  /** Lista aktywnych buffów czasowych z odliczaniem sekund. */
  setBuffs(powerups: PowerUpSystem, now: number): void {
    const lines: string[] = [];
    for (const type of TIMED_BUFFS) {
      if (powerups.isActive(type, now)) {
        const s = Math.ceil(powerups.remaining(type, now) / 1000);
        lines.push(`▸ ${BUFF_LABEL[type]} ${s}s`);
      }
    }
    this.buffText.setText(lines.join("\n"));
  }

  /** Krótki komunikat o zebraniu power-upu (w kolorze typu). */
  flashPowerUp(type: PowerUpType): void {
    const hex = Phaser.Display.Color.IntegerToColor(POWERUP.colors[type]).rgba;
    const t = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, BUFF_LABEL[type], {
        fontFamily: "monospace",
        fontSize: "24px",
        color: hex,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(17);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: GAME_HEIGHT * 0.5,
      duration: 1000,
      onComplete: () => t.destroy(),
    });
  }

  /** Potwierdzenie zniszczenia mini-bossa — od teraz liczy się PO BOSSIE X/100. */
  flashBossDefeated(): void {
    const t = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, "MINI-BOSS USUNIĘTY!\n+100 pkt do wygranej", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_HEX.green,
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(17);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: GAME_HEIGHT * 0.24,
      duration: 1600,
      onComplete: () => t.destroy(),
    });
  }

  /** Alarm wejścia mini-bossa. */
  flashBoss(): void {
    const t = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, "⚠ MINI-BOSS ⚠", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: COLOR_HEX.magenta,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(17);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      scale: 1.3,
      duration: 1400,
      onComplete: () => t.destroy(),
    });
  }

  /** Krótki komunikat o przejściu fali (z bonusem). */
  flashWave(waveNumber: number): void {
    const t = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, `FALA ${waveNumber} ✓  +25`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_HEX.green,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(17);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: GAME_HEIGHT * 0.34,
      duration: 1100,
      onComplete: () => t.destroy(),
    });
  }
}
