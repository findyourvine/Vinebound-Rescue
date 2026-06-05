import Phaser from 'phaser';
import BaseLevelScene, { LevelMeta } from './BaseLevelScene';
import Boss, { BossPhase } from '../objects/Boss';
import * as C from '../config/constants';

/**
 * FINAL BOSS — The Grand Cru Showdown vs. The Sour Sommelier.
 *
 * Single-screen arena (no horizontal scroll). The boss is always damageable by
 * cork shots; its four phases escalate the danger:
 *   Phase 1 — aimed grape shots
 *   Phase 2 — + rolling barrels summoned from the sides
 *   Phase 3 — + grapes raining from the ceiling
 *   Phase 4 — relentless volleys ("Final Pour")
 *
 * To expand: add more attack patterns inside onPhaseChange / the spawn timers.
 */
export default class FinalBossScene extends BaseLevelScene {
  private boss!: Boss;
  private bossProjectiles!: Phaser.Physics.Arcade.Group;

  // HP bar (screen-fixed)
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private readonly hpBarW = 300;

  // phase attack timers (cleaned up on defeat)
  private barrelTimer?: Phaser.Time.TimerEvent;
  private rainTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('FinalBoss');
    this.isBossLevel = true;
  }

  getMeta(): LevelMeta {
    return {
      title: 'LEVEL 5',
      subtitle: 'THE GRAND CRU SHOWDOWN',
      worldWidth: C.GAME_WIDTH, // no scroll — fixed arena
      bg: 'bg_castle',
      tile: 'tile_castle',
      next: 'Victory',
      intro: "Buddy, I've had airport wine. I fear nothing.",
    };
  }

  buildLevel() {
    const gy = this.groundY;

    // arena floor + a few dodge platforms (handy in the "Final Pour" phase)
    this.addGround(0, C.GAME_WIDTH);
    this.addPlatform(40, gy - 150, 110, 24);
    this.addPlatform(C.GAME_WIDTH - 150, gy - 150, 110, 24);
    this.addPlatform(C.GAME_WIDTH / 2 - 55, gy - 280, 110, 24);

    // a little starting ammo
    this.addCorkRow(70, gy - 60, 4, 40);

    // boss projectile pool (grape shots + rained grapes)
    this.bossProjectiles = this.physics.add.group({ defaultKey: 'grape_shot', maxSize: 40 });

    // the Sour Sommelier
    this.boss = new Boss(this, C.GAME_WIDTH / 2, 230);
    this.boss.setTexture('boss_p1'); // phase-1 portrait
    this.boss.projectiles = this.bossProjectiles;
    this.boss.onPhaseChange = (p) => this.onPhaseChange(p);
    this.boss.onDefeated = () => this.bossDefeated();
  }

  afterCreate() {
    // cork shots damage the boss
    this.physics.add.overlap(
      this.corkShots,
      this.boss,
      (corkObj) => {
        this.killShot(corkObj as Phaser.GameObjects.GameObject);
        this.boss.hit();
      },
      undefined,
      this
    );

    // boss projectiles hurt the player
    this.physics.add.overlap(
      this.player,
      this.bossProjectiles,
      (_p, shotObj) => {
        const shot = shotObj as Phaser.Physics.Arcade.Image;
        shot.disableBody(true, true);
        this.applyDamage(this.boss.x);
      },
      undefined,
      this
    );

    this.buildHpBar();
  }

  // -------------------------------------------------------------------
  // Boss HP bar (fixed to the screen, top-center)
  // -------------------------------------------------------------------
  private buildHpBar() {
    const cx = C.GAME_WIDTH / 2;
    const y = 70;
    this.add
      .text(cx, y - 22, 'THE SOUR SOMMELIER', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e9b949',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1400);
    this.add
      .rectangle(cx, y, this.hpBarW + 6, 20, 0x1a1320, 0.85)
      .setStrokeStyle(2, 0xe9b949)
      .setScrollFactor(0)
      .setDepth(1400);
    this.hpBarFill = this.add
      .rectangle(cx - this.hpBarW / 2, y, this.hpBarW, 14, 0x9b2d3a)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1401);
  }

  // -------------------------------------------------------------------
  // Phase escalation
  // -------------------------------------------------------------------
  private onPhaseChange(phase: BossPhase) {
    // swap to the matching phase artwork from the bible
    this.boss.setTexture(`boss_p${phase}`);
    const labels: Record<BossPhase, string> = {
      1: 'VINE ATTACKS',
      2: 'BARREL CHAOS',
      3: 'EVIL GRAPE RAIN',
      4: 'THE FINAL POUR',
    };
    // quick phase banner
    const cx = C.GAME_WIDTH / 2;
    const tag = this.add
      .text(cx, 150, `PHASE ${phase}\n${labels[phase]}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#e9b949',
        align: 'center',
        backgroundColor: '#3a0d1c',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1450);
    this.tweens.add({ targets: tag, alpha: 0, delay: 1200, duration: 500, onComplete: () => tag.destroy() });

    // Phase 2+: summon rolling barrels from the sides
    if (phase >= 2 && !this.barrelTimer) {
      this.barrelTimer = this.time.addEvent({
        delay: 3200,
        loop: true,
        callback: () => {
          if (this.dead || this.complete || this.boss.dead) return;
          const fromLeft = Math.random() < 0.5;
          const x = fromLeft ? 40 : C.GAME_WIDTH - 40;
          this.addBarrel(x, this.groundY - 30, 140, Math.random() < 0.5);
        },
      });
    }

    // Phase 3+: grapes rain from the ceiling
    if (phase >= 3 && !this.rainTimer) {
      this.rainTimer = this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          if (this.dead || this.complete || this.boss.dead) return;
          this.rainGrape();
        },
      });
    }
  }

  /** Drop a single falling grape projectile from the ceiling. */
  private rainGrape() {
    const x = Phaser.Math.Between(30, C.GAME_WIDTH - 30);
    const shot = this.bossProjectiles.get(x, -10, 'grape_shot') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.setActive(true).setVisible(true);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    shot.setVelocity(Phaser.Math.Between(-40, 40), 260);
    shot.setData('dieAt', this.time.now + 4000);
  }

  // -------------------------------------------------------------------
  // Victory
  // -------------------------------------------------------------------
  private bossDefeated() {
    if (this.complete) return;
    this.complete = true;
    this.barrelTimer?.remove();
    this.rainTimer?.remove();
    this.freeze();
    this.showBanner('THE VINTAGE IS SAVED!', 'Consider yourself decanted.', () =>
      this.scene.start('Victory')
    );
  }

  // -------------------------------------------------------------------
  // Main loop: keep HP bar synced + expire boss projectiles
  // -------------------------------------------------------------------
  update(time: number) {
    super.update(time); // cork-shot expiry + player death checks

    if (this.boss && !this.boss.dead) {
      const ratio = Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
      this.hpBarFill.width = this.hpBarW * ratio;
    }

    // expire boss projectiles (grape shots + rained grapes)
    this.bossProjectiles?.getChildren().forEach((obj) => {
      const s = obj as Phaser.Physics.Arcade.Image;
      if (!s.active) return;
      if (time > (s.getData('dieAt') || 0) || s.y > C.GAME_HEIGHT + 40) {
        s.disableBody(true, true);
      }
    });
  }
}
