import Phaser from 'phaser';
import Enemy from './Enemy';

/** Sour Grape — basic enemy that hops toward the player. Stomp or cork it. */
export default class SourGrape extends Enemy {
  private hopTimer = Phaser.Math.Between(300, 900);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sour_grape');
    this.enemyType = 'sour_grape';
    this.canStomp = true;
    this.corkKillable = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setScale(0.5); body.setSize(48, 48).setOffset(12, 18);
    body.setBounce(0, 0);
    body.setCollideWorldBounds(false);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    const dir = player ? Math.sign(player.x - this.x) || 1 : 1;
    this.setFlipX(dir < 0);

    if (body.blocked.down) {
      this.hopTimer -= delta;
      if (this.hopTimer <= 0) {
        this.hopTimer = Phaser.Math.Between(700, 1300);
        body.setVelocity(dir * 95, -320); // hop toward player
      } else {
        body.setVelocityX(body.velocity.x * 0.85); // settle between hops
      }
    }
  }
}
