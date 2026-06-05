import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from './constants';

/**
 * Generates every texture the game needs using Phaser Graphics, so the MVP is
 * fully playable with zero image assets. To use real art instead, load your
 * spritesheet in PreloadScene and keep the same texture KEYS used below
 * (e.g. 'player_idle', 'sour_grape', 'cork', 'bottle', ...).
 */
export function generateTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });

  // Skip any key that was already loaded as a real image asset in PreloadScene.
  // This lets the hand-drawn art (public/assets/*.png) win, while procedural
  // fallbacks still fill in for any key without a bundled image (tiles, goal,
  // grape_shot, the 1px particle, etc.).
  const make = (key: string, w: number, h: number, draw: () => void) => {
    if (scene.textures.exists(key)) return;
    g.clear();
    draw();
    g.generateTexture(key, w, h);
  };

  // ---------- helpers ----------
  const eyes = (cx: number, cy: number, r: number, angry = true) => {
    g.fillStyle(COLORS.white, 1);
    g.fillCircle(cx - r * 1.4, cy, r);
    g.fillCircle(cx + r * 1.4, cy, r);
    g.fillStyle(COLORS.black, 1);
    g.fillCircle(cx - r * 1.4, cy + 1, r * 0.55);
    g.fillCircle(cx + r * 1.4, cy + 1, r * 0.55);
    if (angry) {
      g.lineStyle(2, COLORS.black, 1);
      g.beginPath();
      g.moveTo(cx - r * 2.4, cy - r * 1.4);
      g.lineTo(cx - r * 0.4, cy - r * 0.4);
      g.moveTo(cx + r * 2.4, cy - r * 1.4);
      g.lineTo(cx + r * 0.4, cy - r * 0.4);
      g.strokePath();
    }
  };

  // =====================================================================
  // PLAYER — Cork Connoisseur (blazer, tee, jeans, sneakers)
  // ~32 x 48
  // =====================================================================
  const drawPlayer = (legSpread: number, armUp: boolean) => {
    // legs (jeans)
    g.fillStyle(COLORS.jeans, 1);
    g.fillRect(11 - legSpread, 30, 5, 12);
    g.fillRect(16 + legSpread, 30, 5, 12);
    // sneakers
    g.fillStyle(COLORS.white, 1);
    g.fillRect(9 - legSpread, 42, 8, 4);
    g.fillRect(15 + legSpread, 42, 8, 4);
    // tee (white)
    g.fillStyle(COLORS.cream, 1);
    g.fillRect(12, 18, 8, 13);
    // blazer (wine)
    g.fillStyle(COLORS.wine, 1);
    g.fillRect(8, 17, 6, 15);
    g.fillRect(18, 17, 6, 15);
    g.fillTriangle(8, 17, 14, 17, 8, 30);
    g.fillTriangle(24, 17, 18, 17, 24, 30);
    // arm holding glass
    g.fillStyle(COLORS.wine, 1);
    if (armUp) g.fillRect(22, 12, 4, 9);
    else g.fillRect(22, 18, 4, 9);
    // wine glass
    g.fillStyle(COLORS.white, 0.85);
    const gx = 27;
    const gy = armUp ? 9 : 15;
    g.fillCircle(gx, gy, 3.2);
    g.fillStyle(COLORS.wineLight, 1);
    g.fillCircle(gx, gy + 0.5, 2.2);
    g.fillStyle(COLORS.white, 0.85);
    g.fillRect(gx - 0.7, gy + 3, 1.4, 4);
    g.fillRect(gx - 2.5, gy + 7, 5, 1);
    // head + hair
    g.fillStyle(COLORS.skin, 1);
    g.fillCircle(16, 11, 6.5);
    g.fillStyle(COLORS.hair, 1);
    g.fillRect(9.5, 4, 13, 5);
    g.fillCircle(16, 6, 7);
    g.fillStyle(COLORS.skin, 1);
    g.fillCircle(16, 12, 6); // face below hairline
    // beard
    g.fillStyle(COLORS.hair, 1);
    g.fillRect(11, 13, 10, 3);
    // eyes
    g.fillStyle(COLORS.black, 1);
    g.fillCircle(14, 11, 1);
    g.fillCircle(18, 11, 1);
  };
  make('player_idle', 32, 48, () => drawPlayer(0, false));
  make('player_run', 32, 48, () => drawPlayer(3, true));
  make('player_jump', 32, 48, () => drawPlayer(5, true));
  make('player_hurt', 32, 48, () => {
    drawPlayer(2, false);
    g.fillStyle(COLORS.wineLight, 0.35);
    g.fillRect(0, 0, 32, 48);
  });

  // =====================================================================
  // ENEMIES
  // =====================================================================
  // Sour Grape — angry purple blob with stem
  make('sour_grape', 30, 30, () => {
    g.fillStyle(COLORS.grapeDark, 1);
    g.fillCircle(15, 17, 12);
    g.fillStyle(COLORS.grape, 1);
    g.fillCircle(15, 16, 11);
    g.fillStyle(0x8a4bb0, 0.7);
    g.fillCircle(11, 12, 3); // highlight
    eyes(15, 15, 2.4, true);
    // frown
    g.lineStyle(2, COLORS.black, 1);
    g.beginPath();
    g.arc(15, 23, 4, Math.PI * 1.15, Math.PI * 1.85, false);
    g.strokePath();
    // stem
    g.fillStyle(COLORS.leafDark, 1);
    g.fillRect(14, 1, 2, 5);
    g.fillStyle(COLORS.leaf, 1);
    g.fillTriangle(16, 3, 23, 1, 20, 6);
  });

  // Barrel Roller — wooden barrel with metal bands
  const drawBarrel = (cracked: boolean) => {
    g.fillStyle(COLORS.corkDark, 1);
    g.fillRoundedRect(2, 4, 36, 34, 7);
    g.fillStyle(COLORS.cork, 1);
    g.fillRoundedRect(5, 6, 30, 30, 5);
    // staves
    g.lineStyle(1.5, COLORS.corkDark, 0.8);
    for (let i = 10; i < 35; i += 7) {
      g.beginPath();
      g.moveTo(i, 6);
      g.lineTo(i, 36);
      g.strokePath();
    }
    // metal bands
    g.fillStyle(COLORS.stoneDark, 1);
    g.fillRect(3, 11, 34, 3);
    g.fillRect(3, 28, 34, 3);
    if (cracked) {
      g.lineStyle(2, COLORS.grape, 1);
      g.beginPath();
      g.moveTo(12, 8);
      g.lineTo(18, 18);
      g.lineTo(14, 26);
      g.lineTo(22, 34);
      g.strokePath();
      g.fillStyle(COLORS.grape, 0.4);
      g.fillCircle(20, 20, 7);
    }
    eyes(20, 20, 2.2, true);
  };
  make('barrel', 40, 40, () => drawBarrel(false));
  make('barrel_cracked', 40, 40, () => drawBarrel(true));

  // Vine Snapper — green stalk with a snapping mouth
  make('vine_snapper', 26, 46, () => {
    g.fillStyle(COLORS.leafDark, 1);
    g.fillRect(9, 14, 8, 32); // stalk
    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(10, 14, 5, 32);
    // head/mouth
    g.fillStyle(COLORS.leafDark, 1);
    g.fillCircle(13, 12, 11);
    g.fillStyle(0x9b1e2a, 1);
    g.fillCircle(13, 13, 7); // mouth
    // teeth
    g.fillStyle(COLORS.white, 1);
    for (let i = 0; i < 4; i++) g.fillTriangle(5 + i * 5, 8, 8 + i * 5, 8, 6.5 + i * 5, 13);
    for (let i = 0; i < 4; i++) g.fillTriangle(5 + i * 5, 18, 8 + i * 5, 18, 6.5 + i * 5, 13);
    eyes(13, 5, 1.8, true);
  });

  // =====================================================================
  // FINAL BOSS — The Sour Sommelier (vine-monster in a wine-red cloak)
  // ~96 x 128
  // =====================================================================
  make('boss', 96, 128, () => {
    // vine arms
    g.lineStyle(6, COLORS.leafDark, 1);
    g.beginPath();
    g.moveTo(20, 60); g.lineTo(4, 40); g.lineTo(14, 22);
    g.moveTo(76, 60); g.lineTo(92, 40); g.lineTo(82, 22);
    g.strokePath();
    // cloak
    g.fillStyle(COLORS.wineDark, 1);
    g.fillTriangle(48, 30, 10, 126, 86, 126);
    g.fillStyle(COLORS.wine, 1);
    g.fillTriangle(48, 40, 22, 126, 74, 126);
    // glowing grape heart
    g.fillStyle(COLORS.grape, 1);
    g.fillCircle(48, 82, 12);
    g.fillStyle(COLORS.gold, 0.5);
    g.fillCircle(48, 82, 7);
    // face
    g.fillStyle(0x7fae5a, 1);
    g.fillCircle(48, 30, 18);
    g.fillStyle(COLORS.grape, 1);
    eyes(48, 28, 3.2, true);
    // mouth
    g.lineStyle(3, COLORS.black, 1);
    g.beginPath();
    g.arc(48, 38, 6, Math.PI * 1.1, Math.PI * 1.9, false);
    g.strokePath();
    // crown
    g.fillStyle(COLORS.gold, 1);
    g.fillRect(34, 8, 28, 6);
    for (let i = 0; i < 4; i++) g.fillTriangle(34 + i * 9, 8, 42 + i * 9, 8, 38 + i * 9, -2);
  });

  // =====================================================================
  // PROJECTILES & COLLECTIBLES
  // =====================================================================
  make('cork', 16, 20, () => {
    g.fillStyle(COLORS.corkDark, 1);
    g.fillRoundedRect(2, 1, 12, 18, 4);
    g.fillStyle(COLORS.cork, 1);
    g.fillRoundedRect(3, 2, 10, 16, 3);
    g.lineStyle(1, COLORS.corkDark, 0.7);
    g.beginPath();
    g.moveTo(3, 7); g.lineTo(13, 7);
    g.moveTo(3, 12); g.lineTo(13, 12);
    g.strokePath();
  });

  make('cork_shot', 18, 10, () => {
    g.fillStyle(COLORS.corkDark, 1);
    g.fillRoundedRect(0, 0, 18, 10, 4);
    g.fillStyle(COLORS.cork, 1);
    g.fillRoundedRect(1, 1, 15, 8, 3);
  });

  make('grape_shot', 18, 18, () => {
    g.fillStyle(COLORS.grapeDark, 1);
    g.fillCircle(9, 9, 8);
    g.fillStyle(COLORS.grape, 1);
    g.fillCircle(9, 9, 6.5);
    g.fillStyle(0x9b2d3a, 0.6);
    g.fillCircle(6, 6, 2);
  });

  make('bottle', 22, 36, () => {
    g.fillStyle(COLORS.bottleGreen, 1);
    g.fillRoundedRect(5, 10, 12, 24, 4);
    g.fillRect(8, 2, 6, 10); // neck
    g.fillStyle(COLORS.corkDark, 1);
    g.fillRect(8, 0, 6, 3); // cork
    g.fillStyle(COLORS.cream, 1);
    g.fillRect(6, 18, 10, 10); // label
    g.fillStyle(COLORS.wine, 1);
    g.fillRect(7, 20, 8, 2);
    g.fillStyle(COLORS.gold, 0.9);
    g.fillCircle(11, 26, 2.5); // seal
  });

  // golden / sommelier cork (invincibility pickup, optional)
  make('golden_cork', 16, 20, () => {
    g.fillStyle(0xb98a1e, 1);
    g.fillRoundedRect(2, 1, 12, 18, 4);
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(3, 2, 10, 16, 3);
  });

  // =====================================================================
  // HUD — wine glass health icons
  // =====================================================================
  const drawGlass = (full: boolean) => {
    g.lineStyle(2, COLORS.cream, 1);
    // bowl
    g.beginPath();
    g.arc(13, 11, 8, 0, Math.PI, false);
    g.strokePath();
    if (full) {
      g.fillStyle(COLORS.wineLight, 1);
      g.beginPath();
      g.arc(13, 11, 6.5, 0, Math.PI, false);
      g.fillPath();
    }
    // stem + base
    g.fillStyle(COLORS.cream, 1);
    g.fillRect(12, 19, 2, 8);
    g.fillRect(7, 26, 12, 2);
  };
  make('glass_full', 26, 30, () => drawGlass(true));
  make('glass_empty', 26, 30, () => drawGlass(false));

  // =====================================================================
  // ENVIRONMENT TILES (40x40, tiled across platforms)
  // =====================================================================
  make('tile_vineyard', 40, 40, () => {
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x7a5631, 1);
    g.fillRect(0, 0, 20, 20);
    g.fillRect(20, 20, 20, 20);
    g.fillStyle(COLORS.leaf, 1);
    g.fillRect(0, 0, 40, 9);
    g.fillStyle(COLORS.leafDark, 1);
    g.fillRect(0, 7, 40, 3);
  });

  make('tile_stone', 40, 40, () => {
    g.fillStyle(COLORS.stoneDark, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(COLORS.stone, 1);
    g.fillRect(1, 1, 18, 18);
    g.fillRect(21, 21, 18, 18);
    g.fillStyle(0x5a5c64, 1);
    g.fillRect(21, 1, 18, 18);
    g.fillRect(1, 21, 18, 18);
  });

  make('tile_castle', 40, 40, () => {
    g.fillStyle(0x2c2433, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x3a3144, 1);
    g.fillRect(1, 1, 18, 18);
    g.fillRect(21, 21, 18, 18);
    g.fillStyle(0x4a3a55, 1);
    g.fillRect(21, 1, 18, 18);
    g.fillRect(1, 21, 18, 18);
  });

  // Haunted Tasting Room — polished dark wood planks
  make('tile_tasting', 40, 40, () => {
    g.fillStyle(0x2a1c16, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x3d2a20, 1);
    g.fillRect(0, 1, 40, 17);
    g.fillRect(0, 21, 40, 17);
    g.lineStyle(1.5, 0x1d130e, 0.9);
    g.beginPath();
    g.moveTo(0, 19); g.lineTo(40, 19);
    g.moveTo(0, 39); g.lineTo(40, 39);
    g.moveTo(20, 0); g.lineTo(20, 19);
    g.moveTo(10, 20); g.lineTo(10, 39);
    g.strokePath();
    g.fillStyle(0x4a3326, 0.6);
    g.fillRect(2, 3, 14, 2);
    g.fillRect(24, 24, 12, 2);
  });

  // Fermentation Caves — wet purple-stained stone
  make('tile_caves', 40, 40, () => {
    g.fillStyle(0x241726, 1);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x33203a, 1);
    g.fillRect(1, 1, 18, 18);
    g.fillRect(21, 21, 18, 18);
    g.fillStyle(0x2c1a33, 1);
    g.fillRect(21, 1, 18, 18);
    g.fillRect(1, 21, 18, 18);
    g.fillStyle(0x6b2d8c, 0.5);
    g.fillCircle(30, 10, 4); // grape-must seep
    g.fillStyle(0x8a4bb0, 0.4);
    g.fillCircle(9, 30, 3);
  });

  // Goal door / cellar entrance
  make('goal', 56, 80, () => {
    g.fillStyle(COLORS.corkDark, 1);
    g.fillRoundedRect(0, 6, 56, 74, 6);
    g.fillStyle(0x3a2a1a, 1);
    g.fillRoundedRect(6, 12, 44, 68, 6);
    g.lineStyle(2, COLORS.cork, 1);
    g.beginPath();
    g.moveTo(28, 12); g.lineTo(28, 80);
    g.strokePath();
    g.fillStyle(COLORS.gold, 1);
    g.fillCircle(22, 46, 3);
    g.fillCircle(34, 46, 3);
    // arch sign
    g.fillStyle(COLORS.leafDark, 1);
    g.fillRect(0, 0, 56, 8);
  });

  // 1x1 white pixel for tinted rectangles / particles
  make('px', 4, 4, () => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
  });

  g.destroy();

  // ---------------------------------------------------------------
  // Parallax background gradients (rendered to RenderTextures)
  // ---------------------------------------------------------------
  makeGradientBg(scene, 'bg_vineyard', [0x9ed0f0, 0xd7e9b0, 0xcdb27e]);
  makeGradientBg(scene, 'bg_cellar', [0x241926, 0x3a2336, 0x4a2336]);
  makeGradientBg(scene, 'bg_castle', [0x140a1e, 0x2a1336, 0x4a1230]);
}

/** Builds a soft vertical gradient texture for level backgrounds. */
function makeGradientBg(scene: Phaser.Scene, key: string, colors: number[]) {
  if (scene.textures.exists(key)) return; // real scene art already loaded
  const w = GAME_WIDTH;
  const h = GAME_HEIGHT;
  const rt = scene.add.renderTexture(0, 0, w, h).setVisible(false);
  const g = scene.make.graphics({ x: 0, y: 0 });
  const bands = h;
  for (let y = 0; y < bands; y++) {
    const t = y / bands;
    // simple 3-stop blend
    let col: number;
    if (t < 0.5) col = blend(colors[0], colors[1], t / 0.5);
    else col = blend(colors[1], colors[2], (t - 0.5) / 0.5);
    g.fillStyle(col, 1);
    g.fillRect(0, y, w, 1);
  }
  rt.draw(g);
  rt.saveTexture(key);
  g.destroy();
  rt.destroy();
}

function blend(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const gg = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (gg << 8) | bl;
}
