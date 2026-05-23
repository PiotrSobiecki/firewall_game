/**
 * Czysta logika przebiegu rundy (testowalna bez Phasera).
 * Trzyma życia i wyznacza stan końcowy + powód:
 *  - win     — osiągnięto próg punktów (TARGET_SCORE),
 *  - death   — utracono ostatnie życie,
 *  - timeout — przekroczono twardy limit czasu (SESSION_MAX_MS).
 *
 * Czas i wynik są przekazywane z zewnątrz (GameScene); respawn NIE zmienia
 * czasu — kontroler nie ma żadnego wpływu na upływ czasu (PRD #18).
 */
import { LIVES, TARGET_SCORE, SESSION_MAX_MS } from "../config";

export type EndReason = "win" | "death" | "timeout";

export class RunController {
  private _lives: number;
  private _ended: EndReason | null = null;

  constructor(lives: number = LIVES) {
    this._lives = lives;
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
   * Sprawdza warunki końca zależne od wyniku i czasu. Wygrana ma priorytet
   * nad timeoutem (dobicie 100 pkt dokładnie na limicie = wygrana).
   * Po ustaleniu stanu kolejne wywołania zwracają ten sam powód.
   */
  update(score: number, elapsedMs: number): EndReason | null {
    if (this._ended) return this._ended;
    if (score >= TARGET_SCORE) this._ended = "win";
    else if (elapsedMs >= SESSION_MAX_MS) this._ended = "timeout";
    return this._ended;
  }
}
