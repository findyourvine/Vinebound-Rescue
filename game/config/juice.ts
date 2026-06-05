import Phaser from 'phaser';

/**
 * Game-feel helpers shared by every scene: particle bursts, screen flash,
 * brief hit-stop, and a quick scale "punch". Uses the tiny procedural 'px'
 * texture so it needs no art.
 *
 * IMPORTANT: every method is fully guarded. An uncaught error inside a Phaser
 * collision/update callback silently kills the render loop while WebAudio keeps
 * playing — i.e. the game "freezes" with sound still going. A cosmetic effect
 * must never be able to do that, so all of this is wrapped in try/catch.
 *
 * Bursts use a short-lived emitter with the colour baked into its config and a
 * one-shot `explode()` — this avoids mutating a shared emitter (the source of
 * the original POP-button freeze) and works reliably on Phaser 3.80.
 */
export class Juice {
  private scene: Phaser.Scene;
  private hasPx: boolean;
  private stopUntil = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.hasPx = (() => {
      try {
        return scene.textures.exists('px');
      } catch {
        return false;
      }
    })();
  }

  private explode(x: number, y: number, color: number, count: number, speed: number) {
    if (!this.hasPx) return;
    try {
      const e = this.scene.add
        .particles(x, y, 'px', {
          lifespan: 420,
          speed: { min: speed * 0.25, max: speed },
          angle: { min: 0, max: 360 },
          scale: { start: 2.2, end: 0 },
          gravityY: 500,
          tint: color,
          emitting: false,
        })
        .setDepth(900);
      e.explode(count, x, y);
      this.scene.time.delayedCall(700, () => {
        try { e.destroy(); } catch { /* scene gone */ }
      });
    } catch {
      /* never break the loop for a cosmetic effect */
    }
  }

  /** Coloured particle burst at a world point. */
  burst(x: number, y: number, color: number, count = 12) {
    this.explode(x, y, color, count, 240);
  }

  /** Small dust puff (landing / dash). */
  dust(x: number, y: number, color = 0xf3e7d3) {
    this.explode(x, y, color, 6, 120);
  }

  /** Brief whole-screen colour flash (e.g. on taking damage). */
  flash(color = 0xffffff, _alpha = 0.35, duration = 120) {
    try {
      this.scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
    } catch {
      /* ignore */
    }
  }

  /** Pop a game object's scale for a chunky "hit" feel. */
  punch(obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, amount = 1.25) {
    try {
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
    } catch {
      /* ignore */
    }
  }

  /**
   * Freeze-frame for a few ms to sell an impact. Slows only the physics world
   * (arcade: higher timeScale = slower) and restores it on a wall-clock timer
   * so it can never deadlock the scene's own timers.
   */
  hitstop(ms = 55) {
    try {
      const now = performance.now();
      if (now < this.stopUntil) return;
      this.stopUntil = now + ms;
      this.scene.physics.world.timeScale = 4;
      window.setTimeout(() => {
        try { this.scene.physics.world.timeScale = 1; } catch { /* scene gone */ }
      }, ms);
    } catch {
      /* ignore */
    }
  }
}
