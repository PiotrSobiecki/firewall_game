// Stałe gry — pojedyncze źródło prawdy, do tuningu w playteście.
// Wartości zgodne z PRD.md (#1).

/**
 * Wartość pokazywana na HUD jako orientacyjny cel/progres. NIE jest już sama
 * w sobie warunkiem wygranej — patrz WIN_SCORE_AFTER_MINI_BOSS i RunController.
 */
export const TARGET_SCORE = 900;

/**
 * Wygrana (zmiana 2026-05-23): nie wystarczy próg punktów. Trzeba pokonać
 * mini-bossa, a POTEM zdobyć jeszcze tyle punktów, licząc od wyniku z chwili
 * jego pokonania. Bez pokonania bossa rundy nie da się wygrać.
 */
/** Ile pkt zdobyć po pokonaniu mini-bossa, żeby wygrać rundę. */
export const WIN_SCORE_AFTER_MINI_BOSS = 100;

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

/** Ranking: ile miejsc trzymamy/pokazujemy (TOP N). Imię pytane gdy wynik wchodzi do TOP N. */
export const LEADERBOARD_SIZE = 10;

/**
 * Adres API rankingu (Cloudflare Worker + Neon). Globalny ranking online.
 * Build prod celuje w workera; `vite dev` w localhost (`wrangler dev` :8787).
 * `VITE_API_BASE` nadpisuje oba (nie polegamy na gitignorowanym .env w buildzie).
 * Bez sieci ranking jest niedostępny.
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://firewall-scores.piotr-sobiecki.workers.dev");

/** Link do utworu „Firewall” (streaming — Feature.fm / Next Music). */
export const MUSIC_URL = "https://nextmusic.ffm.to/firewall";

/** @deprecated Użyj MUSIC_URL */
export const YOUTUBE_URL = MUSIC_URL;

/**
 * Audio (PRD #27–28): utwór „Firewall" leci w pętli przez całą rozgrywkę.
 * Plik w `public/` (serwowany przez Vite). Brak pliku nie blokuje gry.
 */
export const AUDIO = {
  trackFile: "firewall.mp3",
  musicVolume: 0.6,
  sfxVolume: 0.5, // głośność proceduralnych efektów (tarcza, zniszczenia)
} as const;

/** Rozdzielczość logiczna (portrait jak mobile shmup). */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

/**
 * Sterowanie dotykowe (issue #8): wirtualny joystick po lewej (ruch), przycisk
 * po prawej (tarcza). Tylko na urządzeniach dotykowych; klawiatura na desktopie
 * działa równolegle.
 */
export const TOUCH = {
  deadzone: 6, // w tym promieniu od środka bazy statek stoi (brak drgań)
  joyRadius: 54, // promień bazy = wychylenie dające pełną prędkość
  knobRadius: 24, // promień gałki
  joyMargin: 26, // odsunięcie środka bazy od lewego i dolnego brzegu (+joyRadius)
  shieldBtnRadius: 46,
} as const;

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

/**
 * Motyw teledysku „Firewall” — klimat Powrót do przyszłości / DeLorean.
 * Używane w tle, UI i rzadkim przejażdżce easter eggu w trakcie rundy.
 */
export const BTTF = {
  /** Kolory zachodu + stali DeLoriana (proceduralne sprite’y / gradient). */
  colors: {
    sunsetTop: 0x2a1050,
    sunsetMid: 0xc43a18,
    sunsetLow: 0xff9a3c,
    deloreanSilver: 0xb8c4d0,
    deloreanDark: 0x3a4248,
    fluxBlue: 0x44ccff,
    flameOrange: 0xff6600,
    flameRed: 0xff2200,
    cactus: 0x143828,
    cactusHi: 0x1f5c36,
  },
  /** Kaktusy w parallaxie przy drodze (menu, gra, EndScene). */
  cactus: {
    scrollSpeed: 32,
    period: 220,
    /** Odstęp od krawędzi ekranu — im mniej, tym dalej od środka drogi. */
    edgeInset: 4,
    /** Jak bardzo „zjeżdżają” w stronę drogi podczas scrolla (mniej = dalej na uboczu). */
    roadDrift: 0.065,
    /** Co ile px w cyklu pojawia się kolejny kaktus (mniej = gęściej). */
    spacing: 24,
  },
  /** Linia horyzontu (ułamek wysokości ekranu, od góry). Środek słońca leży na niej. */
  sunYRatio: 0.8,
  /** Słońce lekko na lewo od środka ekranu. */
  sunXRatio: 0.36,
  /** Pierwszy przejazd DeLoreana po starcie rundy. */
  flybyFirstMs: { min: 8_000, max: 22_000 },
  /** Odstęp między kolejnymi przejazdami (gdy poprzedni zniknął z ekranu). */
  flybyIntervalMs: { min: 14_000, max: 32_000 },
  flybySpeed: 300,
  flybyBonus: 150,
  /** Na perspektywicznej „drodze” u dołu ekranu (nie w powietrzu). */
  flybyYRatio: 0.9,
  /** Pauza między przejazdami na ekranie startowym. */
  menuDriveBetweenMs: { min: 2_000, max: 5_500 },
  /** Bohaterka na ekranie startowym (`public/menu_hero.png`) — przy lewej krawędzi drogi, obok kaktusów. */
  menuHero: {
    scale: 0.3,
    xRatio: 0.15,
    yRatio: 0.992,
    /** Nad DeLoreanem na menu (auto = menuDeloreanDepth). */
    depth: 5,
    /** Środek aury tarczy na prawej pięści (px tekstury, anchor postaci 0.5/1). */
    shieldOffset: { x: 100, y: -390 },
    /** Promień aury w px tekstury (skaluje się z postacią). */
    shieldRadius: 58,
  },
  /** Warstwa przejazdu DeLoreana na menu i EndScene. */
  menuDeloreanDepth: 3,
  /**
   * Twarz pilotki w okienku kokpitu (`public/pilot_face.png`).
   * Offset od środka statku (0,0) w px tekstury 80×80.
   */
  playerPilot: {
    localX: 0,
    localY: -14,
    scale: 0.068,
    angle: 0,
    windowHalfW: 11,
    windowHalfH: 13,
  },
  /** Animowane ognie silnika statku gracza (offset od środka sprite’a 80×80). */
  playerEngine: {
    nozzleY: 36,
    nozzleX: 9,
  },
  /** Pixel-art DeLoreana z `public/delorean.png`. */
  delorean: {
    displayScale: 0.2,
    originY: 0.88,
    hitW: 82,
    hitH: 20,
    hitOffsetX: 8,
    hitOffsetY: 14,
    /** Pozycja emittera płomieni względem środka auta (x = w tył, y = w górę). */
    rearFlameOffset: { x: 38, y: -24 },
    /** Kurz z kół — y bliżej osi kół (mniej = wyżej). */
    wheelSmokeOffset: { x: 30, y: -6 },
    /** Strefa „zbicia” auta statkiem (px od środka sprite’a). */
    catchPadX: 58,
    catchPadY: 72,
  },
} as const;

/** Tuning gracza (do playtestu). */
export const PLAYER = {
  speed: 300,
  zoneTop: GAME_HEIGHT * 0.35, // ruch w dolnych ~65% ekranu
  bodyRadius: 18,
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
export type PowerUpType =
  | "packetStream"
  | "immunity"
  | "shieldBoost"
  | "firewallRepair";

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

/**
 * Mini-boss (PRD #12): wchodzi po przekroczeniu spawnAtScore, równolegle do
 * zwykłych wrogów. Ma własny pasek HP (liczony w trafieniach tarczy/strzału),
 * jest do minięcia (można wygrać go ignorując), a pokonanie daje bonus.
 */
export const BOSS = {
  spawnAtScore: 900,
  hp: 10, // liczba trafień (tarcza/strzał) do pokonania
  enterSpeed: 70, // schodzenie wejściowe
  strafeSpeed: 95, // ruch w poziomie u góry
  strafeY: 160, // docelowa wysokość patrolu (pod HUD)
  fireEveryMs: 1500,
  contactDamage: 30,
  bonus: 150,
  hitCooldownMs: 220, // min. odstęp między trafieniami tarczy
  // nurkowanie: boss okresowo zjeżdża w zasięg gracza (by dało się go bić tarczą).
  // Częściej i wolniej = dłużej w zasięgu łuku tarczy, więc realnie wygrywalny.
  diveEveryMs: 3200,
  diveY: 470,
  diveSpeed: 170,
} as const;
