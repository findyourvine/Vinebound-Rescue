import Phaser from 'phaser';
import { generateTextures } from '../config/textures';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

/**
 * Loads the hand-drawn art (sliced from the Cork Connoisseur art bible and
 * stored in /public/assets), then calls generateTextures() to fill in any
 * remaining keys procedurally (tiles, goal door, boss grape shot, particles).
 *
 * Because generateTextures() skips keys that already exist, every bundled
 * image wins and the procedural code only covers the gaps.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const img = (key: string) => this.load.image(key, `/assets/${key}.png`);

    // a tiny loading line
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Uncorking the vineyard…', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f3e7d3',
      })
      .setOrigin(0.5);

    // ---- player poses ----
    [
      'player_idle', 'player_run1', 'player_run2', 'player_jump',
      'player_fall', 'player_dash', 'player_corkshot', 'player_hurt',
    ].forEach(img);

    // ---- enemies ----
    [
      'sour_grape', 'barrel', 'barrel_cracked', 'vine_snapper',
      'cork_bat', 'cheese_slime', 'snob_goblet', 'grape_brute',
    ].forEach(img);

    // ---- boss + four phases ----
    ['boss', 'boss_p1', 'boss_p2', 'boss_p3', 'boss_p4'].forEach(img);

    // ---- collectibles, power-ups, projectiles, effects ----
    [
      'cork', 'golden_cork', 'bottle', 'cork_shot',
      'fx_splat', 'fx_sparkle',
      'pu_sommelier', 'pu_cork_cannon', 'pu_sparkling', 'pu_shield', 'pu_cheese',
    ].forEach(img);

    // ---- UI ----
    ['glass_full', 'glass_empty', 'logo'].forEach(img);

    // ---- scene backgrounds ----
    ['bg_vineyard', 'bg_cellar', 'bg_tasting', 'bg_caves', 'bg_castle'].forEach(img);
  }

  create() {
    // Procedural fallbacks for any key without a bundled image
    // (tiles, goal, grape_shot, px). Existing keys are skipped.
    generateTextures(this);

    // 2-frame run cycle for the player (run1 ⇄ run2)
    if (!this.anims.exists('player_run_anim')) {
      this.anims.create({
        key: 'player_run_anim',
        frames: [{ key: 'player_run1' }, { key: 'player_run2' }],
        frameRate: 9,
        repeat: -1,
      });
    }

    this.time.delayedCall(200, () => this.scene.start('Menu'));
  }
}
