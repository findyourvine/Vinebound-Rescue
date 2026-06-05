import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { resetGameState } from '../config/gameState';
import { resetInput } from '../config/inputState';
import { audio } from '../config/audio';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    resetInput();
    audio.unlock();
    audio.startMusic("menu");
    const menuBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_vineyard');
    menuBg.setScale(Math.max(GAME_WIDTH / menuBg.width, GAME_HEIGHT / menuBg.height));

    // decorative drifting grapes
    for (let i = 0; i < 6; i++) {
      const grape = this.add
        .image(Phaser.Math.Between(20, GAME_WIDTH - 20), Phaser.Math.Between(120, GAME_HEIGHT - 120), 'sour_grape')
        .setAlpha(0.5)
        .setScale(0.4);
      this.tweens.add({
        targets: grape,
        y: grape.y - 20,
        duration: Phaser.Math.Between(1600, 2600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // title logo (sliced from the art bible)
    this.add
      .image(GAME_WIDTH / 2, 150, 'logo')
      .setScale(Math.min(0.625, (GAME_WIDTH - 40) / 648));
    this.add
      .text(GAME_WIDTH / 2, 280, 'Save the vineyard. Dodge the grapes.\nProtect the pour.', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#3a0d1c',
        align: 'center',
      })
      .setOrigin(0.5);

    // Cork Connoisseur portrait
    this.add.image(GAME_WIDTH / 2, 400, 'player_idle').setScale(1.2);

    this.button(GAME_WIDTH / 2, 500, 'START GAME', 0x4f8f3a, () => {
      resetGameState();
      this.scene.start('Level1');
    });
    this.button(GAME_WIDTH / 2, 565, 'HOW TO PLAY', 0x6b1f2a, () => this.scene.start('HowToPlay'));

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Wine knowledge optional. Survival recommended.', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3a0d1c',
      })
      .setOrigin(0.5);
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
      audio.sfx('ui');
      this.tweens.add({ targets: [rect, txt], scale: 0.95, yoyo: true, duration: 80, onComplete: onClick });
    });
  }
}
