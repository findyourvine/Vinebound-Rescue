import Phaser from 'phaser';
import { MAX_HEALTH, GAME_WIDTH, COLORS } from '../config/constants';

/**
 * Fixed (scroll-locked) heads-up display: wine-glass health, cork & bottle
 * counts, plus floating quip popups. Lives on the same scene as gameplay and
 * uses setScrollFactor(0) so it stays put as the camera scrolls.
 */
export default class Hud {
  private scene: Phaser.Scene;
  private glasses: Phaser.GameObjects.Image[] = [];
  private corkText!: Phaser.GameObjects.Text;
  private bottleText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const d = 1000;

    // health glasses
    for (let i = 0; i < MAX_HEALTH; i++) {
      const img = scene.add
        .image(20 + i * 28, 24, 'glass_full')
        .setScrollFactor(0)
        .setDepth(d)
        .setDisplaySize(20, 30);
      this.glasses.push(img);
    }

    // cork counter
    scene.add.image(22, 58, 'cork').setScrollFactor(0).setDepth(d).setDisplaySize(15, 22);
    this.corkText = scene.add
      .text(36, 50, 'x 0', { fontFamily: 'monospace', fontSize: '18px', color: '#f3e7d3' })
      .setScrollFactor(0)
      .setDepth(d);

    // bottle counter
    scene.add.image(GAME_WIDTH - 70, 24, 'bottle').setScrollFactor(0).setDepth(d).setDisplaySize(11, 31);
    this.bottleText = scene.add
      .text(GAME_WIDTH - 56, 14, '0/3', { fontFamily: 'monospace', fontSize: '18px', color: '#f3e7d3' })
      .setScrollFactor(0)
      .setDepth(d);

    // lives
    this.livesText = scene.add
      .text(GAME_WIDTH - 70, 50, '♥ x3', { fontFamily: 'monospace', fontSize: '16px', color: '#e9b949' })
      .setScrollFactor(0)
      .setDepth(d);
  }

  setHealth(h: number) {
    this.glasses.forEach((img, i) => img.setTexture(i < h ? 'glass_full' : 'glass_empty'));
  }

  setCorks(n: number) {
    this.corkText.setText('x ' + n);
  }

  setBottles(n: number, total = 3) {
    this.bottleText.setText(`${n}/${total}`);
  }

  setLives(n: number) {
    this.livesText.setText('♥ x' + n);
  }

  /** Floating quip near the player (or at a given position). */
  quip(x: number, y: number, text: string, color = '#f3e7d3') {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color,
        backgroundColor: 'rgba(26,19,32,0.6)',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1001);
    this.scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }
}
