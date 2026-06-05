import Phaser from 'phaser';
import { COLORS } from '../config/constants';
import { audio } from '../config/audio';
import { fitSprite, DISPLAY_H } from '../config/fit';

export type BossPhase = 1 | 2 | 3 | 4;

/**
 * The Sour Sommelier — final boss. Always damageable by corks; its attack
 * pattern escalates across four phases keyed off remaining HP:
 *   Phase 1 (Vine Attacks)  – slow aimed grape shots
 *   Phase 2 (Barrel Chaos)  – faster shots + summons rolling barrels (scene-side)
 *   Phase 3 (Grape Rain)    – shots + grapes raining from the ceiling
 *   Phase 4 (Final Pour)    – relentless volleys
 */
export default class Boss extends Phaser.Physics.Arcade.Sprite {
  maxHp = 12;
  hp = 12;
  phase: BossPhase = 1;
  dead = false;

  /** Scene injects this group so the boss can spawn its projectiles. */
  projectiles!: Phaser.Physics.Arcade.Group;
  onPhaseChange?: (phase: BossPhase) => void;
  onDefeated?: () => void;

  private attackTimer = 1400;
  private hoverBase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
    this.hoverBase = y;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    fitSprite(this, DISPLAY_H.boss, 60, 90, 'bottom');

    // gentle hover + drift so it's a moving target
    scene.tweens.add({
      targets: this,
      y: y - 26,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    scene.tweens.add({
      targets: this,
      x: x - 110,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  /** Take a cork hit. */
  refit() { fitSprite(this, DISPLAY_H.boss, 60, 90, "bottom"); }

  hit() {
    if (this.dead) return;
    audio.sfx("bosshit");
    this.hp -= 1;
    this.scene.cameras.main.shake(120, 0.006);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.clearTint());
    this.updatePhase();
    if (this.hp <= 0) this.defeat();
  }

  private updatePhase() {
    const ratio = this.hp / this.maxHp;
    let next: BossPhase = 1;
    if (ratio <= 0.25) next = 4;
    else if (ratio <= 0.5) next = 3;
    else if (ratio <= 0.75) next = 2;
    if (next !== this.phase) {
      this.phase = next;
      this.onPhaseChange?.(next);
    }
  }

  private defeat() {
    this.dead = true;
    audio.sfx("bossdie");
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      angle: 540,
      scale: 0.1,
      alpha: 0,
      y: this.y + 120,
      duration: 1100,
      ease: 'Cubic.in',
      onComplete: () => this.onDefeated?.(),
    });
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.fireVolley();
      // faster as phases climb
      const base = [0, 1700, 1300, 1000, 700][this.phase];
      this.attackTimer = base;
    }
  }

  private fireVolley() {
    const player = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    if (!player) return;
    const count = this.phase >= 4 ? 3 : this.phase >= 2 ? 2 : 1;
    const spread = 0.18;
    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
    for (let i = 0; i < count; i++) {
      const a = baseAngle + (i - (count - 1) / 2) * spread;
      const shot = this.projectiles.get(this.x, this.y + 20, 'grape_shot') as
        | Phaser.Physics.Arcade.Image
        | null;
      if (!shot) continue;
      shot.setActive(true).setVisible(true);
      const body = shot.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.setAllowGravity(false);
      const speed = 230 + this.phase * 22;
      shot.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
      shot.setData('dieAt', this.scene.time.now + 4000);
    }
  }
}
