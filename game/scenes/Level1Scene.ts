import BaseLevelScene, { LevelMeta } from './BaseLevelScene';

/**
 * LEVEL 1 — The Mutated Vineyard ("Grape Expectations").
 * Gentle tutorial-ish level: introduces moving, jumping, stomping Sour Grapes,
 * hopping crate platforms, dodging Barrel Rollers and Vine Snappers.
 *
 * To expand: add more sections by extending the worldWidth in getMeta() and
 * appending more addGround / addPlatform / addGrape / addCork calls below.
 */
export default class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1');
  }

  getMeta(): LevelMeta {
    return {
      title: 'LEVEL 1',
      subtitle: 'GRAPE EXPECTATIONS',
      worldWidth: 3400,
      bg: 'bg_vineyard',
      tile: 'tile_vineyard',
      next: 'Level2',
      intro: 'I came for a tasting. I stayed because the grapes declared war.',
    };
  }

  buildLevel() {
    const gy = this.groundY;

    // ---------- Section 1: flat tutorial path ----------
    this.addGround(0, 700);
    this.addCorkRow(180, gy - 60, 6);
    this.addGrape(520, gy - 30);

    // ---------- Section 2: crate platforms + first barrel ----------
    this.addGround(760, 640);
    this.addPlatform(820, gy - 150, 110, 26);
    this.addPlatform(1000, gy - 240, 110, 26);
    this.addCorkArc(835, gy - 175, 4, 28, 40);
    this.addCork(1040, gy - 280);
    this.addCork(1075, gy - 280);
    this.addBarrel(1200, gy - 30, 150);

    // Rare Bottle #1 — tucked up on a high platform
    this.addPlatform(1180, gy - 330, 90, 24);
    this.addBottle(1225, gy - 360);

    // ---------- gap (pit) ----------
    // 1400 -> 1500 is open air; jump across

    // ---------- Section 3: vine rows with hidden snappers ----------
    this.addGround(1500, 720);
    this.addCheckpoint(1530);
    this.addVine(1640);
    this.addVine(1850);
    this.addCorkRow(1560, gy - 60, 4);
    this.addGrape(1760, gy - 30);
    this.addBarrel(2000, gy - 30, 120, true); // cracked → dashable

    // Rare Bottle #2 — reward for clearing the vine gauntlet, up high
    this.addPlatform(1980, gy - 250, 100, 24);
    this.addBottle(2030, gy - 280);

    // ---------- Section 4: hill section + multiple grapes ----------
    this.addGround(2300, 900);
    this.addCheckpoint(2340);
    this.addPlatform(2380, gy - 130, 130, 26);
    this.addPlatform(2560, gy - 230, 130, 26);
    this.addPlatform(2760, gy - 150, 130, 26);
    this.addGrape(2420, gy - 160);
    this.addGrape(2640, gy - 260);
    this.addGrape(2900, gy - 30);
    this.addCorkArc(2580, gy - 255, 5, 28, 45);

    // Rare Bottle #3 — risky high jump near the end
    this.addGoldenCork(2640, gy - 320); // little invincibility treat before the finish
    this.addBottle(3050, gy - 200);
    this.addPlatform(3010, gy - 170, 90, 24);

    // ---------- End: cellar door (goal) ----------
    this.addCorkRow(3150, gy - 60, 4);
    this.addGoal(3320);
  }
}
