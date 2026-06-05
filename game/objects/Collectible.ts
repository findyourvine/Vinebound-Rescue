import Phaser from 'phaser';

export type CollectibleKind =
  | 'cork'
  | 'bottle'
  | 'golden_cork'
  | 'pu_cork_cannon'
  | 'pu_sparkling'
  | 'pu_shield'
  | 'pu_cheese'
  | 'pu_sommelier';

/** A floating, bobbing pickup (cork currency, rare bottle, golden cork, power-up). */
export default class Collectible extends Phaser.Physics.Arcade.Image {
  kind: CollectibleKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: CollectibleKind) {
    super(scene, x, y, kind);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setDepth(6);
    this.setScale(0.5);

    // gentle bob
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    if (kind !== 'cork') {
      scene.tweens.add({ targets: this, angle: 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }
}
