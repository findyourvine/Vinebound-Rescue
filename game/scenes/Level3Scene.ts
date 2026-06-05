import BaseLevelScene, { LevelMeta } from './BaseLevelScene';

/**
 * LEVEL 3 — The Haunted Tasting Room ("Corked & Cursed").
 * Elegant-gone-wrong: chandeliers, spilled flights, and the air full of
 * Cork Bats. Introduces flying enemies and the ranged Snob Goblet, so cork
 * aim and timing matter more than raw platforming.
 */
export default class Level3Scene extends BaseLevelScene {
  constructor() {
    super('Level3');
  }

  getMeta(): LevelMeta {
    return {
      title: 'LEVEL 3',
      subtitle: 'CORKED & CURSED',
      worldWidth: 3700,
      bg: 'bg_tasting',
      tile: 'tile_tasting',
      next: 'Level4',
      intro: 'A haunted tasting room. The flights fly back now. Rude.',
    };
  }

  buildLevel() {
    const gy = this.groundY;

    // ---------- Section 1: bats over the bar ----------
    this.addGround(0, 720);
    this.addCorkRow(150, gy - 60, 6);
    this.addBat(420, gy - 150);
    this.addBat(600, gy - 220);
    this.addPlatform(520, gy - 140, 110, 24);

    // ---------- Section 2: snob goblet gauntlet ----------
    this.addGround(800, 620);
    this.addGoblet(900);
    this.addPlatform(980, gy - 160, 120, 24);
    this.addPlatform(1180, gy - 260, 120, 24);
    this.addCorkArc(995, gy - 185, 4, 28, 40);
    this.addBat(1120, gy - 300);

    // Rare Bottle #1 — above the goblet's line of fire
    this.addPlatform(1180, gy - 360, 90, 24);
    this.addBottle(1225, gy - 390);

    // Cork Cannon power-up to thin out the room
    this.addPowerUp(1010, gy - 200, 'pu_cork_cannon');

    // ---------- gap ----------

    // ---------- Section 3: chandelier hops + crossfire ----------
    this.addGround(1520, 700);
    this.addCheckpoint(1550);
    this.addPlatform(1600, gy - 150, 100, 24);
    this.addPlatform(1780, gy - 250, 100, 24);
    this.addPlatform(1960, gy - 150, 100, 24);
    this.addGoblet(1700);
    this.addGoblet(2080);
    this.addBat(1860, gy - 320);
    this.addCork(1820, gy - 290);
    this.addCork(1855, gy - 290);

    // Rare Bottle #2 — risky middle chandelier
    this.addBottle(1830, gy - 300);

    // ---------- Section 4: vine + bat finale ----------
    this.addGround(2380, 820);
    this.addCheckpoint(2410);
    this.addVine(2520);
    this.addVine(2760);
    this.addBat(2620, gy - 200);
    this.addBat(2900, gy - 260);
    this.addGrape(2680, gy - 30);
    this.addCorkRow(2440, gy - 60, 4);
    this.addPowerUp(2980, gy - 70, 'pu_sparkling');

    // Rare Bottle #3 — last ledge before the exit
    this.addPlatform(3080, gy - 200, 90, 24);
    this.addBottle(3125, gy - 230);
    this.addGoldenCork(3000, gy - 320);

    // ---------- End ----------
    this.addCorkRow(3300, gy - 60, 4);
    this.addGoal(3620);
  }
}
