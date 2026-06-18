import Phaser from "phaser";
import { BTTF, COLORS } from "../config";

/** Klucze tekstur generowanych w BootScene. */
export const TEXTURE = {
  player: "player",
  virus: "virus",
  trojan: "trojan",
  worm: "worm",
  spyware: "spyware",
  boss: "boss",
  bullet: "bullet",
  playerBullet: "playerBullet",
  puPacket: "pu_packet",
  puImmunity: "pu_immunity",
  puShield: "pu_shield",
  puRepair: "pu_repair",
  particle: "particle",
  smoke: "particle_smoke",
  delorean: "delorean",
  menuHero: "menu_hero",
  menuHeroWalk1: "menu_hero_walk_1",
  menuHeroWalk2: "menu_hero_walk_2",
  menuHeroWalk3: "menu_hero_walk_3",
  menuHeroWalk4: "menu_hero_walk_4",
  endWin: "end_win",
  endLose: "end_lose",
  pilotFace: "pilot_face",
} as const;

export const SPRITE = {
  player: { w: 80, h: 80 },
  virus: { w: 32, h: 32 },
  trojan: { w: 44, h: 44 },
  worm: { w: 36, h: 36 },
  spyware: { w: 36, h: 36 },
  boss: { w: 120, h: 104 },
  bullet: { w: 12, h: 12 },
  playerBullet: { w: 12, h: 16 },
  powerup: { w: 28, h: 28 },
  particle: { w: 10, h: 10 },
  smoke: { w: 12, h: 12 },
} as const;

const VIRUS_CORE = 0xcc0066;
const VIRUS_EDGE = 0x660033;

/**
 * Proceduralne sprite'y w stylu arcade cyber — bez zewnętrznych assetów.
 * Gracz = „flux interceptor” (kadłub inspirowany DeLoreanem / kapasytorem fluxu).
 * Virus = kolczasty blob malware z „złośliwymi” oczami.
 */
export function registerGameTextures(scene: Phaser.Scene): void {
  createPlayerTexture(scene);
  createVirusTexture(scene);
  createTrojanTexture(scene);
  createWormTexture(scene);
  createSpywareTexture(scene);
  createBossTexture(scene);
  createBulletTexture(scene);
  createPlayerBulletTexture(scene);
  createPowerUpTextures(scene);
  createParticleTexture(scene);
  createSmokeParticleTexture(scene);
}

/** Kapasytor fluxu — trzy świecące „beczki” w układzie Y (motyw BTTF). */
function drawFluxCapacitor(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  k: number,
): void {
  const { fluxBlue } = BTTF.colors;
  const tube = (x: number, y: number, r: number) => {
    g.fillStyle(fluxBlue, 0.2);
    g.fillCircle(x, y, r + 3 * k);
    g.fillStyle(0x0a2840, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(1.5 * k, fluxBlue, 1);
    g.strokeCircle(x, y, r);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(x, y - r * 0.25, r * 0.35);
  };
  tube(cx, cy - 7 * k, 4.2 * k);
  tube(cx - 7 * k, cy + 5 * k, 3.6 * k);
  tube(cx + 7 * k, cy + 5 * k, 3.6 * k);
  g.lineStyle(1 * k, fluxBlue, 0.75);
  g.lineBetween(cx, cy - 3 * k, cx - 5 * k, cy + 2 * k);
  g.lineBetween(cx, cy - 3 * k, cx + 5 * k, cy + 2 * k);
  g.lineBetween(cx - 5 * k, cy + 2 * k, cx + 5 * k, cy + 2 * k);
}

/** Przeciążony kapasitor fluxu — czerwone / pomarańczowe „beczki” (boss BTTF). */
function drawCorruptedFluxCapacitor(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  k: number,
): void {
  const { flameOrange, flameRed, fluxBlue } = BTTF.colors;
  const tube = (x: number, y: number, r: number, hot: boolean) => {
    g.fillStyle(hot ? flameRed : flameOrange, 0.35);
    g.fillCircle(x, y, r + 4 * k);
    g.fillStyle(0x2a0810, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(1.5 * k, hot ? flameRed : flameOrange, 1);
    g.strokeCircle(x, y, r);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x, y - r * 0.2, r * 0.3);
  };
  tube(cx, cy - 8 * k, 5 * k, true);
  tube(cx - 8 * k, cy + 6 * k, 4.2 * k, false);
  tube(cx + 8 * k, cy + 6 * k, 4.2 * k, false);
  g.lineStyle(1.2 * k, flameOrange, 0.9);
  g.lineBetween(cx, cy - 4 * k, cx - 6 * k, cy + 3 * k);
  g.lineBetween(cx, cy - 4 * k, cx + 6 * k, cy + 3 * k);
  g.lineBetween(cx - 6 * k, cy + 3 * k, cx + 6 * k, cy + 3 * k);
  g.lineStyle(1 * k, fluxBlue, 0.45);
  g.lineBetween(cx - 10 * k, cy - 2 * k, cx + 10 * k, cy + 4 * k);
}

/** Kadłub statku bez szyby — szyba i głowa pilotki doklejane osobno. */
function drawPlayerShipHull(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  const k = w / 56;
  const cx = w / 2;
  const { deloreanSilver, deloreanDark, fluxBlue, flameOrange, flameRed } = BTTF.colors;

  g.fillStyle(fluxBlue, 0.14);
  g.fillEllipse(cx, h - 5 * k, 28 * k, 14 * k);
  g.fillStyle(flameOrange, 0.45);
  g.fillEllipse(cx, h - 4 * k, 20 * k, 10 * k);
  g.fillStyle(flameRed, 0.7);
  g.fillEllipse(cx, h - 5 * k, 12 * k, 7 * k);
  g.fillStyle(0xffffff, 0.9);
  g.fillEllipse(cx, h - 6 * k, 5 * k, 4 * k);

  const fin = (s: number) => {
    const pts = [
      new Phaser.Math.Vector2(cx + s * 9 * k, 28 * k),
      new Phaser.Math.Vector2(cx + s * 25 * k, 34 * k),
      new Phaser.Math.Vector2(cx + s * 23 * k, 44 * k),
      new Phaser.Math.Vector2(cx + s * 11 * k, 42 * k),
    ];
    g.fillStyle(deloreanDark, 1);
    g.fillPoints(pts, true, true);
    g.lineStyle(1.5 * k, deloreanSilver, 0.95);
    g.strokePoints(pts, true, true);
    g.lineStyle(1 * k, fluxBlue, 0.45);
    g.lineBetween(cx + s * 11 * k, 31 * k, cx + s * 21 * k, 36 * k);
  };
  fin(-1);
  fin(1);

  const hull = [
    new Phaser.Math.Vector2(cx, 5 * k),
    new Phaser.Math.Vector2(cx + 13 * k, 20 * k),
    new Phaser.Math.Vector2(cx + 15 * k, 38 * k),
    new Phaser.Math.Vector2(cx + 9 * k, 49 * k),
    new Phaser.Math.Vector2(cx - 9 * k, 49 * k),
    new Phaser.Math.Vector2(cx - 15 * k, 38 * k),
    new Phaser.Math.Vector2(cx - 13 * k, 20 * k),
  ];
  g.fillStyle(deloreanDark, 1);
  g.fillPoints(hull, true, true);
  g.fillStyle(deloreanSilver, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(cx, 7 * k),
      new Phaser.Math.Vector2(cx + 11 * k, 21 * k),
      new Phaser.Math.Vector2(cx + 12 * k, 36 * k),
      new Phaser.Math.Vector2(cx + 7 * k, 46 * k),
      new Phaser.Math.Vector2(cx - 7 * k, 46 * k),
      new Phaser.Math.Vector2(cx - 12 * k, 36 * k),
      new Phaser.Math.Vector2(cx - 11 * k, 21 * k),
    ],
    true,
    true,
  );

  g.lineStyle(1.5 * k, deloreanDark, 0.85);
  g.lineBetween(cx - 12 * k, 30 * k, cx + 12 * k, 30 * k);
  g.lineStyle(1 * k, fluxBlue, 0.35);
  g.lineBetween(cx - 10 * k, 32 * k, cx + 10 * k, 32 * k);

  // wnętrze kokpitu — ciemne okienko pod twarz pilotki
  g.fillStyle(0x060c14, 1);
  g.fillRoundedRect(cx - 7 * k, 10 * k, 14 * k, 16 * k, 2 * k);
  g.lineStyle(1.5 * k, deloreanSilver, 0.95);
  g.strokeRoundedRect(cx - 7.5 * k, 9.5 * k, 15 * k, 17 * k, 2.5 * k);

  g.fillStyle(0xcc1122, 0.95);
  g.fillRoundedRect(cx - 11 * k, h - 14 * k, 5 * k, 3 * k, k);
  g.fillRoundedRect(cx + 6 * k, h - 14 * k, 5 * k, 3 * k, k);

  g.lineStyle(2 * k, deloreanSilver, 1);
  g.strokePoints(hull, true, true);
  g.lineStyle(1 * k, fluxBlue, 0.55);
  g.strokePoints(hull, true, true);

  drawFluxCapacitor(g, cx, 27 * k, k);
}

/** Szyba kokpitu — połysk na okienku u nosa statku. */
function drawCockpitGlass(g: Phaser.GameObjects.Graphics, cx: number, k: number): void {
  const { fluxBlue, deloreanSilver } = BTTF.colors;
  g.fillStyle(fluxBlue, 0.14);
  g.fillRoundedRect(cx - 6.5 * k, 10.5 * k, 13 * k, 14 * k, 2 * k);
  g.fillStyle(0xffffff, 0.12);
  g.fillRoundedRect(cx - 4 * k, 11 * k, 5 * k, 6 * k, 1 * k);
  g.lineStyle(1 * k, deloreanSilver, 0.75);
  g.strokeRoundedRect(cx - 7.5 * k, 9.5 * k, 15 * k, 17 * k, 2.5 * k);
}

function createPlayerTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.player;
  const k = w / 56;
  const g = scene.make.graphics({ x: 0, y: 0 });

  drawPlayerShipHull(g, w, h);
  drawCockpitGlass(g, w / 2, k);

  if (scene.textures.exists(TEXTURE.player)) {
    scene.textures.remove(TEXTURE.player);
  }
  g.generateTexture(TEXTURE.player, w, h);
  g.destroy();
}

/** Kolce wokół bloba — czytelny „wirus” na małym sprite. */
function drawSpikyBlob(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  baseR: number,
  spikes: number,
  spikeLen: number,
): void {
  const steps = spikes * 2;
  g.beginPath();
  for (let i = 0; i < steps; i++) {
    const a = (Math.PI * 2 * i) / steps - Math.PI / 2;
    const r = i % 2 === 0 ? baseR + spikeLen : baseR;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

function createVirusTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.virus;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2 + 1;

  // --- Poświata zagrożenia ---
  g.fillStyle(COLORS.magenta, 0.18);
  drawSpikyBlob(g, cx, cy, 12, 9, 4);

  // --- Anteny / flagelle (za ciałem, „macki” malware) ---
  g.lineStyle(2, COLORS.magenta, 0.95);
  g.lineBetween(cx - 8, cy - 7, cx - 13, cy - 14);
  g.lineBetween(cx + 8, cy - 7, cx + 13, cy - 14);
  g.lineBetween(cx, cy - 9, cx, cy - 16);
  g.fillStyle(COLORS.yellow, 1);
  g.fillCircle(cx - 13, cy - 14, 2);
  g.fillCircle(cx + 13, cy - 14, 2);
  g.fillCircle(cx, cy - 16, 2);

  // --- Kontur kolczasty (ciemny obrys) ---
  g.fillStyle(VIRUS_EDGE, 1);
  drawSpikyBlob(g, cx, cy, 11, 9, 5);

  // --- Ciało (jadowita magenta) ---
  g.fillStyle(VIRUS_CORE, 1);
  drawSpikyBlob(g, cx, cy, 9, 9, 3.5);

  // --- Korupcja kodu (glitch-piksele) ---
  g.fillStyle(COLORS.yellow, 0.9);
  g.fillRect(cx - 8, cy - 4, 3, 2);
  g.fillRect(cx + 5, cy + 4, 4, 2);
  g.fillRect(cx - 2, cy + 6, 2, 2);
  g.fillStyle(COLORS.green, 0.7);
  g.fillRect(cx + 6, cy - 5, 2, 2);
  g.fillRect(cx - 7, cy + 3, 2, 2);

  // --- Złowrogie oczy: kanciaste, świecące, zmrużone ---
  // ciemne oczodoły
  g.fillStyle(0x1a0010, 1);
  g.fillTriangle(cx - 8, cy - 3, cx - 1, cy - 3, cx - 5, cy + 2);
  g.fillTriangle(cx + 8, cy - 3, cx + 1, cy - 3, cx + 5, cy + 2);
  // świecące żółte źrenice
  g.fillStyle(COLORS.yellow, 1);
  g.fillTriangle(cx - 7, cy - 2, cx - 2, cy - 2, cx - 4.5, cy + 1);
  g.fillTriangle(cx + 7, cy - 2, cx + 2, cy - 2, cx + 4.5, cy + 1);
  // ostre błyski
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx - 5, cy - 2, 1, 1);
  g.fillRect(cx + 4, cy - 2, 1, 1);

  // --- Wyszczerzona „paszcza” ---
  g.lineStyle(1.5, 0x1a0010, 1);
  g.lineBetween(cx - 4, cy + 5, cx + 4, cy + 5);
  g.fillStyle(0x1a0010, 1);
  g.fillTriangle(cx - 3, cy + 5, cx - 1, cy + 5, cx - 2, cy + 7);
  g.fillTriangle(cx + 1, cy + 5, cx + 3, cy + 5, cx + 2, cy + 7);

  g.generateTexture(TEXTURE.virus, w, h);
  g.destroy();
}

/** Trojan — opancerzony „blok" malware z fałszywą ikoną prezentu/pakietu. */
function createTrojanTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.trojan;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2;

  // poświata zagrożenia
  g.fillStyle(COLORS.yellow, 0.12);
  g.fillCircle(cx, cy, 20);

  // sześciokątny pancerz
  const hex = (r: number): Phaser.Math.Vector2[] => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    return pts;
  };
  g.fillStyle(0x3a2a0a, 1);
  g.fillPoints(hex(18), true, true);
  g.lineStyle(2.5, COLORS.yellow, 0.95);
  g.strokePoints(hex(18), true, true);
  g.lineStyle(1, COLORS.yellow, 0.4);
  g.strokePoints(hex(12), true, true);

  // nity pancerza
  g.fillStyle(COLORS.yellow, 0.8);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    g.fillCircle(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 1.6);
  }

  // fałszywa „ikona pakietu" (koń trojański = ukryta groźba): wstążka prezentu
  g.lineStyle(2, COLORS.magenta, 0.9);
  g.lineBetween(cx - 9, cy, cx + 9, cy);
  g.lineBetween(cx, cy - 9, cx, cy + 9);
  // złe oczy w szczelinie pancerza
  g.fillStyle(COLORS.magenta, 1);
  g.fillRect(cx - 7, cy - 3, 4, 2);
  g.fillRect(cx + 3, cy - 3, 4, 2);

  g.generateTexture(TEXTURE.trojan, w, h);
  g.destroy();
}

/** Worm — segmentowy robak sieciowy, wije się; głowa z przodu (u dołu). */
function createWormTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.worm;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;

  // poświata
  g.fillStyle(COLORS.green, 0.12);
  g.fillCircle(cx, h / 2, 16);

  // segmenty (od ogona u góry do głowy u dołu)
  const segs = [
    { y: 8, r: 5 },
    { y: 15, r: 6 },
    { y: 22, r: 7 },
    { y: 29, r: 8 },
  ];
  for (const s of segs) {
    g.fillStyle(0x0a3322, 1);
    g.fillCircle(cx, s.y, s.r);
    g.lineStyle(1.5, COLORS.green, 0.9);
    g.strokeCircle(cx, s.y, s.r);
  }
  // głowa
  g.fillStyle(COLORS.green, 0.9);
  g.fillCircle(cx, 29, 4);
  // oczy głowy
  g.fillStyle(0x06140d, 1);
  g.fillCircle(cx - 2.5, 29, 1.4);
  g.fillCircle(cx + 2.5, 29, 1.4);

  g.generateTexture(TEXTURE.worm, w, h);
  g.destroy();
}

/** Spyware — „oko-kamera" inwigilacji, strzela pakietami danych. */
function createSpywareTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.spyware;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2;

  // poświata
  g.fillStyle(COLORS.cyan, 0.12);
  g.fillCircle(cx, cy, 17);

  // obudowa oka (migdał)
  g.fillStyle(0x0a2630, 1);
  g.fillEllipse(cx, cy, 30, 20);
  g.lineStyle(2, COLORS.cyan, 0.95);
  g.strokeEllipse(cx, cy, 30, 20);

  // tęczówka
  g.fillStyle(COLORS.magenta, 0.85);
  g.fillCircle(cx, cy, 7);
  // źrenica
  g.fillStyle(0x06140d, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 1.5, cy - 1.5, 1.4);
  // skan-linia (inwigilacja)
  g.lineStyle(1, COLORS.cyan, 0.5);
  g.lineBetween(cx - 14, cy, cx + 14, cy);

  g.generateTexture(TEXTURE.spyware, w, h);
  g.destroy();
}

/** Mini-boss — skorumpowany wehikuł czasu „Paradoks Fluxu” (DeLorean + malware). */
function createBossTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.boss;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2;
  const k = w / 56;
  const { deloreanSilver, deloreanDark, fluxBlue, flameOrange, flameRed } = BTTF.colors;

  // aura przeciążenia fluxu
  g.fillStyle(fluxBlue, 0.1);
  g.fillEllipse(cx, cy + 4 * k, w * 0.92, h * 0.88);
  g.fillStyle(flameOrange, 0.08);
  g.fillEllipse(cx, cy + 8 * k, w * 0.7, h * 0.55);

  // płomienie silnika (tył statku — dół sprite’a)
  g.fillStyle(flameOrange, 0.55);
  g.fillEllipse(cx - 14 * k, h - 6 * k, 14 * k, 8 * k);
  g.fillEllipse(cx + 14 * k, h - 6 * k, 14 * k, 8 * k);
  g.fillStyle(flameRed, 0.75);
  g.fillEllipse(cx - 14 * k, h - 5 * k, 8 * k, 5 * k);
  g.fillEllipse(cx + 14 * k, h - 5 * k, 8 * k, 5 * k);

  // skrzydła gull-wing (DeLorean)
  const wing = (s: number) => {
    const pts = [
      new Phaser.Math.Vector2(cx + s * 10 * k, 22 * k),
      new Phaser.Math.Vector2(cx + s * 28 * k, 28 * k),
      new Phaser.Math.Vector2(cx + s * 26 * k, 42 * k),
      new Phaser.Math.Vector2(cx + s * 12 * k, 40 * k),
    ];
    g.fillStyle(deloreanDark, 1);
    g.fillPoints(pts, true, true);
    g.lineStyle(2 * k, deloreanSilver, 0.95);
    g.strokePoints(pts, true, true);
    g.lineStyle(1 * k, fluxBlue, 0.35);
    g.lineBetween(cx + s * 12 * k, 26 * k, cx + s * 22 * k, 32 * k);
  };
  wing(-1);
  wing(1);

  // kadłub — poszerzony flux interceptor
  const hull = [
    new Phaser.Math.Vector2(cx, 6 * k),
    new Phaser.Math.Vector2(cx + 16 * k, 22 * k),
    new Phaser.Math.Vector2(cx + 18 * k, 42 * k),
    new Phaser.Math.Vector2(cx + 11 * k, 54 * k),
    new Phaser.Math.Vector2(cx - 11 * k, 54 * k),
    new Phaser.Math.Vector2(cx - 18 * k, 42 * k),
    new Phaser.Math.Vector2(cx - 16 * k, 22 * k),
  ];
  g.fillStyle(deloreanDark, 1);
  g.fillPoints(hull, true, true);
  g.fillStyle(deloreanSilver, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(cx, 8 * k),
      new Phaser.Math.Vector2(cx + 14 * k, 23 * k),
      new Phaser.Math.Vector2(cx + 15 * k, 40 * k),
      new Phaser.Math.Vector2(cx + 9 * k, 50 * k),
      new Phaser.Math.Vector2(cx - 9 * k, 50 * k),
      new Phaser.Math.Vector2(cx - 15 * k, 40 * k),
      new Phaser.Math.Vector2(cx - 14 * k, 23 * k),
    ],
    true,
    true,
  );

  // pas biegnący przez drzwi
  g.lineStyle(2 * k, deloreanDark, 0.85);
  g.lineBetween(cx - 15 * k, 32 * k, cx + 15 * k, 32 * k);
  g.lineStyle(1 * k, flameOrange, 0.55);
  g.lineBetween(cx - 12 * k, 34 * k, cx + 12 * k, 34 * k);

  // kokpit — złowrogie czerwone okno
  g.fillStyle(0x1a0408, 1);
  g.fillRoundedRect(cx - 8 * k, 12 * k, 16 * k, 18 * k, 2 * k);
  g.lineStyle(1.5 * k, deloreanSilver, 0.9);
  g.strokeRoundedRect(cx - 8.5 * k, 11.5 * k, 17 * k, 19 * k, 2.5 * k);
  g.fillStyle(flameRed, 0.85);
  g.fillCircle(cx, 22 * k, 5.5 * k);
  g.fillStyle(COLORS.magenta, 0.35);
  g.fillCircle(cx, 22 * k, 7 * k);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.5 * k, 20.5 * k, 1.2 * k);

  // wyświetlacz czasu — „88” (BTTF)
  g.fillStyle(0x120008, 1);
  g.fillRoundedRect(cx - 11 * k, 36 * k, 22 * k, 9 * k, 1.5 * k);
  g.lineStyle(1 * k, flameRed, 0.85);
  g.strokeRoundedRect(cx - 11 * k, 36 * k, 22 * k, 9 * k, 1.5 * k);
  g.fillStyle(flameOrange, 1);
  g.fillRect(cx - 8 * k, 38.5 * k, 5 * k, 4 * k);
  g.fillRect(cx - 1 * k, 38.5 * k, 5 * k, 4 * k);
  g.fillRect(cx + 6 * k, 38.5 * k, 5 * k, 4 * k);
  g.fillRect(cx + 3 * k, 38.5 * k, 2 * k, 4 * k);
  g.fillRect(cx + 10 * k, 38.5 * k, 2 * k, 4 * k);

  drawCorruptedFluxCapacitor(g, cx, 30 * k, k);

  // zębiska — kolce z nosa, szczęki i skrzydeł (agresywny malware)
  g.fillStyle(flameRed, 1);
  for (const s of [-1, 1]) {
    g.fillTriangle(cx + s * 4 * k, 6 * k, cx + s * 14 * k, 18 * k, cx + s * 1 * k, 18 * k);
    g.fillTriangle(cx + s * 9 * k, 12 * k, cx + s * 18 * k, 23 * k, cx + s * 5 * k, 22 * k);
    g.fillTriangle(cx + s * 22 * k, 30 * k, cx + s * 30 * k, 38 * k, cx + s * 20 * k, 36 * k);
  }
  for (let i = -3; i <= 3; i++) {
    const tx = cx + i * 6.5 * k;
    g.fillTriangle(tx - 3 * k, 46 * k, tx, 58 * k, tx + 3 * k, 46 * k);
  }
  g.fillStyle(COLORS.magenta, 0.9);
  g.fillTriangle(cx - 4 * k, 9 * k, cx, 4 * k, cx + 4 * k, 9 * k);
  g.fillStyle(0xffffff, 0.75);
  for (const s of [-1, 1]) {
    g.fillCircle(cx + s * 8 * k, 12 * k, 1.4 * k);
  }

  // glitch scan — malware na linii czasu
  g.lineStyle(2, COLORS.magenta, 0.5);
  g.lineBetween(cx - 24 * k, 17 * k, cx + 24 * k, 17 * k);
  g.lineStyle(1.5, flameRed, 0.45);
  g.lineBetween(cx - 20 * k, 44 * k, cx + 20 * k, 44 * k);

  g.lineStyle(2 * k, deloreanSilver, 1);
  g.strokePoints(hull, true, true);
  g.lineStyle(1 * k, fluxBlue, 0.5);
  g.strokePoints(hull, true, true);

  if (scene.textures.exists(TEXTURE.boss)) {
    scene.textures.remove(TEXTURE.boss);
  }
  g.generateTexture(TEXTURE.boss, w, h);
  g.destroy();
}

/** Pakiet-pocisk Spyware. */
function createBulletTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.bullet;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2;
  g.fillStyle(COLORS.magenta, 0.3);
  g.fillCircle(cx, cy, 6);
  g.fillStyle(COLORS.magenta, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx, cy, 1.5);
  g.generateTexture(TEXTURE.bullet, w, h);
  g.destroy();
}

/** Pocisk gracza — smuga fluxu (niebieska poświata + pomarańczowy rdzeń). */
function createPlayerBulletTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.playerBullet;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const { fluxBlue, flameOrange } = BTTF.colors;
  g.fillStyle(fluxBlue, 0.35);
  g.fillEllipse(cx, h / 2, w, h);
  g.fillStyle(flameOrange, 0.85);
  g.fillTriangle(cx, 0, cx + 3.5, h - 2, cx - 3.5, h - 2);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 1, 1, 2, h - 4);
  g.fillStyle(fluxBlue, 0.6);
  g.fillCircle(cx, h - 3, 2.5);
  g.generateTexture(TEXTURE.playerBullet, w, h);
  g.destroy();
}

/** Power-upy: kapsuła w kolorze typu z czytelnym symbolem. */
function createPowerUpTextures(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.powerup;
  const cx = w / 2;
  const cy = h / 2;

  const make = (key: string, color: number, glyph: (g: Phaser.GameObjects.Graphics) => void) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 0.16);
    g.fillCircle(cx, cy, 13);
    g.fillStyle(0x0d1622, 1);
    g.fillRoundedRect(3, 3, w - 6, h - 6, 6);
    g.lineStyle(2, color, 0.95);
    g.strokeRoundedRect(3, 3, w - 6, h - 6, 6);
    g.fillStyle(color, 1);
    g.lineStyle(2, color, 1);
    glyph(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };

  // PacketStream — dwa szewrony w górę (ofensywa)
  make(TEXTURE.puPacket, COLORS.magenta, (g) => {
    g.fillTriangle(cx, 7, cx - 6, 14, cx + 6, 14);
    g.fillTriangle(cx, 13, cx - 6, 20, cx + 6, 20);
  });
  // Immunity — gwiazda/błysk (nietykalność)
  make(TEXTURE.puImmunity, COLORS.cyan, (g) => {
    g.lineBetween(cx, 6, cx, h - 6);
    g.lineBetween(7, cy, w - 7, cy);
    g.lineBetween(9, 9, w - 9, h - 9);
    g.lineBetween(w - 9, 9, 9, h - 9);
  });
  // ShieldBoost — sześciokąt (większa tarcza)
  make(TEXTURE.puShield, COLORS.yellow, (g) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7));
    }
    g.strokePoints(pts, true, true);
  });
  // FirewallRepair — plus (leczenie)
  make(TEXTURE.puRepair, COLORS.green, (g) => {
    g.fillRect(cx - 2, 7, 4, h - 14);
    g.fillRect(7, cy - 2, w - 14, 4);
  });
}

function createSmokeParticleTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.smoke;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(w / 2, h / 2, 5);
  g.fillStyle(0xffffff, 0.25);
  g.fillCircle(w / 2, h / 2, 7);
  g.generateTexture(TEXTURE.smoke, w, h);
  g.destroy();
}

function createParticleTexture(scene: Phaser.Scene): void {
  const { w, h } = SPRITE.particle;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const cx = w / 2;
  const cy = h / 2;

  g.fillStyle(0xffffff, 1);
  g.beginPath();
  g.moveTo(cx, 0);
  g.lineTo(w, cy);
  g.lineTo(cx, h);
  g.lineTo(0, cy);
  g.closePath();
  g.fillPath();

  g.fillStyle(COLORS.cyan, 0.5);
  g.fillCircle(cx, cy, 2);

  g.generateTexture(TEXTURE.particle, w, h);
  g.destroy();
}
