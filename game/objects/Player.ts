import Phaser from 'phaser';
import { input } from '../config/inputState';
import * as C from '../config/constants';

/**
 * The Cork Connoisseur. Reads the shared `input` state each frame and handles
 * movement, jumping, dashing, cork-shooting and taking damage. Modern platformer
 * feel: coyote time, jump buffering, variable jump height, fast-fall and a dash
 * that grants brief i-frames (a real dodge). Picks a pose texture every frame.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  facing = 1;                 // 1 = right, -1 = left
  health = C.MAX_HEALTH;
  isDashing = false;
  invulnUntil = 0;
  dashInvulnUntil = 0;

  // ---- power-up state ----
  shielded = false;           // Red Blend Shield: blocks the next hit
  speedBoostUntil = 0;        // Sparkling Boost: faster move + higher jump
  rapidUntil = 0;             // Cork Cannon: rapid cork fire

  // ---- jump-feel state ----
  baseScaleX = 1;
  baseScaleY = 1;
  private lastGroundedAt = -99999;
  private jumpBufferedUntil = 0;
  private jumpCutApplied = true;
  private wasOnGround = true;
  private prevVelY = 0;

  private dashTimer = 0;
  private dashCooldown = 0;
  private corkCooldown = 0;
  private corkPoseTimer = 0;  // keeps the cork-shot pose up briefly after firing
  private runFrameTimer = 0;
  private runFrame = false;

  /** Set by the scene so the player can spawn cork projectiles. */
  projectiles!: Phaser.Physics.Arcade.Group;
  /** Feedback hooks the scene wires to audio + juice. */
  onCork?: () => void;
  onHurt?: (health: number) => void;
  onShieldBreak?: () => void;
  onJump?: () => void;
  onLand?: (impact: number) => void;
  onDash?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(0.5);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 84).setOffset(32, 24);
    body.setMaxVelocity(C.DASH_SPEED, C.MAX_FALL_SPEED);
    // remember authored scale so squash/stretch is relative (survives art rescaling)
    this.baseScaleX = this.scaleX;
    this.baseScaleY = this.scaleY;
  }

  /** Whether the player is standing on something. */
  get onGround(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.corkCooldown = Math.max(0, this.corkCooldown - delta);
    this.corkPoseTimer = Math.max(0, this.corkPoseTimer - delta);
    const body = this.body as Phaser.Physics.Arcade.Body;

    const boosted = time < this.speedBoostUntil;
    const moveSpeed = boosted ? C.PLAYER_SPEED * 1.35 : C.PLAYER_SPEED;
    const jumpV = boosted ? C.JUMP_VELOCITY * 1.12 : C.JUMP_VELOCITY;
    const grounded = this.onGround;
    if (grounded) this.lastGroundedAt = time;

    // ---- Dash (overrides normal movement while active) ----
    if (this.isDashing) {
      this.dashTimer -= delta;
      body.setVelocityX(this.facing * C.DASH_SPEED);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.clearTint();
      }
    } else {
      // ---- Horizontal movement ----
      let vx = 0;
      if (input.left) { vx = -moveSpeed; this.facing = -1; }
      else if (input.right) { vx = moveSpeed; this.facing = 1; }
      body.setVelocityX(vx);
      this.setFlipX(this.facing < 0);

      // start a dash?
      if (input.dashQueued && this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashTimer = C.DASH_DURATION_MS;
        this.dashCooldown = C.DASH_COOLDOWN_MS;
        this.dashInvulnUntil = time + C.DASH_IFRAME_MS;
        this.setTint(0xffe08a);
        body.setVelocityY(Math.min(body.velocity.y, 0)); // little float
        this.onDash?.();
      }
    }

    // ---- Jump: buffered + coyote time ----
    if (input.jumpQueued) this.jumpBufferedUntil = time + C.JUMP_BUFFER_MS;
    const canCoyote = time - this.lastGroundedAt <= C.COYOTE_MS;
    if (!this.isDashing && time <= this.jumpBufferedUntil && (grounded || canCoyote)) {
      body.setVelocityY(jumpV);
      this.jumpBufferedUntil = 0;
      this.lastGroundedAt = -99999; // consume coyote so we can't double-jump
      this.jumpCutApplied = false;
      this.squash(this.baseScaleX * 0.82, this.baseScaleY * 1.18);
      this.onJump?.();
    }

    // ---- Variable jump height: release early → cut the rise once ----
    if (!input.jumpHeld && !this.jumpCutApplied && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * C.JUMP_CUT_MULT);
      this.jumpCutApplied = true;
    }

    // ---- Fast fall: heavier gravity on the way down ----
    body.setGravityY(body.velocity.y > 0 ? (C.FALL_GRAVITY_MULT - 1) * C.GRAVITY : 0);

    // ---- Landing detection (dust + sfx via scene) ----
    if (grounded && !this.wasOnGround) {
      const impact = this.prevVelY;
      if (impact > 250) {
        this.squash(this.baseScaleX * 1.18, this.baseScaleY * 0.82);
        this.onLand?.(impact);
      }
    }
    this.wasOnGround = grounded;
    this.prevVelY = body.velocity.y;

    // ---- Cork shot ----
    if (input.corkQueued && this.corkCooldown <= 0) {
      this.fireCork();
      this.corkCooldown = time < this.rapidUntil ? 120 : C.CORK_COOLDOWN_MS;
      this.corkPoseTimer = 200;
    }

    // consume one-shot inputs so a tap == a single action
    input.jumpQueued = false;
    input.dashQueued = false;
    input.corkQueued = false;

    // ---- Pose selection (manual; no atlas needed) ----
    if (this.isDashing) {
      this.setTexture('player_dash');
    } else if (!grounded) {
      this.setTexture(body.velocity.y < -20 ? 'player_jump' : 'player_fall');
    } else if (this.corkPoseTimer > 0) {
      this.setTexture('player_corkshot');
    } else if (Math.abs(body.velocity.x) > 10) {
      this.runFrameTimer += delta;
      if (this.runFrameTimer > 110) {
        this.runFrameTimer = 0;
        this.runFrame = !this.runFrame;
      }
      this.setTexture(this.runFrame ? 'player_run2' : 'player_run1');
    } else {
      this.setTexture('player_idle');
    }

    // ---- shield / boost tint (skip while dashing, which has its own tint) ----
    if (!this.isDashing) {
      if (this.shielded) this.setTint(0xc23b4a);
      else if (time < this.rapidUntil) this.setTint(0xe9b949);
      else if (boosted) this.setTint(0xbfe6ff);
      else this.clearTint();
    }

    // ---- i-frame blink (damage only; dash dodge is silent) ----
    if (time < this.invulnUntil) {
      this.setAlpha(Math.floor(time / 80) % 2 ? 0.35 : 1);
    } else {
      this.setAlpha(1);
    }
  }

  /** Quick squash/stretch that always settles back to the authored scale. */
  private squash(sx: number, sy: number) {
    this.scene.tweens.killTweensOf(this);
    this.setScale(sx, sy);
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScaleX,
      scaleY: this.baseScaleY,
      duration: 130,
      ease: 'Quad.out',
    });
  }

  private fireCork() {
    const cork = this.projectiles.get(
      this.x + this.facing * 16,
      this.y - 2,
      'cork_shot'
    ) as Phaser.Physics.Arcade.Image | null;
    if (!cork) return;
    cork.setActive(true).setVisible(true).setScale(0.5);
    const body = cork.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    cork.setVelocity(this.facing * C.CORK_SPEED, 0);
    cork.setFlipX(this.facing < 0);
    cork.setData('dieAt', this.scene.time.now + C.CORK_LIFETIME_MS);
    this.onCork?.();
  }

  /** Apply one hit. Returns true if the hit landed (not invulnerable/shielded/dashing). */
  takeDamage(time: number, fromX: number): boolean {
    if (time < this.invulnUntil || time < this.dashInvulnUntil || this.isDashing) return false;

    // Red Blend Shield absorbs the hit instead of costing health.
    if (this.shielded) {
      this.shielded = false;
      this.invulnUntil = time + 600;
      const body = this.body as Phaser.Physics.Arcade.Body;
      const dir = this.x < fromX ? -1 : 1;
      body.setVelocity(dir * 160, -180);
      this.onShieldBreak?.();
      return false;
    }

    this.health -= 1;
    this.invulnUntil = time + C.PLAYER_INVULN_MS;
    this.setTexture('player_hurt');
    // knockback away from the source
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = this.x < fromX ? -1 : 1;
    body.setVelocity(dir * 220, -260);
    this.onHurt?.(this.health);
    return true;
  }

  heal(amount = 1) {
    this.health = Math.min(C.MAX_HEALTH, this.health + amount);
  }

  bounce() {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(C.JUMP_VELOCITY * 0.62);
  }
}
