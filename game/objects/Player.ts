import Phaser from 'phaser';
import { input } from '../config/inputState';
import * as C from '../config/constants';
import { fitSprite, DISPLAY_H } from '../config/fit';

const PLAYER_BODY_W = 18;
const PLAYER_BODY_H = 42;

/**
 * The Cork Connoisseur. Reads the shared `input` state each frame and handles
 * movement, jumping, dashing, cork-shooting and taking damage. Modern platformer
 * feel: coyote time, jump buffering, variable jump height, fast-fall and a dash
 * that grants brief i-frames (a real dodge). Picks a pose texture every frame and
 * refits it (the regenerated art frames vary in size) so feet stay on the floor.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  facing = 1;                 // 1 = right, -1 = left
  health = C.MAX_HEALTH;
  isDashing = false;
  invulnUntil = 0;
  dashInvulnUntil = 0;

  // ---- power-up state ----
  shielded = false;
  speedBoostUntil = 0;
  rapidUntil = 0;

  // ---- jump-feel state ----
  private lastGroundedAt = -99999;
  private jumpBufferedUntil = 0;
  private jumpCutApplied = true;
  private wasOnGround = true;
  private prevVelY = 0;

  private dashTimer = 0;
  private dashCooldown = 0;
  private corkCooldown = 0;
  private corkPoseTimer = 0;
  private runFrameTimer = 0;
  private runFrame = false;
  private pose = 'player_idle';

  projectiles!: Phaser.Physics.Arcade.Group;
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
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    fitSprite(this, DISPLAY_H.player, PLAYER_BODY_W, PLAYER_BODY_H, 'bottom');
    (this.body as Phaser.Physics.Arcade.Body).setMaxVelocity(C.DASH_SPEED, C.MAX_FALL_SPEED);
  }

  /** Switch pose texture only when it changes, refitting size + body each time. */
  private setPose(key: string) {
    if (this.pose === key) return;
    this.pose = key;
    this.setTexture(key);
    fitSprite(this, DISPLAY_H.player, PLAYER_BODY_W, PLAYER_BODY_H, 'bottom');
  }

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

    // ---- Dash ----
    if (this.isDashing) {
      this.dashTimer -= delta;
      body.setVelocityX(this.facing * C.DASH_SPEED);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.clearTint();
      }
    } else {
      let vx = 0;
      if (input.left) { vx = -moveSpeed; this.facing = -1; }
      else if (input.right) { vx = moveSpeed; this.facing = 1; }
      body.setVelocityX(vx);
      this.setFlipX(this.facing < 0);

      if (input.dashQueued && this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashTimer = C.DASH_DURATION_MS;
        this.dashCooldown = C.DASH_COOLDOWN_MS;
        this.dashInvulnUntil = time + C.DASH_IFRAME_MS;
        this.setTint(0xffe08a);
        // dash stays horizontal: cancel any downward velocity but DON'T launch up
        if (body.velocity.y > 0) body.setVelocityY(0);
        this.onDash?.();
      }
    }

    // ---- Jump: buffered + coyote time ----
    if (input.jumpQueued) this.jumpBufferedUntil = time + C.JUMP_BUFFER_MS;
    const canCoyote = time - this.lastGroundedAt <= C.COYOTE_MS;
    if (!this.isDashing && time <= this.jumpBufferedUntil && (grounded || canCoyote)) {
      body.setVelocityY(jumpV);
      this.jumpBufferedUntil = 0;
      this.lastGroundedAt = -99999;
      this.jumpCutApplied = false;
      this.onJump?.();
    }

    // ---- Variable jump height ----
    if (!input.jumpHeld && !this.jumpCutApplied && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * C.JUMP_CUT_MULT);
      this.jumpCutApplied = true;
    }

    // ---- Fast fall ----
    body.setGravityY(body.velocity.y > 0 ? (C.FALL_GRAVITY_MULT - 1) * C.GRAVITY : 0);

    // ---- Landing detection ----
    if (grounded && !this.wasOnGround) {
      const impact = this.prevVelY;
      if (impact > 250) this.onLand?.(impact);
    }
    this.wasOnGround = grounded;
    this.prevVelY = body.velocity.y;

    // ---- Cork shot ----
    if (input.corkQueued && this.corkCooldown <= 0) {
      this.fireCork();
      this.corkCooldown = time < this.rapidUntil ? 120 : C.CORK_COOLDOWN_MS;
      this.corkPoseTimer = 200;
    }

    input.jumpQueued = false;
    input.dashQueued = false;
    input.corkQueued = false;

    // ---- Pose selection ----
    if (this.isDashing) {
      this.setPose('player_dash');
    } else if (!grounded) {
      this.setPose(body.velocity.y < -20 ? 'player_jump' : 'player_fall');
    } else if (this.corkPoseTimer > 0) {
      this.setPose('player_corkshot');
    } else if (Math.abs(body.velocity.x) > 10) {
      this.runFrameTimer += delta;
      if (this.runFrameTimer > 110) {
        this.runFrameTimer = 0;
        this.runFrame = !this.runFrame;
      }
      this.setPose(this.runFrame ? 'player_run2' : 'player_run1');
    } else {
      this.setPose('player_idle');
    }

    // ---- tints ----
    if (!this.isDashing) {
      if (this.shielded) this.setTint(0xc23b4a);
      else if (time < this.rapidUntil) this.setTint(0xe9b949);
      else if (boosted) this.setTint(0xbfe6ff);
      else this.clearTint();
    }

    // ---- i-frame blink ----
    if (time < this.invulnUntil) {
      this.setAlpha(Math.floor(time / 80) % 2 ? 0.35 : 1);
    } else {
      this.setAlpha(1);
    }
  }

  private fireCork() {
    const cork = this.projectiles.get(
      this.x + this.facing * 16,
      this.y - 6,
      'cork_shot'
    ) as Phaser.Physics.Arcade.Image | null;
    if (!cork) return;
    cork.setActive(true).setVisible(true);
    const body = cork.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    fitSprite(cork, DISPLAY_H.cork_shot, 0, 0, 'full');
    body.setAllowGravity(false);
    cork.setVelocity(this.facing * C.CORK_SPEED, 0);
    cork.setFlipX(this.facing < 0);
    cork.setData('dieAt', this.scene.time.now + C.CORK_LIFETIME_MS);
    this.onCork?.();
  }

  takeDamage(time: number, fromX: number): boolean {
    if (time < this.invulnUntil || time < this.dashInvulnUntil || this.isDashing) return false;

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
    this.setPose('player_hurt');
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
