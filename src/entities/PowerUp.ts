import Phaser from "phaser";
import { POWERUP, type PowerUpType } from "../config";
import { TEXTURE } from "../art/SpriteTextures";

const TEXTURE_FOR: Record<PowerUpType, string> = {
  packetStream: TEXTURE.puPacket,
  immunity: TEXTURE.puImmunity,
  shieldBoost: TEXTURE.puShield,
  firewallRepair: TEXTURE.puRepair,
};

/** Spadający power-up zbierany przez gracza (pooling przez grupę). */
export class PowerUp extends Phaser.Physics.Arcade.Image {
  puType: PowerUpType = "packetStream";
  private bobPhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.puPacket);
    this.setDepth(5);
  }

  spawn(type: PowerUpType, x: number, y: number): void {
    this.puType = type;
    this.setTexture(TEXTURE_FOR[type]);
    this.enableBody(true, x, y, true, true);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(12, 2, 2);
    this.bobPhase = Math.random() * Math.PI * 2;
    this.setVelocity(0, POWERUP.fallSpeed);
  }

  /** Lekkie pulsowanie, by przyciągało wzrok. */
  bob(now: number): void {
    if (!this.active) return;
    this.setScale(1 + Math.sin(now * 0.006 + this.bobPhase) * 0.12);
  }
}
