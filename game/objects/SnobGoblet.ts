import Phaser from 'phaser';
import Enemy from './Enemy';
import { fitSprite, DISPLAY_H } from '../config/fit';

/**
 * Snob Goblet — a sneering wine glass that lobs splashes of bad wine at the
 * player from range. Holds its ground; stomp it or cork it (2 hits). Fires into
 * the scene's shared `enemyShots` group (wired in BaseLevelScene).
 */
export default class SnobGoblet extends Enemy {
  private fireTimer = Phaser.Math.Between(700, 1500);
  private range = 320;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'snob_goblet');
    this.enemyType = 'snob_goblet';
    this.canStomp = true;
    this.corkKillable = true;
    this.hp = 2;
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    fitSprite(this, DISPLAY_H.snob_goblet, 24, 40, 'bottom');
    this.scene.time.delayedCall(20, () => {
      (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y - 40);
    });
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    if (!player) return;
    const dx = player.x - this.x;
    this.setFlipX(dx < 0);
    if (Math.abs(dx) > this.range) return;

    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.fireTimer = Phaser.Math.Between(1400, 2200);
      this.fire(player);
    }
  }

  private fire(player: Phaser.GameObjects.Sprite) {
    const group = (this.scene as any).enemyShots as Phaser.Physics.Arcade.Group | undefined;
    if (!group) return;
    const shot = group.get(this.x, this.y - 26, 'grape_shot') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.setActive(true).setVisible(true);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    const a = Math.atan2(player.y - 26 - (this.y - 26), player.x - this.x);
    const speed = 200;
    shot.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    shot.setData('dieAt', this.scene.time.now + 3500);
  }
}
