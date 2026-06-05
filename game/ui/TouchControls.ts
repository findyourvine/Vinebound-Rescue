import Phaser from 'phaser';
import { input } from '../config/inputState';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { audio } from '../config/audio';

/**
 * Large, thumb-friendly on-screen controls plus a keyboard fallback for
 * desktop testing. Buttons write to the shared `input` state.
 *
 *   Bottom-left : ◀ ▶ movement pads
 *   Bottom-right: JUMP (hold for higher) / POP (cork) / DASH
 */
export default class TouchControls {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.addPointer(3); // allow several simultaneous touches
    audio.unlock();

    const y = GAME_HEIGHT - 92;
    // ---- Movement pads (held) ----
    this.holdButton(60, y, 70, '◀', () => (input.left = true), () => (input.left = false));
    this.holdButton(146, y, 70, '▶', () => (input.right = true), () => (input.right = false));

    // ---- Action buttons ----
    // JUMP is hold-aware (tap = short hop, hold = full jump)
    this.jumpButton(GAME_WIDTH - 64, y, 76, 'JUMP', COLORS.leaf);
    this.tapButton(GAME_WIDTH - 142, y - 26, 58, 'POP', COLORS.cork, () => (input.corkQueued = true), 'cork');
    this.tapButton(GAME_WIDTH - 120, y + 46, 56, 'DASH', COLORS.grape, () => (input.dashQueued = true), 'dash');

    this.setupKeyboard();
  }

  private circle(x: number, y: number, r: number, color: number) {
    const c = this.scene.add.circle(x, y, r, color, 0.32).setScrollFactor(0).setDepth(2000);
    c.setStrokeStyle(2, 0xffffff, 0.5);
    return c;
  }

  private label(x: number, y: number, text: string) {
    return this.scene.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);
  }

  /** Button that fires once on press (cork / dash). */
  private tapButton(x: number, y: number, size: number, text: string, color: number, onDown: () => void, sfx?: string) {
    const r = size / 2;
    const c = this.circle(x, y, r, color);
    this.label(x, y, text);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      onDown();
      if (sfx) audio.sfx(sfx);
      c.setFillStyle(color, 0.6);
      this.scene.time.delayedCall(90, () => c.setFillStyle(color, 0.32));
    });
  }

  /** Jump: queues a jump on press AND tracks held state for variable height. */
  private jumpButton(x: number, y: number, size: number, text: string, color: number) {
    const r = size / 2;
    const c = this.circle(x, y, r, color);
    this.label(x, y, text);
    c.setInteractive({ useHandCursor: true });
    const press = () => {
      input.jumpQueued = true;
      input.jumpHeld = true;
      c.setFillStyle(color, 0.6);
    };
    const release = () => {
      input.jumpHeld = false;
      c.setFillStyle(color, 0.32);
    };
    c.on('pointerdown', press);
    c.on('pointerup', release);
    c.on('pointerout', release);
    c.on('pointerupoutside', release);
  }

  /** Button that stays active while held (left / right). */
  private holdButton(x: number, y: number, size: number, text: string, onDown: () => void, onUp: () => void) {
    const r = size / 2;
    const c = this.circle(x, y, r, 0x222831);
    this.label(x, y, text);
    c.setInteractive({ useHandCursor: true });
    const press = () => { onDown(); c.setFillStyle(0x3a4756, 0.5); };
    const release = () => { onUp(); c.setFillStyle(0x222831, 0.32); };
    c.on('pointerdown', press);
    c.on('pointerup', release);
    c.on('pointerout', release);
    c.on('pointerupoutside', release);
  }

  private setupKeyboard() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    kb.on('keydown-LEFT', () => (input.left = true));
    kb.on('keyup-LEFT', () => (input.left = false));
    kb.on('keydown-A', () => (input.left = true));
    kb.on('keyup-A', () => (input.left = false));
    kb.on('keydown-RIGHT', () => (input.right = true));
    kb.on('keyup-RIGHT', () => (input.right = false));
    kb.on('keydown-D', () => (input.right = true));
    kb.on('keyup-D', () => (input.right = false));

    const jumpDown = () => { input.jumpQueued = true; input.jumpHeld = true; };
    const jumpUp = () => { input.jumpHeld = false; };
    kb.on('keydown-UP', jumpDown); kb.on('keyup-UP', jumpUp);
    kb.on('keydown-W', jumpDown); kb.on('keyup-W', jumpUp);
    kb.on('keydown-SPACE', jumpDown); kb.on('keyup-SPACE', jumpUp);

    kb.on('keydown-F', () => { input.corkQueued = true; });
    kb.on('keydown-J', () => { input.corkQueued = true; });
    kb.on('keydown-SHIFT', () => { input.dashQueued = true; });
    kb.on('keydown-K', () => { input.dashQueued = true; });
  }
}
