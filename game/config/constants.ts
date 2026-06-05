/**
 * Central place for every gameplay tunable.
 * Tweak these to change feel without hunting through the codebase.
 */

// ---- Canvas / world ----
export const GAME_WIDTH = 480;   // logical width (portrait, scales to fit screen)
export const GAME_HEIGHT = 800;  // logical height
export const GRAVITY = 1500;

// ---- Player ----
export const MAX_HEALTH = 3;
export const PLAYER_SPEED = 235;
export const JUMP_VELOCITY = -740;   // ~182px apex — comfortably clears the 150px platform tier
export const PLAYER_INVULN_MS = 1100; // i-frames after taking a hit

// Jump feel
export const COYOTE_MS = 110;        // grace window to still jump just after leaving a ledge
export const JUMP_BUFFER_MS = 130;   // press jump slightly early and it still fires on landing
export const JUMP_CUT_MULT = 0.45;   // release jump early → shorter hop (variable height)
export const FALL_GRAVITY_MULT = 1.55; // heavier on the way down → snappy, less floaty
export const MAX_FALL_SPEED = 1300;

// Dash
export const DASH_SPEED = 560;
export const DASH_DURATION_MS = 180;
export const DASH_COOLDOWN_MS = 900;  // design doc says 3000; snappier feels better. Tweak freely.
export const DASH_IFRAME_MS = 220;    // brief invulnerability so dash works as a dodge

// Cork shot
export const CORK_SPEED = 640;
export const CORK_COOLDOWN_MS = 320;
export const CORK_LIFETIME_MS = 1400;

// ---- Economy ----
export const CORKS_PER_LIFE = 100;
export const STARTING_LIVES = 3;
export const BOTTLES_PER_LEVEL = 3;

// ---- Palette (hex numbers for Phaser) ----
export const COLORS = {
  wineDark: 0x3a0d1c,
  wine: 0x6b1f2a,
  wineLight: 0x9b2d3a,
  grape: 0x6b2d8c,
  grapeDark: 0x4a1d63,
  gold: 0xe9b949,
  cork: 0xd9a86c,
  corkDark: 0xb07d44,
  cream: 0xf3e7d3,
  skin: 0xe8b98f,
  hair: 0x4a3526,
  jeans: 0x2b3a55,
  leaf: 0x4f8f3a,
  leafDark: 0x356126,
  stone: 0x6d6f78,
  stoneDark: 0x4a4c54,
  sky1: 0x8fc6e8,
  sky2: 0xd9b38c,
  bottleGreen: 0x35663a,
  white: 0xffffff,
  black: 0x1a1320,
} as const;
