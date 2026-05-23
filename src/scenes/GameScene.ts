import Phaser from "phaser";
import { TEXTURE } from "../art/SpriteTextures";
import {
  COLORS,
  COLOR_HEX,
  GAME_WIDTH,
  GAME_HEIGHT,
  SESSION_MAX_MS,
  BULLET,
  POWERUP,
  PLAYER,
  PLAYER_SHOT,
  BOSS,
  TOUCH,
  WIN_SCORE_AFTER_MINI_BOSS,
} from "../config";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { PowerUp } from "../entities/PowerUp";
import { Boss } from "../entities/Boss";
import { ShieldSystem } from "../systems/ShieldSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
import { RunController } from "../systems/RunController";
import { SpawnSystem } from "../systems/SpawnSystem";
import { PowerUpSystem } from "../systems/PowerUpSystem";
import type { DifficultyLevel } from "../systems/DifficultyCurve";
import type { EnemyType, PowerUpType } from "../config";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { HUD } from "../ui/HUD";
import { MusicController } from "../systems/MusicController";
import { Sfx } from "../systems/Sfx";
import { followDrive } from "../systems/TouchMove";
import type { EndData } from "./EndScene";

const POWERUP_TYPES: PowerUpType[] = ["packetStream", "immunity", "shieldBoost", "firewallRepair"];

const SPAWN_X = GAME_WIDTH / 2;
const SPAWN_Y = GAME_HEIGHT - 90;

/** Rdzeń rozgrywki: tarcza, fale wrogów (4 typy), combo, punkty, win/lose. */
export class GameScene extends Phaser.Scene {
  private bg!: RetroGridBackground;
  private player!: Player;
  private shield!: ShieldSystem;
  private score!: ScoreSystem;
  private run!: RunController;
  private spawner!: SpawnSystem;
  private powerups!: PowerUpSystem;
  private hud!: HUD;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private drops!: Phaser.Physics.Arcade.Group;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private playerVec = new Phaser.Math.Vector2();
  private nextShotAt = 0;
  private boss?: Boss;
  private bossSpawned = false;
  /** Czy mini-boss został już zaliczony (niezależnie od referencji this.boss). */
  private bossDefeatCommitted = false;
  /**
   * Boss oznaczony do zabicia. NIE niszczymy go w callbacku kolizji (onBossShot)
   * — to footgun Phasera (destroy w trakcie iteracji świata fizyki zostawia
   * pasek i przerywa killBoss). Faktyczny ubój robimy w bezpiecznym update().
   */
  private bossKillPending = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private space!: Phaser.Input.Keyboard.Key;

  private startTime = 0;
  private started = false; // czas/spawn startują przy 1. klatce update (zegar sceny != 0 dopiero wtedy)
  private ended = false;

  private music!: MusicController;
  private sfx!: Sfx;
  private shieldWasActive = false; // do wykrycia zbocza: SFX tylko przy WŁĄCZENIU
  private paused = false;
  private pausedAt = 0;
  private pausedTotal = 0; // łączny czas pauz — odejmowany od elapsed (uczciwy timeout)
  private pauseOverlay?: Phaser.GameObjects.Text;

  // Sterowanie dotykowe (issue #8) — tylko na urządzeniach dotykowych
  private touchShield = false;
  private shieldBtn?: Phaser.GameObjects.Arc;
  private shieldPointerId = -1;
  // wirtualny joystick (lewa): baza stała, gałka podąża za palcem
  private joyActive = false;
  private joyPointerId = -1;
  private joyBaseX = 0;
  private joyBaseY = 0;
  private joyVecX = 0; // bieżące wychylenie -1..1
  private joyVecY = 0;
  private joyBase?: Phaser.GameObjects.Arc;
  private joyKnob?: Phaser.GameObjects.Arc;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.ended = false;
    this.started = false;
    this.paused = false;
    this.pausedTotal = 0;
    this.bg = new RetroGridBackground(this);
    this.score = new ScoreSystem();
    this.run = new RunController();

    this.player = new Player(this, SPAWN_X, SPAWN_Y);
    this.shield = new ShieldSystem(this, this.player);

    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: 80,
      runChildUpdate: false,
    });
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 64,
      runChildUpdate: false,
    });
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 48,
      runChildUpdate: false,
    });
    this.drops = this.physics.add.group({
      classType: PowerUp,
      maxSize: 16,
      runChildUpdate: false,
    });
    this.powerups = new PowerUpSystem();
    this.nextShotAt = 0;
    this.boss = undefined;
    this.bossSpawned = false;
    this.bossDefeatCommitted = false;
    this.bossKillPending = false;

    this.burst = this.add.particles(0, 0, TEXTURE.particle, {
      speed: { min: 50, max: 200 },
      lifespan: 420,
      scale: { start: 1.2, end: 0 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      tint: [COLORS.magenta, COLORS.cyan, COLORS.yellow],
      emitting: false,
    });
    this.burst.setDepth(7);

    this.hud = new HUD(this);
    this.hud.setLives(this.run.lives);
    this.hud.setTime(0, SESSION_MAX_MS);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as typeof this.wasd;
    this.space = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Utwór leci od startu rozgrywki (idempotentnie — łapie też powtórkę z End).
    // M włącza/wyłącza muzykę, P pauzuje/wznawia.
    this.music = new MusicController(this);
    this.music.start();
    this.sfx = new Sfx(this);
    this.shieldWasActive = false;
    kb.on("keydown-M", () => this.music.toggle());
    kb.on("keydown-P", () => this.togglePause());

    // Dotyk: joystick (lewa) = ruch, przycisk (prawa) = tarcza. Klawiatura równolegle.
    this.touchShield = false;
    this.shieldPointerId = -1;
    this.joyActive = false;
    this.joyPointerId = -1;
    this.joyVecX = 0;
    this.joyVecY = 0;
    if (this.sys.game.device.input.touch) this.setupTouchControls();

    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.onContact(e as Enemy));
    this.physics.add.overlap(this.player, this.bullets, (_p, b) =>
      this.onBulletHit(b as Phaser.Physics.Arcade.Image),
    );
    this.physics.add.overlap(this.playerBullets, this.enemies, (b, e) =>
      this.onShotHit(b as Phaser.Physics.Arcade.Image, e as Enemy),
    );
    this.physics.add.overlap(this.player, this.drops, (_p, d) =>
      this.collectPowerUp(d as PowerUp),
    );

    this.spawner = new SpawnSystem(
      (type, level, now) => this.spawnEnemy(type, level, now),
      (waveNumber) => this.onWaveComplete(waveNumber),
    );

  }

  private spawnEnemy(type: EnemyType, level: DifficultyLevel, now: number): void {
    if (this.ended) return;
    const x = Phaser.Math.Between(28, GAME_WIDTH - 28);
    const enemy = this.enemies.get(x, -24) as Enemy | null;
    if (!enemy) return;
    enemy.spawn(type, x, -24, level.speedMult, now);
  }

  private fireBullet(x: number, y: number, vx = 0): void {
    const bullet = this.bullets.get(x, y, TEXTURE.bullet) as Phaser.Physics.Arcade.Image | null;
    if (!bullet) return;
    bullet.enableBody(true, x, y, true, true);
    (bullet.body as Phaser.Physics.Arcade.Body).setCircle(BULLET.radius, 6 - BULLET.radius, 6 - BULLET.radius);
    bullet.setDepth(4);
    bullet.setVelocity(vx, BULLET.speed);
  }

  /** Strzał gracza — wyłącznie w trybie PacketStream (auto-fire w górę). */
  private firePlayerShot(): void {
    const x = this.player.x;
    const y = this.player.y - 26;
    const shot = this.playerBullets.get(x, y, TEXTURE.playerBullet) as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.enableBody(true, x, y, true, true);
    (shot.body as Phaser.Physics.Arcade.Body).setCircle(PLAYER_SHOT.radius, 1, 3);
    shot.setDepth(4);
    shot.setVelocity(0, -PLAYER_SHOT.speed);
  }

  /** Szansa na drop power-upu w miejscu eliminacji wroga. */
  private maybeDrop(x: number, y: number): void {
    if (Math.random() > POWERUP.dropChance) return;
    const drop = this.drops.get(x, y) as PowerUp | null;
    if (!drop) return;
    const type = Phaser.Utils.Array.GetRandom(POWERUP_TYPES) as PowerUpType;
    drop.spawn(type, x, y);
  }

  update(time: number, delta: number): void {
    if (this.ended || this.paused) return;

    // Start czasu i spawnów dopiero przy 1. klatce gry — w create() zegar sceny
    // jeszcze nie tyka (this.time.now = 0), więc elapsed liczyłby się od bootu.
    if (!this.started) {
      this.started = true;
      this.startTime = this.time.now;
      this.spawner.start(this.time.now);
    }

    const dtSec = delta / 1000;
    this.bg.update(dtSec);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const kix = (right ? 1 : 0) - (left ? 1 : 0);
    const kiy = (down ? 1 : 0) - (up ? 1 : 0);
    if (kix !== 0 || kiy !== 0) {
      this.player.drive(kix, kiy); // klawiatura ma pierwszeństwo
    } else if (this.joyActive) {
      this.player.driveProportional(this.joyVecX, this.joyVecY); // joystick: prędkość ~ wychylenie
    } else {
      this.player.drive(0, 0);
    }

    // ShieldBoost: większy promień + mocniejsze odbicia na czas buffa
    this.shield.setBoosted(this.powerups.isActive("shieldBoost", time));
    this.shield.update(dtSec, this.space.isDown || this.touchShield, this.enemies, (enemy) =>
      this.onKill(enemy),
    );
    this.hud.setEnergy(this.shield.energyRatio, this.shield.isExhausted);
    // SFX tylko przy WŁĄCZENIU tarczy (zbocze narastające), nie co klatkę
    if (this.shield.isActive && !this.shieldWasActive) this.sfx.shieldOn();
    this.shieldWasActive = this.shield.isActive;

    // PacketStream: auto-fire w górę (jedyny tryb strzału)
    if (this.powerups.isActive("packetStream", time) && time >= this.nextShotAt) {
      this.firePlayerShot();
      this.nextShotAt = time + PLAYER_SHOT.fireEveryMs;
    }

    this.playerVec.set(this.player.x, this.player.y);
    for (const obj of this.enemies.getChildren()) {
      const enemy = obj as Enemy;
      if (!enemy.active) continue;
      enemy.behave(time, this.playerVec, (bx, by) => this.fireBullet(bx, by));
      if (enemy.y > GAME_HEIGHT + 30 || enemy.y < -48) enemy.disableBody(true, true);
    }

    for (const obj of this.bullets.getChildren()) {
      const bullet = obj as Phaser.Physics.Arcade.Image;
      if (bullet.active && (bullet.y > GAME_HEIGHT + 20 || bullet.y < -20)) {
        bullet.disableBody(true, true);
      }
    }
    for (const obj of this.playerBullets.getChildren()) {
      const shot = obj as Phaser.Physics.Arcade.Image;
      if (shot.active && shot.y < -20) shot.disableBody(true, true);
    }
    for (const obj of this.drops.getChildren()) {
      const drop = obj as PowerUp;
      if (!drop.active) continue;
      drop.bob(time);
      if (drop.y > GAME_HEIGHT + 20) drop.disableBody(true, true);
    }

    // mini-boss: wejście po przekroczeniu progu, równolegle do zwykłych fal
    if (!this.bossSpawned && this.score.score >= BOSS.spawnAtScore) this.spawnBoss();
    if (this.boss && this.boss.active) {
      this.boss.behave(time, (bx, by, vx) => this.fireBullet(bx, by, vx));
      this.damageBossWithShield(time);
    }
    // Ubój bossa wykonujemy TU (poza callbackiem kolizji) — bezpieczny destroy.
    if (this.bossKillPending) {
      this.bossKillPending = false;
      this.killBoss();
    }

    // czas, combo i warunki końca zależne od wyniku/czasu (win / timeout)
    // pausedTotal odejmujemy, by pauza nie „zjadała" limitu czasu rundy
    const elapsed = this.time.now - this.startTime - this.pausedTotal;
    this.hud.setTime(elapsed, SESSION_MAX_MS);
    this.hud.setCombo(this.score.comboAt(time), this.score.multiplierAt(time));
    this.hud.setBuffs(this.powerups, time);
    this.spawner.update(time, elapsed);
    this.hud.setWave(this.spawner.waveNumber);
    this.hud.setObjective(this.score.score, this.run.bossDefeated, this.run.pointsAfterBoss);
    this.tryEndWin();
    if (this.ended) return;
    this.checkRunEnd();
  }

  /** Wygrana po bossie + 100 pkt (sprawdzane co klatkę i po każdym zabójstwie). */
  private tryEndWin(): void {
    if (this.ended || !this.started) return;
    if (!this.run.bossDefeated) return;
    if (this.run.pointsAfterBoss < WIN_SCORE_AFTER_MINI_BOSS) return;
    this.end("win");
  }

  /** Sprawdza timeout (i ewentualnie win przez RunController). */
  private checkRunEnd(): void {
    if (this.ended || !this.started) return;
    const elapsed = this.time.now - this.startTime - this.pausedTotal;
    const reason = this.run.update(this.score.score, elapsed);
    if (reason) this.end(reason);
  }

  /** Po bossie: nalicz pkt z ostatniego zabójstwa/fali i sprawdź wygraną. */
  private registerPostBossPoints(pts: number): void {
    if (!this.run.bossDefeated || pts <= 0) return;
    this.run.addPointsAfterBoss(pts);
    this.hud.setObjective(this.score.score, this.run.bossDefeated, this.run.pointsAfterBoss);
    this.tryEndWin();
  }

  /** Eliminacja wroga (tarcza lub strzał) → punkty (z combo) + efekty + drop. */
  private onKill(enemy: Enemy): void {
    this.sfx.enemyDeath();
    const pts = this.score.addKill(enemy.type, this.time.now);
    this.hud.setScore(this.score.score);
    this.registerPostBossPoints(pts);
    if (this.ended) return;
    this.checkRunEnd();
    this.cameras.main.shake(110, 0.006);
    this.maybeDrop(enemy.x, enemy.y);
    // wróg jest odepchnięty (dying) i odlatuje; po chwili wybucha i znika
    this.time.delayedCall(150, () => {
      if (!enemy.active) return;
      this.burst.explode(14, enemy.x, enemy.y);
      enemy.disableBody(true, true);
    });
    // win sprawdzany centralnie w update() przez RunController
  }

  /** Trafienie wroga pociskiem gracza (PacketStream). */
  private onShotHit(shot: Phaser.Physics.Arcade.Image, enemy: Enemy): void {
    if (this.ended || !shot.active || !enemy.active) return;
    shot.disableBody(true, true);
    this.burst.explode(4, shot.x, shot.y);
    if (enemy.takeShot()) {
      this.sfx.enemyDeath();
      this.burst.explode(14, enemy.x, enemy.y);
      enemy.disableBody(true, true);
      const pts = this.score.addKill(enemy.type, this.time.now);
      this.hud.setScore(this.score.score);
      this.registerPostBossPoints(pts);
      if (this.ended) return;
      this.maybeDrop(enemy.x, enemy.y);
      this.checkRunEnd();
    }
  }

  /** Zebranie power-upu → aktywacja efektu + sygnalizacja. */
  private collectPowerUp(drop: PowerUp): void {
    if (this.ended || !drop.active) return;
    const type = drop.puType;
    drop.disableBody(true, true);
    const now = this.time.now;
    this.burst.explode(10, this.player.x, this.player.y);

    const instant = this.powerups.apply(type, now);
    if (type === "immunity") {
      this.player.setImmuneUntil(now + POWERUP.durations.immunity);
    } else if (type === "firewallRepair" && instant) {
      this.player.heal(PLAYER.maxHp);
      this.hud.setHp(this.player.hpRatio);
    }
    this.hud.flashPowerUp(type);
  }

  /** Kontakt wroga ze statkiem bez aktywnej tarczy → utrata HP gracza. */
  private onContact(enemy: Enemy): void {
    if (this.ended || !enemy.active) return;
    if (!this.player.takeDamage(enemy.contactDamage, this.time.now)) return;
    enemy.disableBody(true, true);
    this.afterPlayerHit(enemy.x, enemy.y);
  }

  /** Trafienie pakietem Spyware. */
  private onBulletHit(bullet: Phaser.Physics.Arcade.Image): void {
    if (this.ended || !bullet.active) return;
    if (!this.player.takeDamage(BULLET.damage, this.time.now)) return;
    bullet.disableBody(true, true);
    this.afterPlayerHit(this.player.x, this.player.y);
  }

  /** Wspólna reakcja na obrażenia: efekty, ewentualny respawn lub koniec gry. */
  private afterPlayerHit(fxX: number, fxY: number): void {
    this.burst.explode(8, fxX, fxY);
    this.cameras.main.shake(130, 0.009);
    this.hud.setHp(this.player.hpRatio);
    if (this.player.isAlive) return;

    // utrata życia: respawn (pełne HP, kara −15, czas bez zmian) albo koniec gry
    if (this.run.loseLife()) {
      this.score.onDeath();
      this.player.respawn(SPAWN_X, SPAWN_Y, this.time.now);
      this.hud.setLives(this.run.lives);
      this.hud.setHp(this.player.hpRatio);
      this.hud.setScore(this.score.score);
      this.cameras.main.flash(160, 255, 60, 60);
    } else {
      this.end("death");
    }
  }

  /** Wejście mini-bossa (PRD #12) — równolegle do zwykłych spawnów. */
  private spawnBoss(): void {
    this.bossSpawned = true;
    this.boss = new Boss(this, GAME_WIDTH / 2, -60);
    this.physics.add.overlap(this.player, this.boss, () => this.onBossContact());
    this.physics.add.overlap(this.playerBullets, this.boss, (b) =>
      this.onBossShot(b as Phaser.Physics.Arcade.Image),
    );
    this.hud.flashBoss();
  }

  /** Tarcza rani bossa, gdy ten znajdzie się w jej łuku (np. podczas nurkowania). */
  private damageBossWithShield(now: number): void {
    if (!this.boss || !this.shield.isActive) return;
    const dx = this.boss.x - this.player.x;
    const dy = this.boss.y - this.player.y;
    if (dy > 0) return;
    // Zasięg do POWIERZCHNI bossa (łuk tarczy o promień jego ciała), inaczej
    // trafienie wymagało wejścia w bossa (i oberwania obrażeniami kontaktowymi).
    if (Math.hypot(dx, dy) > this.shield.currentRadius + this.boss.bodyRadius) return;
    if (this.boss.hitByShield(now, this.shield.hitPower)) this.bossKillPending = true;
  }

  private onBossContact(): void {
    if (this.ended || !this.boss?.active) return;
    if (!this.player.takeDamage(this.boss.contactDamage, this.time.now)) return;
    this.afterPlayerHit(this.player.x, this.player.y);
  }

  private onBossShot(shot: Phaser.Physics.Arcade.Image): void {
    if (this.ended || !shot.active || !this.boss?.active) return;
    shot.disableBody(true, true);
    this.burst.explode(4, shot.x, shot.y);
    if (this.boss.takeShot()) this.bossKillPending = true;
  }

  /** Pokonanie mini-bossa → bonus, licznik PO BOSSIE 0/100, efekty. */
  private killBoss(): void {
    if (this.bossDefeatCommitted) return;

    const bx = this.boss?.x ?? GAME_WIDTH / 2;
    const by = this.boss?.y ?? BOSS.strafeY;
    this.bossDefeatCommitted = true;

    if (this.boss) {
      this.boss.destroy();
      this.boss = undefined;
    }

    this.score.addBonus(BOSS.bonus);
    this.hud.setScore(this.score.score);
    this.run.onBossDefeated();
    this.hud.setObjective(this.score.score, true, 0);
    this.hud.flashBossDefeated();

    this.sfx.bossDefeated();
    this.burst.explode(48, bx, by);
    this.cameras.main.shake(260, 0.014);
    this.cameras.main.flash(180, 255, 0, 170);
    this.tryEndWin();
  }

  /** Przejście fali → bonus punktowy + sygnalizacja. */
  private onWaveComplete(waveNumber: number): void {
    if (this.ended) return;
    const pts = this.score.addWaveBonus();
    this.hud.setScore(this.score.score);
    this.registerPostBossPoints(pts);
    if (this.ended) return;
    this.hud.flashWave(waveNumber);
    this.checkRunEnd();
  }

  /** Kontrolki dotykowe (issue #8): joystick po lewej (ruch) + przycisk po prawej (tarcza). */
  private setupTouchControls(): void {
    this.input.addPointer(2); // joystick + tarcza jednocześnie

    // przycisk TARCZA — prawy dolny róg
    const r = TOUCH.shieldBtnRadius;
    const bx = GAME_WIDTH - r - 18;
    const by = GAME_HEIGHT - r - 22;
    this.shieldBtn = this.add.circle(bx, by, r, COLORS.cyan, 0.12).setDepth(15);
    this.shieldBtn.setStrokeStyle(2, COLORS.cyan, 0.7);
    this.add
      .text(bx, by, "TARCZA", { fontFamily: "monospace", fontSize: "12px", color: COLOR_HEX.cyan })
      .setOrigin(0.5)
      .setDepth(16);
    this.shieldBtn.setInteractive();
    this.shieldBtn.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.touchShield = true;
      this.shieldPointerId = p.id;
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id === this.shieldPointerId) {
        this.touchShield = false;
        this.shieldPointerId = -1;
      }
    };
    this.shieldBtn.on("pointerup", release);
    this.shieldBtn.on("pointerout", release);

    // wirtualny joystick — lewy dolny róg (baza stała + gałka)
    this.joyBaseX = TOUCH.joyMargin + TOUCH.joyRadius;
    this.joyBaseY = GAME_HEIGHT - TOUCH.joyMargin - TOUCH.joyRadius;
    this.joyBase = this.add
      .circle(this.joyBaseX, this.joyBaseY, TOUCH.joyRadius, COLORS.magenta, 0.1)
      .setDepth(15);
    this.joyBase.setStrokeStyle(2, COLORS.magenta, 0.55);
    this.joyKnob = this.add
      .circle(this.joyBaseX, this.joyBaseY, TOUCH.knobRadius, COLORS.magenta, 0.35)
      .setDepth(16);

    // pointer w lewej połowie (poza przyciskiem tarczy) steruje joystickiem
    this.input.on("pointerdown", this.onJoyInput, this);
    this.input.on("pointermove", this.onJoyInput, this);
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p.id === this.joyPointerId) this.resetJoy();
    });
  }

  /** Pointer steruje joystickiem: gałka podąża za palcem (clamp do promienia bazy). */
  private onJoyInput(p: Phaser.Input.Pointer): void {
    if (this.ended || this.paused) return;
    // pierwszy kontakt: złap tylko gdy w lewej połowie i poza strefą tarczy
    if (!this.joyActive) {
      if (p.id !== this.joyPointerId) {
        if (p.x > GAME_WIDTH * 0.5) return;
        if (this.overShieldBtn(p)) return;
        this.joyActive = true;
        this.joyPointerId = p.id;
      }
    } else if (p.id !== this.joyPointerId) {
      return; // inny palec (np. tarcza) — nie rusza joysticka
    }

    const v = followDrive(
      { x: this.joyBaseX, y: this.joyBaseY },
      { x: p.x, y: p.y },
      TOUCH.deadzone,
      TOUCH.joyRadius,
    );
    this.joyVecX = v.x;
    this.joyVecY = v.y;
    // gałka: wychylenie clampowane do promienia bazy
    this.joyKnob?.setPosition(
      this.joyBaseX + v.x * TOUCH.joyRadius,
      this.joyBaseY + v.y * TOUCH.joyRadius,
    );
  }

  private resetJoy(): void {
    this.joyActive = false;
    this.joyPointerId = -1;
    this.joyVecX = 0;
    this.joyVecY = 0;
    this.joyKnob?.setPosition(this.joyBaseX, this.joyBaseY);
  }

  private overShieldBtn(p: Phaser.Input.Pointer): boolean {
    if (!this.shieldBtn) return false;
    const d = Phaser.Math.Distance.Between(p.x, p.y, this.shieldBtn.x, this.shieldBtn.y);
    return d <= TOUCH.shieldBtnRadius + 8;
  }

  /** Pauza (P): zatrzymuje fizykę i pętlę gry, pokazuje overlay, mrozi czas rundy. */
  private togglePause(): void {
    if (this.ended) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.pausedAt = this.time.now;
      this.pauseOverlay = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "⏸ PAUZA\n\nP — wznów", {
          fontFamily: "monospace",
          fontSize: "26px",
          color: COLOR_HEX.cyan,
          align: "center",
          backgroundColor: "#0a0e17",
          padding: { x: 22, y: 18 },
        })
        .setOrigin(0.5)
        .setDepth(20);
    } else {
      this.physics.resume();
      this.pausedTotal += this.time.now - this.pausedAt;
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
    }
  }

  private end(reason: EndData["reason"]): void {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.cameras.main.flash(180, reason === "win" ? 0 : 255, reason === "win" ? 255 : 0, 80);

    const data: EndData = {
      reason,
      score: this.score.score,
      timeMs: Math.max(0, this.time.now - this.startTime - this.pausedTotal),
    };
    // Wygrana: od razu na ekran końcowy (bez ryzyka, że timer opóźnienia nie odpali).
    if (reason === "win") {
      this.scene.start("EndScene", data);
      return;
    }
    this.time.delayedCall(220, () => this.scene.start("EndScene", data));
  }
}
