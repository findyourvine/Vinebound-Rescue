import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { gameState, resetGameState } from '../config/gameState';
import { resetInput } from '../config/inputState';
import { audio } from '../config/audio';

/**
 * Game Over screen — shown when the player runs out of lives.
 * Offers a retry (fresh run from Level 1) or back to the menu.
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    resetInput();
    audio.stopMusic();
    audio.sfx("lose");
    const goBg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_castle')
      .setTint(0x884455);
    goBg.setScale(Math.max(GAME_WIDTH / goBg.width, GAME_HEIGHT / goBg.height));
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1320, 0.55);

    this.add
      .text(GAME_WIDTH / 2, 220, 'TERRIBLE\nVINTAGE', {
        fontFamily: 'Georgia, serif',
        fontSize: '46px',
        color: '#e9b949',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#3a0d1c',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 320, '"That was a terrible vintage."', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f3e7d3',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 380, `Corks collected this run: ${gameState.corks}\nRare bottles rescued: ${gameState.bottles}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f3e7d3',
        align: 'center',
      })
      .setOrigin(0.5);

    // sad little player sprite
    this.add.image(GAME_WIDTH / 2, 470, 'player_hurt').setScale(1.2).setAngle(-12);

    this.button(GAME_WIDTH / 2, 560, 'TRY AGAIN', 0x4f8f3a, () => {
      resetGameState();
      this.scene.start('Level1');
    });
    this.button(GAME_WIDTH / 2, 625, 'MAIN MENU', 0x6b1f2a, () => this.scene.start('Menu'));
  }

  private button(x: number, y: number, label: string, color: number, onClick: () => void) {
    const w = 230, h = 50;
    const rect = this.add.rectangle(x, y, w, h, color, 0.95).setStrokeStyle(3, 0xf3e7d3);
    const txt = this.add
      .text(x, y, label, { fontFamily: 'monospace', fontSize: '20px', color: '#f3e7d3' })
      .setOrigin(0.5);
    rect.setInteractive({ useHandCursor: true });
    rect.on('pointerover', () => rect.setScale(1.05));
    rect.on('pointerout', () => rect.setScale(1));
    rect.on('pointerdown', () => {
      this.tweens.add({ targets: [rect, txt], scale: 0.95, yoyo: true, duration: 80, onComplete: onClick });
    });
  }
}
