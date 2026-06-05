import Phaser from 'phaser';
import Enemy from './Enemy';

/**
 * Barrel Roller — rolls back and forth between two x bounds. Cannot be stomped
 * or corked. A *cracked* barrel can be destroyed by dashing through it.
 */
export default class BarrelRoller extends Enemy {
  private minX: number;
  private maxX: number;
  private dir = 1;
  private speed = 90;

  constructor(scene: Phaser.Scene, x: number, y: number, range = 120, cracked = false) {
    super(scene, x, y, cracked ? 'barrel_cracked' : 'barrel');
    this.enemyType = 'barrel';
    this.canStomp = false;     // jumping on it still hurts you
    this.corkKillable = false; // corks bounce off
    this.dashKillable = cracked;
    this.minX = x - range;
    this.maxX = x + range;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setScale(0.5); body.setSize(68, 68).setOffset(10, 8);
    body.setAllowGravity(true);
    body.setBounce(0, 0);
    if (cracked) this.setTint(0xb060d0); // purple-stained = dash-destroyable
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x <= this.minX) this.dir = 1;
    if (this.x >= this.maxX) this.dir = -1;
    body.setVelocityX(this.dir * this.speed);
    // visual roll
    this.rotation += (this.dir * this.speed * delta) / 9000;
  }
}
