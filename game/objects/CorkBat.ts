import Phaser from 'phaser';
import Enemy from './Enemy';
import { fitSprite, DISPLAY_H } from '../config/fit';

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
    fitSprite(this, DISPLAY_H.cork_bat, 34, 22, 'center');
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
