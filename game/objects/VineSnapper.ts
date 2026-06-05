import Phaser from 'phaser';
import Enemy from './Enemy';

type VineState = 'hidden' | 'warning' | 'up';

/**
 * Vine Snapper — lurks in the ground and snaps upward when the player gets
 * close (telegraphed by a brief shake). Damages on contact while up; killed by
 * a cork shot to the base. Cannot be stomped.
 */
export default class VineSnapper extends Enemy {
  private vineState: VineState = 'hidden';
  private stateTimer = 0;
  private restY: number;

  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    super(scene, x, groundY, 'vine_snapper');
    this.enemyType = 'vine_snapper';
    this.canStomp = false;
    this.corkKillable = true;
    this.setOrigin(0.5, 1); // anchored at the ground line
    this.restY = groundY;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.enterHidden();
  }

  private enterHidden() {
    this.vineState = 'hidden';
    this.stateTimer = Phaser.Math.Between(900, 1600);
    this.setScale(0.5, 0.04);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.setVisible(true);
    this.clearTint();
  }

  private enterWarning() {
    this.vineState = 'warning';
    this.stateTimer = 320;
    this.setTint(0xb6ff8a);
  }

  private enterUp() {
    this.vineState = 'up';
    this.stateTimer = 1200;
    this.clearTint();
    this.scene.tweens.add({ targets: this, scaleY: 0.5, duration: 120 });
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setSize(40, 80).setOffset(14, 12);
    this.scene.time.delayedCall(20, () => {
      (this.body as Phaser.Physics.Arcade.Body).reset(this.x, this.restY - 40);
    });
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    this.stateTimer -= delta;
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    const near = player ? Math.abs(player.x - this.x) < 110 : false;

    switch (this.vineState) {
      case 'hidden':
        if (this.stateTimer <= 0 && near) this.enterWarning();
        else if (this.stateTimer <= 0) this.stateTimer = 300; // recheck soon
        break;
      case 'warning':
        // little shake telegraph
        this.x += Math.sin(time / 30) * 0.4;
        if (this.stateTimer <= 0) this.enterUp();
        break;
      case 'up':
        if (this.stateTimer <= 0) {
          this.scene.tweens.add({
            targets: this,
            scaleY: 0.04,
            duration: 140,
            onComplete: () => this.enterHidden(),
          });
          (this.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        break;
    }
  }
}
