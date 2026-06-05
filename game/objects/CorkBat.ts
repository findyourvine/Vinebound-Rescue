import Phaser from 'phaser';
import Enemy from './Enemy';

/**
 * Cork Bat — flies in a lazy sine wave and drifts toward the player. Can be
 * stomped from above or popped with a cork. Ignores gravity.
 */
export default class CorkBat extends Enemy {
  private baseY: number;
  private t = Phaser.Math.Between(0, 1000);
  private speed = 55;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cork_bat');
    this.enemyType = 'cork_bat';
    this.canStomp = true;
    this.corkKillable = true;
    this.baseY = y;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setScale(0.5); body.setSize(68, 44).setOffset(12, 16);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    this.t += delta;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    const dir = player ? Math.sign(player.x - this.x) || 1 : -1;
    this.setFlipX(dir < 0);
    body.setVelocityX(dir * this.speed);
    // bob vertically around the spawn height
    body.setVelocityY(Math.cos(this.t / 260) * 70);
    if (this.y > this.baseY + 60) body.setVelocityY(-60);
    if (this.y < this.baseY - 60) body.setVelocityY(60);
  }
}
