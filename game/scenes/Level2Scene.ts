import BaseLevelScene, { LevelMeta } from './BaseLevelScene';

/**
 * LEVEL 2 — The Barrel Cellar ("Barrelly Surviving").
 * Darker, more vertical, barrel-heavy. Emphasizes cork shots, dashing through
 * cracked barrels, and jumping between stacked-barrel platforms.
 *
 * To expand: drop in moving platforms or new enemy types here; the base class
 * already wires collisions for anything added via the addX helpers.
 */
export default class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2');
  }

  getMeta(): LevelMeta {
    return {
      title: 'LEVEL 2',
      subtitle: 'BARRELLY SURVIVING',
      worldWidth: 3600,
      bg: 'bg_cellar',
      tile: 'tile_stone',
      next: 'Level3',
      intro: 'The infection reached the barrel room. That explains the screaming oak notes.',
    };
  }

  buildLevel() {
    const gy = this.groundY;

    // ---------- Section 1: entry + cork practice ----------
    this.addGround(0, 760);
    this.addCorkRow(160, gy - 60, 6);
    this.addVine(420);
    this.addGrape(620, gy - 30);

    // ---------- Section 2: stacked barrel platforms ----------
    this.addGround(820, 560);
    this.addPlatform(840, gy - 140, 100, 26);
    this.addPlatform(1000, gy - 250, 100, 26);
    this.addPlatform(1160, gy - 150, 100, 26);
    this.addCork(1030, gy - 290);
    this.addCork(1065, gy - 290);
    this.addBarrel(900, gy - 30, 120);

    // Rare Bottle #1 — high on the barrel stack
    this.addPlatform(1040, gy - 360, 90, 24);
    this.addBottle(1085, gy - 390);

    // ---------- gap ----------
    // 1380 -> 1480 open

    // ---------- Section 3: cracked-barrel dash hallway ----------
    this.addGround(1480, 760);
    this.addCheckpoint(1510);
    this.addBarrel(1620, gy - 30, 90, true);  // cracked
    this.addBarrel(1860, gy - 30, 90, true);  // cracked
    this.addBarrel(2080, gy - 30, 110);        // solid → must jump
    this.addCorkRow(1520, gy - 70, 3);
    this.addVine(1980);

    // ---------- Section 4: vertical climb (hidden bottle behind high jumps) ----------
    this.addGround(2340, 540);
    this.addPlatform(2360, gy - 130, 110, 26);
    this.addPlatform(2520, gy - 240, 110, 26);
    this.addPlatform(2680, gy - 350, 110, 26);
    this.addGoldenCork(2735, gy - 390); // invincibility before the final push
    this.addCorkArc(2530, gy - 265, 4, 28, 40);
    this.addGrape(2420, gy - 160);

    // Rare Bottle #2 — top of the climb
    this.addPlatform(2520, gy - 460, 90, 24);
    this.addBottle(2565, gy - 490);

    // ---------- gap ----------

    // ---------- Section 5: fast rolling-barrel run to the exit ----------
    this.addGround(2960, 640);
    this.addCheckpoint(2990);
    this.addBarrel(3060, gy - 30, 140);
    this.addBarrel(3260, gy - 30, 140, true);
    this.addGrape(3160, gy - 30);
    this.addCorkRow(3000, gy - 70, 4);

    // Rare Bottle #3 — last-chance grab on a ledge by the door
    this.addPlatform(3360, gy - 170, 90, 24);
    this.addBottle(3405, gy - 200);

    // ---------- End: cellar exit (goal) ----------
    this.addGoal(3540);
  }
}
