/**
 * Czysta logika przebiegu rundy (testowalna bez Phasera).
 * Trzyma życia i wyznacza stan końcowy + powód:
 *  - win     — pokonano bossa, potem zdobyto WIN_SCORE_AFTER_MINI_BOSS pkt z gry
 *              (zabójstwa, bonus fali; bonus za bossa się nie liczy),
 *  - death   — utracono ostatnie życie,
 *  - timeout — przekroczono twardy limit czasu (SESSION_MAX_MS).
 */
import { LIVES, WIN_SCORE_AFTER_MINI_BOSS, SESSION_MAX_MS } from "../config";

export type EndReason = "win" | "death" | "timeout";

export class RunController {
  private _lives: number;
  private _ended: EndReason | null = null;
  private _bossDefeated = false;
  private _pointsAfterBoss = 0;

  constructor(lives: number = LIVES) {
    this._lives = lives;
  }

  /** Zgłasza pokonanie mini-bossa — od tej chwili liczą się pkt po bossie. */
  onBossDefeated(): void {
    if (!this._bossDefeated) {
      this._bossDefeated = true;
      this._pointsAfterBoss = 0;
    }
  }

  get bossDefeated(): boolean {
    return this._bossDefeated;
  }

  /** Punkty zdobyte po bossie (bez bonusu za samego bossa). */
  get pointsAfterBoss(): number {
    return this._pointsAfterBoss;
  }

  /** Ile punktów brakuje do wygranej po bossie (0 = można wygrać). */
  get pointsToWin(): number {
    return Math.max(0, WIN_SCORE_AFTER_MINI_BOSS - this._pointsAfterBoss);
  }

  /**
   * Nalicza pkt po bossie (zabójstwa, fale; bez bonusu za bossa).
   * Zwraca true, gdy właśnie osiągnięto próg wygranej.
   */
  addPointsAfterBoss(points: number): boolean {
    if (!this._bossDefeated || this._ended || points <= 0) return false;
    this._pointsAfterBoss += points;
    if (this._pointsAfterBoss >= WIN_SCORE_AFTER_MINI_BOSS) {
      this._ended = "win";
      return true;
    }
    return false;
  }

  get lives(): number {
    return this._lives;
  }

  get isOver(): boolean {
    return this._ended !== null;
  }

  get endReason(): EndReason | null {
    return this._ended;
  }

  loseLife(): boolean {
    if (this._ended) return false;
    this._lives = Math.max(0, this._lives - 1);
    if (this._lives <= 0) {
      this._ended = "death";
      return false;
    }
    return true;
  }

  /**
   * Sprawdza warunki końca. `score` i `elapsedMs` zostawione dla przyszłego
   * tuningu; wygrana zależy od `pointsAfterBoss`.
   */
  update(_score: number, elapsedMs: number): EndReason | null {
    if (this._ended) return this._ended;
    if (this._bossDefeated && this._pointsAfterBoss >= WIN_SCORE_AFTER_MINI_BOSS) {
      this._ended = "win";
    } else if (elapsedMs >= SESSION_MAX_MS) {
      this._ended = "timeout";
    }
    return this._ended;
  }
}
