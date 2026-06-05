import Phaser from 'phaser';

/**
 * Game-feel helpers shared by every scene: particle bursts, screen flash,
 * brief hit-stop (freeze frame), and a quick scale "punch". Uses the tiny
 * procedural 'px' texture so it needs no art. All effects are fire-and-forget
 * and safe to call every frame.
 */
export class Juice {
  private scene: Phaser.Scene;
  private emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private stopUntil = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // a single reusable particle emitter (emitting off; we burst manually)
    if (scene.textures.exists('px')) {
      this.emitter = scene.add
        .particles(0, 0, 'px', {
          lifespan: 420,
          speed: { min: 60, max: 240 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.2, end: 0 },
          gravityY: 500,
          quantity: 0,
          emitting: false,
        })
        .setDepth(900);
    }
  }

  /** Coloured particle burst at a world point. */
  burst(x: number, y: number, color: number, count = 12) {
    if (!this.emitter) return;
    this.emitter.setParticleTint(color);
    this.emitter.emitParticleAt(x, y, count);
  }

  /** Brief whole-screen colour flash (e.g. on taking damage). */
  flash(color = 0xffffff, alpha = 0.35, duration = 120) {
    this.scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
    void alpha;
  }

  /** Pop a game object's scale for a chunky "hit" feel. */
  punch(obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, amount = 1.25) {
    const t = obj as any;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    this.scene.tweens.add({
      targets: obj,
      scaleX: sx * amount,
      scaleY: sy * (2 - amount),
      duration: 70,
      yoyo: true,
      ease: 'Quad.out',
    });
  }

  /**
   * Freeze-frame the action for a few ms to sell an impact. Slows only the
   * physics world (arcade: higher timeScale = slower) and restores it on a
   * wall-clock timer so it can never deadlock the scene's own timers.
   */
  hitstop(ms = 55) {
    const now = performance.now();
    if (now < this.stopUntil) return;
    this.stopUntil = now + ms;
    try {
      this.scene.physics.world.timeScale = 4;
    } catch {
      return;
    }
    window.setTimeout(() => {
      try {
        this.scene.physics.world.timeScale = 1;
      } catch {
        /* scene gone */
      }
    }, ms);
  }

  /** Small dust puff (landing / dash). */
  dust(x: number, y: number, color = 0xf3e7d3) {
    if (!this.emitter) return;
    this.emitter.setParticleTint(color);
    this.emitter.emitParticleAt(x, y, 6);
  }
}
