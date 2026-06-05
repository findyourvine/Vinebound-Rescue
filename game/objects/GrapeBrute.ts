import Phaser from 'phaser';
import Enemy from './Enemy';

/**
 * Grape Cluster Brute — a heavy mini-boss. Patrols slowly, then charges the
 * player in bursts. Too big to stomp; must be worn down with corks (5 hits).
 */
export default class GrapeBrute extends Enemy {
  private minX: number;
  private maxX: number;
  private dir = 1;
  private patrolSpeed = 38;
  private chargeCooldown = Phaser.Math.Between(1600, 2600);
  private charging = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, range = 130) {
    super(scene, x, y, 'grape_brute');
    this.enemyType = 'grape_brute';
    this.canStomp = false;   // too big to jump on — it'll hurt you
    this.corkKillable = true;
    this.dashKillable = false;
    this.hp = 5;
    this.minX = x - range;
    this.maxX = x + range;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setScale(0.5); body.setSize(72, 80).setOffset(10, 12);
    body.setAllowGravity(true);
  }

  takeCork() {
    super.takeCork();
    if (!this.dead) {
      // angrier as it loses HP
      this.scene.cameras.main.shake(40, 0.002);
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    const toPlayer = player ? Math.sign(player.x - this.x) || 1 : 1;

    if (this.charging > 0) {
      this.charging -= delta;
      body.setVelocityX(this.dir * 230);
      if (this.charging <= 0) this.chargeCooldown = Phaser.Math.Between(1800, 2800);
    } else {
      this.chargeCooldown -= delta;
      if (this.x <= this.minX) this.dir = 1;
      if (this.x >= this.maxX) this.dir = -1;
      body.setVelocityX(this.dir * this.patrolSpeed);
      // wind up a charge toward the player when reasonably close
      if (this.chargeCooldown <= 0 && player && Math.abs(player.x - this.x) < 240) {
        this.dir = toPlayer;
        this.charging = 620;
        this.scene.tweens.add({ targets: this, scaleX: 1.15, scaleY: 0.9, yoyo: true, duration: 120 });
      }
    }
    this.setFlipX(this.dir < 0);
  }
}
