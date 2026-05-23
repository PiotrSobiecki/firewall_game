// Stałe gry — pojedyncze źródło prawdy, do tuningu w playteście.
// Wartości zgodne z PRD.md (#1).

/** Próg wygranej — osiągnięcie kończy rundę jako wygrana. */
export const TARGET_SCORE = 1000;

/** Twardy limit sesji: 2 pętle utworu „Firewall" (3:15) = 6:30. */
export const SESSION_MAX_MS = 6 * 60 * 1000 + 30 * 1000;

/** Liczba żyć w rundzie (PRD #17). Każde życie = pełne HP. */
export const LIVES = 3;

/** Kara punktowa za śmierć (PRD #18): odejmowana, nie schodzi poniżej 0. */
export const RESPAWN_PENALTY = 15;

/** Punkty za eliminację wroga wg typu (tabela z PRD). */
export const ENEMY_POINTS = {
  virus: 10,
  trojan: 20,
  worm: 15,
  spyware: 15,
} as const;

export type EnemyType = keyof typeof ENEMY_POINTS;

/** Combo (PRD #14): kolejne zabójstwa w oknie podnoszą mnożnik do maksimum. */
export const COMBO = {
  windowMs: 2000,
  maxMultiplier: 3,
} as const;

/** Bonus punktowy za przejście fali (PRD: +25). */
export const WAVE_BONUS = 25;

/** Link do utworu na YouTube — podmienić przed publikacją. */
export const YOUTUBE_URL = "https://www.youtube.com/watch?v=XXXXXXXX";

/** Rozdzielczość logiczna (portrait jak mobile shmup). */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

/** Paleta retro-neon jako liczby (Graphics) i stringi (tekst). */
export const COLORS = {
  bg: 0x0a0e17,
  cyan: 0x00f0ff,
  magenta: 0xff00aa,
  yellow: 0xffcc00,
  green: 0x00ff88,
} as const;

export const COLOR_HEX = {
  bg: "#0a0e17",
  cyan: "#00f0ff",
  magenta: "#ff00aa",
  yellow: "#ffcc00",
  green: "#00ff88",
} as const;

/** Tuning gracza (do playtestu). */
export const PLAYER = {
  speed: 300,
  zoneTop: GAME_HEIGHT * 0.35, // ruch w dolnych ~65% ekranu
  bodyRadius: 16,
  maxHp: 100, // HP jednego życia (PRD #17)
  iframesMs: 900, // nietykalność po trafieniu, by nie tracić HP co klatkę
  respawnIframesMs: 1500, // dłuższa nietykalność po respawnie (PRD ~1.5 s)
} as const;

/**
 * Tarcza: NIE jest domyślna — gracz włącza ją przytrzymaniem Spacji.
 * Aktywna tarcza to łuk nad statkiem, który odpycha i niszczy wrogów,
 * ale zużywa energię; po puszczeniu energia się regeneruje.
 * Kontakt z wrogiem BEZ aktywnej tarczy rani gracza (utrata HP).
 */
export const SHIELD = {
  radius: 48, // bazowo MAŁA — powiększana wyłącznie bonusem ShieldBoost (Faza 4)
  pushForce: 440, // mocne odbicie — wróg wyraźnie odlatuje od tarczy
  arcHalfDeg: 82, // połowa rozwarcia łuku liczona od pionu w górę
  bounceCooldownMs: 450, // jak długo po odbiciu wróg nie liczy kolejnego trafienia
  // energia (łatwa do utrzymania: tarcza to główna obrona)
  maxEnergy: 100,
  drainPerSec: 26, // ~3.8 s ciągłej tarczy z pełnej energii
  regenPerSec: 42, // szybka regeneracja — krótkie puszczenie odnawia tarczę
  reactivateAt: 14, // po wyczerpaniu blokada aż energia odbije do tego progu
} as const;

/**
 * Ile odbić tarczą eliminuje danego wroga (zamiast ciągłych obrażeń).
 * Każde wejście w tarczę = jedno odbicie (z cooldownem), wróg odlatuje;
 * po wyczerpaniu odbić ginie i daje punkty.
 */
export const BOUNCES = {
  virus: 1,
  trojan: 2,
  worm: 1,
  spyware: 3,
  boss: 4,
} as const;

/** Tuning wroga Virus — prosty, masowy szkodnik lecący w dół. */
export const VIRUS = {
  speed: 90,
  contactDamage: 14,
} as const;

/** Trojan — wolny, większy, okresowo „szarżuje" w stronę gracza. */
export const TROJAN = {
  speed: 50,
  chargeSpeed: 210,
  chargeEveryMs: 2800,
  chargeDurationMs: 550,
  contactDamage: 22,
} as const;

/** Worm — sinusoidalny tor, trudniejszy do utrzymania w łuku tarczy. */
export const WORM = {
  speed: 105,
  amplitude: 72, // px wychylenia w poziomie
  freqHz: 1.2, // cykli na sekundę
  contactDamage: 12,
} as const;

/** Spyware — wolny, strzela pakietami-pociskami w dół. */
export const SPYWARE = {
  speed: 65,
  fireEveryMs: 2200,
  contactDamage: 12,
} as const;

/** Pakiety-pociski Spyware. */
export const BULLET = {
  speed: 195,
  damage: 9,
  radius: 5,
} as const;

/**
 * DifficultyCurve: mnożniki skalujące HP/prędkość/częstotliwość spawnu
 * z upływem czasu sesji (PRD #11). Liniowy ramp do limitu, potem cap.
 */
export const DIFFICULTY = {
  rampMs: 4 * 60 * 1000, // pełna trudność po ~4 min
  maxHpMult: 2.2,
  maxSpeedMult: 1.55,
  minSpawnMult: 0.45, // interwał spawnu skraca się do 45%
} as const;

/** Typy power-upów (PRD #22–26). */
export type PowerUpType = "packetStream" | "immunity" | "shieldBoost" | "firewallRepair";

/**
 * Power-upy: wrogowie z szansą dropChance upuszczają jeden z typów; gracz je
 * zbiera. Każdy buff ma własny czas trwania (FirewallRepair działa natychmiast).
 */
export const POWERUP = {
  dropChance: 0.12,
  fallSpeed: 95,
  durations: {
    packetStream: 8000,
    immunity: 5000,
    shieldBoost: 10000,
    firewallRepair: 0, // natychmiastowy
  },
  // ShieldBoost: powiększenie bazowo małej tarczy + mocniejsze odbicia
  boostRadiusMult: 1.75,
  boostBouncesPerHit: 2,
  // kolory sygnalizacji per typ
  colors: {
    packetStream: COLORS.magenta,
    immunity: COLORS.cyan,
    shieldBoost: COLORS.yellow,
    firewallRepair: COLORS.green,
  },
} as const;

/** Strzał gracza — WYŁĄCZNIE w trybie PacketStream (nigdy domyślnie). */
export const PLAYER_SHOT = {
  fireEveryMs: 170,
  speed: 540,
  radius: 5,
} as const;
