import Phaser from "phaser";
import {
  COLORS,
  VIRUS,
  TROJAN,
  WORM,
  SPYWARE,
  BOUNCES,
  SHIELD,
  GAME_WIDTH,
  type EnemyType,
} from "../config";
import { TEXTURE } from "../art/SpriteTextures";

/** Konfiguracja bazowa wroga wg typu (przed skalowaniem trudnością). */
interface TypeConfig {
  texture: string;
  speed: number;
  contactDamage: number;
  bounces: number;
  hitbox: { r: number; ox: number; oy: number };
  scale: number;
}

const CONFIG: Record<EnemyType, TypeConfig> = {
  virus: {
    texture: TEXTURE.virus,
    speed: VIRUS.speed,
    contactDamage: VIRUS.contactDamage,
    bounces: BOUNCES.virus,
    hitbox: { r: 10, ox: 6, oy: 6 },
    scale: 1,
  },
  trojan: {
    texture: TEXTURE.trojan,
    speed: TROJAN.speed,
    contactDamage: TROJAN.contactDamage,
    bounces: BOUNCES.trojan,
    hitbox: { r: 18, ox: 4, oy: 4 },
    scale: 1,
  },
  worm: {
    texture: TEXTURE.worm,
    speed: WORM.speed,
    contactDamage: WORM.contactDamage,
    bounces: BOUNCES.worm,
    hitbox: { r: 9, ox: 9, oy: 9 },
    scale: 1,
  },
  spyware: {
    texture: TEXTURE.spyware,
    speed: SPYWARE.speed,
    contactDamage: SPYWARE.contactDamage,
    bounces: BOUNCES.spyware,
    hitbox: { r: 12, ox: 6, oy: 6 },
    scale: 1,
  },
};

export type ShieldHit = "none" | "bounced" | "killed";

/**
 * Wróg malware sterowany typem (jeden pool dla wszystkich). Zachowanie per typ:
 *  - virus   — prosto w dół (lekkie kołysanie wizualne),
 *  - trojan  — wolny, okresowo szarżuje w stronę gracza,
 *  - worm    — tor sinusoidalny w poziomie,
 *  - spyware — wolny, strzela pakietami w dół.
 * Tarcza nie rani ciągle — ODBIJA: każde wejście w tarczę (z cooldownem) to
 * jedno odbicie; wróg odlatuje i przez chwilę nie steruje sobą. Po wyczerpaniu
 * puli odbić ginie (punkty).
 */
export class Enemy extends Phaser.Physics.Arcade.Image {
  type: EnemyType = "virus";
  contactDamage = 0;

  private baseSpeed = 0;
  private spawnX = 0;
  private spawnAtMs = 0;
  private pushedUntil = 0;
  private bouncesLeft = 1;
  private bounceCdUntil = 0;
  private dying = false;
  private wobblePhase = 0;
  // trojan
  private nextChargeAt = 0;
  private chargeEndAt = 0;
  // spyware
  private nextFireAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.virus);
    this.setDepth(4);
  }

  /** (Re)inicjalizacja z poola; mnożnik prędkości ze ścieżki trudności. */
  spawn(type: EnemyType, x: number, y: number, speedMult: number, now: number): void {
    const c = CONFIG[type];
    this.type = type;
    this.contactDamage = c.contactDamage;
    this.setTexture(c.texture);
    this.enableBody(true, x, y, true, true);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(c.hitbox.r, c.hitbox.ox, c.hitbox.oy);

    this.bouncesLeft = c.bounces;
    this.baseSpeed = c.speed * speedMult;
    this.spawnX = x;
    this.spawnAtMs = now;
    this.pushedUntil = 0;
    this.bounceCdUntil = 0;
    this.dying = false;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.nextChargeAt = now + TROJAN.chargeEveryMs;
    this.chargeEndAt = 0;
    this.nextFireAt = now + SPYWARE.fireEveryMs;

    this.clearTint();
    this.setScale(c.scale);
    this.setAngle(0);
    this.setVelocity(0, this.baseSpeed);
  }

  /**
   * Rejestruje kontakt z aktywną tarczą w chwili `now`. Z cooldownem, by jedno
   * przejście liczyło się jako jedno odbicie. Zwraca efekt: brak / odbicie / śmierć.
   */
  hitByShield(now: number, power = 1): ShieldHit {
    if (this.dying || now < this.bounceCdUntil) return "none";
    this.bounceCdUntil = now + SHIELD.bounceCooldownMs;
    this.pushedUntil = now + SHIELD.bounceCooldownMs;
    this.bouncesLeft -= power;
    // błysk informujący o odbiciu (odrzut nadaje ShieldSystem w obu przypadkach)
    this.setTint(COLORS.cyan);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });
    if (this.bouncesLeft <= 0) {
      this.dying = true; // odlatuje jeszcze chwilę, dopiero potem znika (patrz GameScene)
      return "killed";
    }
    return "bounced";
  }

  /** Trafienie pociskiem gracza (PacketStream). Zwraca true, gdy eliminuje wroga. */
  takeShot(power = 1): boolean {
    if (this.dying) return false;
    this.bouncesLeft -= power;
    this.setTint(COLORS.cyan);
    this.scene.time.delayedCall(60, () => {
      if (this.active && !this.dying) this.clearTint();
    });
    if (this.bouncesLeft <= 0) {
      this.dying = true;
      return true;
    }
    return false;
  }

  /**
   * Ruch/atak wg typu. `fire` wywoływane przez Spyware z pozycją pocisku.
   * Zwraca bez ingerencji w prędkość, gdy wróg jest właśnie odbity.
   */
  behave(now: number, player: Phaser.Math.Vector2, fire: (x: number, y: number) => void): void {
    if (!this.active) return;
    if (now < this.pushedUntil) return;
    const t = (now - this.spawnAtMs) / 1000;

    switch (this.type) {
      case "virus":
        this.setVelocity(0, this.baseSpeed);
        this.setScale(1 + Math.sin(now * 0.004 + this.wobblePhase) * 0.06);
        this.setAngle(Math.sin(now * 0.005 + this.wobblePhase) * 8);
        break;

      case "worm": {
        const x = this.spawnX + Math.sin(t * WORM.freqHz * Math.PI * 2) * WORM.amplitude;
        this.x = Phaser.Math.Clamp(x, 16, GAME_WIDTH - 16);
        this.setVelocityY(this.baseSpeed);
        this.setAngle(Math.cos(t * WORM.freqHz * Math.PI * 2) * 18);
        break;
      }

      case "trojan":
        if (now >= this.chargeEndAt && now >= this.nextChargeAt) {
          this.chargeEndAt = now + TROJAN.chargeDurationMs;
          this.nextChargeAt = now + TROJAN.chargeEveryMs;
        }
        if (now < this.chargeEndAt) {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const inv = 1 / (Math.hypot(dx, dy) || 1);
          this.setVelocity(dx * inv * TROJAN.chargeSpeed, dy * inv * TROJAN.chargeSpeed);
          this.setTint(COLORS.magenta);
        } else {
          this.setVelocity(0, this.baseSpeed);
          this.clearTint();
        }
        break;

      case "spyware":
        this.setVelocity(0, this.baseSpeed);
        if (now >= this.nextFireAt) {
          this.nextFireAt = now + SPYWARE.fireEveryMs;
          fire(this.x, this.y + 14);
        }
        break;
    }
  }
}
