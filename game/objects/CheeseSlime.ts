import Phaser from 'phaser';
import Enemy from './Enemy';

/**
 * Moldy Cheese Slime — slow, tanky ground crawler. Takes 3 cork hits, oozes
 * back and forth, and can still be stomped. A patient-player problem.
 */
export default class CheeseSlime extends Enemy {
  private minX: number;
  private maxX: number;
  private dir = 1;
  private speed = 32;

  constructor(scene: Phaser.Scene, x: number, y: number, range = 90) {
    super(scene, x, y, 'cheese_slime');
    this.enemyType = 'cheese_slime';
    this.canStomp = true;
    this.corkKillable = true;
    this.hp = 3; // tanky
    this.minX = x - range;
    this.maxX = x + range;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setScale(0.5); body.setSize(68, 56).setOffset(10, 20);
    body.setAllowGravity(true);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x <= this.minX) this.dir = 1;
    if (this.x >= this.maxX) this.dir = -1;
    body.setVelocityX(this.dir * this.speed);
    this.setFlipX(this.dir < 0);
    // gentle squish wobble
    this.scaleY = 1 + Math.sin(time / 220) * 0.05;
  }
}
