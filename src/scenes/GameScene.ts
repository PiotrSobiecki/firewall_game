import Phaser from "phaser";
import { TEXTURE } from "../art/SpriteTextures";
import {
  COLORS,
  GAME_WIDTH,
  GAME_HEIGHT,
  SESSION_MAX_MS,
  BULLET,
  POWERUP,
  PLAYER,
  PLAYER_SHOT,
  BOSS,
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

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private space!: Phaser.Input.Keyboard.Key;

  private startTime = 0;
  private ended = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.ended = false;
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

    this.startTime = this.time.now;
    this.spawner.start(this.time.now);
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
    if (this.ended) return;
    const dtSec = delta / 1000;
    this.bg.update(dtSec);

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    this.player.drive((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));

    // ShieldBoost: większy promień + mocniejsze odbicia na czas buffa
    this.shield.setBoosted(this.powerups.isActive("shieldBoost", time));
    this.shield.update(dtSec, this.space.isDown, this.enemies, (enemy) => this.onKill(enemy));
    this.hud.setEnergy(this.shield.energyRatio, this.shield.isExhausted);

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

    // czas, combo i warunki końca zależne od wyniku/czasu (win / timeout)
    const elapsed = this.time.now - this.startTime;
    this.hud.setTime(elapsed, SESSION_MAX_MS);
    this.hud.setCombo(this.score.comboAt(time), this.score.multiplierAt(time));
    this.hud.setBuffs(this.powerups, time);
    this.spawner.update(time, elapsed);
    this.hud.setWave(this.spawner.waveNumber);
    const reason = this.run.update(this.score.score, elapsed);
    if (reason) this.end(reason);
  }

  /** Eliminacja wroga (tarcza lub strzał) → punkty (z combo) + efekty + drop. */
  private onKill(enemy: Enemy): void {
    this.score.addKill(enemy.type, this.time.now);
    this.hud.setScore(this.score.score);
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
      this.burst.explode(14, enemy.x, enemy.y);
      enemy.disableBody(true, true);
      this.score.addKill(enemy.type, this.time.now);
      this.hud.setScore(this.score.score);
      this.maybeDrop(enemy.x, enemy.y);
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
    if (Math.hypot(dx, dy) > this.shield.currentRadius) return;
    if (this.boss.hitByShield(now, this.shield.hitPower)) this.killBoss();
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
    if (this.boss.takeShot()) this.killBoss();
  }

  /** Pokonanie bossa → duży bonus + efekt. (Boss jest do minięcia.) */
  private killBoss(): void {
    if (!this.boss) return;
    const bx = this.boss.x;
    const by = this.boss.y;
    this.score.addBonus(BOSS.bonus);
    this.hud.setScore(this.score.score);
    this.burst.explode(48, bx, by);
    this.cameras.main.shake(260, 0.014);
    this.cameras.main.flash(180, 255, 0, 170);
    this.boss.destroy();
    this.boss = undefined;
  }

  /** Przejście fali → bonus punktowy + sygnalizacja. */
  private onWaveComplete(waveNumber: number): void {
    if (this.ended) return;
    this.score.addWaveBonus();
    this.hud.setScore(this.score.score);
    this.hud.flashWave(waveNumber);
  }

  private end(reason: EndData["reason"]): void {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.cameras.main.flash(180, reason === "win" ? 0 : 255, reason === "win" ? 255 : 0, 80);

    const data: EndData = {
      reason,
      score: this.score.score,
      timeMs: this.time.now - this.startTime,
    };
    this.time.delayedCall(220, () => this.scene.start("EndScene", data));
  }
}
