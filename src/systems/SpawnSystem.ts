import Phaser from "phaser";
import wavesData from "../data/waves.json";
import { difficultyAt, type DifficultyLevel } from "./DifficultyCurve";
import type { EnemyType } from "../config";

interface Wave {
  durationMs: number;
  spawnIntervalMs: number;
  types: EnemyType[];
}

const WAVES = wavesData.waves as Wave[];

/**
 * Spawn sterowany danymi (waves.json). Cyklicznie przechodzi przez fale;
 * po ostatniej zostaje na niej (pętla trudności). Interwał spawnu skracany
 * przez DifficultyCurve (skala wg czasu całej sesji). Pooling realizuje
 * przekazany `spawn` (grupa z poola w GameScene).
 */
export class SpawnSystem {
  private waveIndex = 0;
  private waveStartMs = 0;
  private nextSpawnMs = 0;

  constructor(
    private spawn: (type: EnemyType, level: DifficultyLevel, now: number) => void,
    private onWaveComplete: (waveNumber: number) => void,
  ) {}

  start(now: number): void {
    this.waveIndex = 0;
    this.waveStartMs = now;
    this.nextSpawnMs = now + 400;
  }

  /** Numer bieżącej fali (1-indexed) do HUD. */
  get waveNumber(): number {
    return this.waveIndex + 1;
  }

  /** `now` = zegar sceny, `sessionElapsedMs` = czas od startu rundy (trudność). */
  update(now: number, sessionElapsedMs: number): void {
    const wave = WAVES[this.waveIndex];
    const level = difficultyAt(sessionElapsedMs);

    if (now - this.waveStartMs >= wave.durationMs) {
      this.onWaveComplete(this.waveNumber);
      this.waveIndex = Math.min(this.waveIndex + 1, WAVES.length - 1);
      this.waveStartMs = now;
    }

    if (now >= this.nextSpawnMs) {
      const type = Phaser.Utils.Array.GetRandom(wave.types) as EnemyType;
      this.spawn(type, level, now);
      this.nextSpawnMs = now + wave.spawnIntervalMs * level.spawnMult;
    }
  }
}
