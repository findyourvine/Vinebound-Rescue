import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { gameState, resetGameState } from '../config/gameState';
import { resetInput } from '../config/inputState';
import { audio } from '../config/audio';

/**
 * Victory screen — shown after the Sour Sommelier is defeated.
 * Closing dialogue + the cheeky sequel teaser from the design doc.
 */
export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create() {
    resetInput();
    audio.stopMusic();
    audio.sfx("win");
    const vicBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_vineyard');
    vicBg.setScale(Math.max(GAME_WIDTH / vicBg.width, GAME_HEIGHT / vicBg.height));
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xe9b949, 0.12);

    this.add
      .text(GAME_WIDTH / 2, 150, 'THE VINEYARD\nIS SAVED', {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        color: '#6b1f2a',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#f3e7d3',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 240, 'The Wine Is Safe. For Now...', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#3a0d1c',
      })
      .setOrigin(0.5);

    // hero pose
    const hero = this.add.image(GAME_WIDTH / 2, 340, 'player_idle').setScale(1.3);
    this.tweens.add({ targets: hero, y: 332, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add
      .text(GAME_WIDTH / 2, 430, '"Great. Now can I finally\nhave a tasting?"', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3a0d1c',
        align: 'center',
      })
      .setOrigin(0.5);

    // run summary
    this.add
      .text(
        GAME_WIDTH / 2,
        500,
        `Total corks: ${gameState.corks}\nRare bottles rescued: ${gameState.bottles}\nLives remaining: ${gameState.lives}`,
        { fontFamily: 'monospace', fontSize: '14px', color: '#3a0d1c', align: 'center' }
      )
      .setOrigin(0.5);

    // sequel teaser
    const olive = this.add.circle(GAME_WIDTH / 2, 600, 10, 0x4f6126).setStrokeStyle(2, 0x2e3a16);
    this.add.circle(GAME_WIDTH / 2, 600, 3, 0xc0392b); // pimento "eye"
    this.tweens.add({ targets: olive, x: GAME_WIDTH / 2 + 40, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add
      .text(GAME_WIDTH / 2, 640, 'Coming Soon:\nAttack of the Cursed Charcuterie', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6b1f2a',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.button(GAME_WIDTH / 2, GAME_HEIGHT - 90, 'PLAY AGAIN', 0x4f8f3a, () => {
      resetGameState();
      this.scene.start('Menu');
    });
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
