import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export default class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlay');
  }

  create() {
    const htpBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_cellar');
    htpBg.setScale(Math.max(GAME_WIDTH / htpBg.width, GAME_HEIGHT / htpBg.height));
    this.add
      .text(GAME_WIDTH / 2, 60, 'HOW TO PLAY', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#e9b949',
      })
      .setOrigin(0.5);

    const lines = [
      'Move through the vineyard.',
      'Collect corks (currency).',
      'Stomp Sour Grapes.',
      'Pop corks at flying / lurking enemies.',
      'Jump over (or dash through cracked) barrels.',
      'Find 3 rare bottles each level.',
      'Defeat the Sour Sommelier.',
      '',
      'CONTROLS',
      '◀ ▶  Move        JUMP  Jump / stomp',
      'POP   Cork shot   DASH  Quick dash',
      '',
      'Keyboard: Arrows/WASD, Space=Jump,',
      'F=Cork, Shift=Dash',
    ];
    this.add
      .text(GAME_WIDTH / 2, 110, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f3e7d3',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    const back = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 70, 200, 48, 0x4f8f3a, 0.95)
      .setStrokeStyle(3, 0xf3e7d3)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'BACK', { fontFamily: 'monospace', fontSize: '20px', color: '#f3e7d3' })
      .setOrigin(0.5);
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}
