/**
 * Czysta logika przebiegu rundy (testowalna bez Phasera).
 * Trzyma życia i wyznacza stan końcowy + powód:
 *  - win     — pokonano bossa, a POTEM zdobyto WIN_SCORE_AFTER_BOSS pkt ponad
 *              wynik z chwili jego pokonania (bez bossa wygrać się nie da),
 *  - death   — utracono ostatnie życie,
 *  - timeout — przekroczono twardy limit czasu (SESSION_MAX_MS).
 *
 * Czas i wynik są przekazywane z zewnątrz (GameScene); respawn NIE zmienia
 * czasu — kontroler nie ma żadnego wpływu na upływ czasu (PRD #18).
 */
import { LIVES, WIN_SCORE_AFTER_BOSS, SESSION_MAX_MS } from "../config";

export type EndReason = "win" | "death" | "timeout";

export class RunController {
  private _lives: number;
  private _ended: EndReason | null = null;
  private _winTarget: number | null = null; // ustawiany przy pokonaniu bossa

  constructor(lives: number = LIVES) {
    this._lives = lives;
  }

  /**
   * Zgłasza pokonanie mini-bossa: od tej chwili wygrana wymaga jeszcze
   * WIN_SCORE_AFTER_BOSS pkt ponad podany wynik. Pierwsze zgłoszenie wiążące —
   * kolejne są ignorowane (cel zostaje zamrożony).
   */
  onBossDefeated(scoreAtDefeat: number): void {
    if (this._winTarget === null) this._winTarget = scoreAtDefeat + WIN_SCORE_AFTER_BOSS;
  }

  get lives(): number {
    return this._lives;
  }

  /** Cel punktowy wygranej (ustawiony po pokonaniu bossa) lub null. Dla HUD. */
  get winTarget(): number | null {
    return this._winTarget;
  }

  get isOver(): boolean {
    return this._ended !== null;
  }

  get endReason(): EndReason | null {
    return this._ended;
  }

  /**
   * Rejestruje utratę życia. Zwraca true, gdy gracz przeżywa (respawn),
   * false, gdy to była ostatnia śmierć (stan końcowy „death").
   */
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
   * Sprawdza warunki końca zależne od wyniku i czasu. Wygrana (boss pokonany +
   * osiągnięty cel punktowy) ma priorytet nad timeoutem. Dopóki boss nie jest
   * pokonany, wygrana jest niemożliwa. Po ustaleniu stanu kolejne wywołania
   * zwracają ten sam powód.
   */
  update(score: number, elapsedMs: number): EndReason | null {
    if (this._ended) return this._ended;
    if (this._winTarget !== null && score >= this._winTarget) this._ended = "win";
    else if (elapsedMs >= SESSION_MAX_MS) this._ended = "timeout";
    return this._ended;
  }
}
