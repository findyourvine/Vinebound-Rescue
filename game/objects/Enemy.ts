import Phaser from 'phaser';

/**
 * Base class shared by every walking/lurking enemy. Subclasses set the flags
 * (canStomp, corkKillable, dashKillable) and implement their own movement in
 * `preUpdate`.
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  enemyType = 'enemy';
  canStomp = true;      // can the player defeat it by jumping on top?
  corkKillable = true;  // does a cork shot hurt it?
  dashKillable = false; // can the player destroy it by dashing through?
  touchDamage = 1;
  hp = 1;
  dead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(8);
  }

  /** Reduce HP from a cork hit. */
  takeCork() {
    if (this.dead) return;
    this.hp -= 1;
    this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, duration: 60 });
    if (this.hp <= 0) this.defeat();
  }

  /** Defeat with a little squish, award score, then remove. */
  defeat() {
    if (this.dead) return;
    this.dead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
    this.scene.events.emit('enemy-defeated', this);
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.1,
      scaleX: 1.4,
      alpha: 0,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}
