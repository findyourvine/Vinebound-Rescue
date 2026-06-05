import BaseLevelScene, { LevelMeta } from './BaseLevelScene';

/**
 * LEVEL 4 — The Fermentation Caves ("Must Get Out").
 * Deep, purple-stained and dangerous. Introduces the tanky Moldy Cheese Slime
 * and the charging Grape Cluster Brute mini-boss. The new Red Blend Shield and
 * Cheese Plate Heal power-ups help you survive the run to the castle gate.
 */
export default class Level4Scene extends BaseLevelScene {
  constructor() {
    super('Level4');
  }

  getMeta(): LevelMeta {
    return {
      title: 'LEVEL 4',
      subtitle: 'MUST GET OUT',
      worldWidth: 4000,
      bg: 'bg_caves',
      tile: 'tile_caves',
      next: 'FinalBoss',
      intro: 'Fermentation caves. Everything down here is aging badly — including me.',
    };
  }

  buildLevel() {
    const gy = this.groundY;

    // ---------- Section 1: slimes in the must ----------
    this.addGround(0, 760);
    this.addCorkRow(150, gy - 60, 6);
    this.addCheese(480, gy - 30, 90);
    this.addBat(640, gy - 200);
    this.addPowerUp(360, gy - 70, 'pu_shield');

    // ---------- Section 2: tanky climb ----------
    this.addGround(860, 620);
    this.addPlatform(900, gy - 150, 110, 24);
    this.addPlatform(1080, gy - 250, 110, 24);
    this.addPlatform(1260, gy - 150, 110, 24);
    this.addCheese(1080, gy - 280, 50);
    this.addGoblet(960);
    this.addCorkArc(915, gy - 175, 4, 28, 40);

    // Rare Bottle #1 — top of the climb
    this.addPlatform(1080, gy - 360, 90, 24);
    this.addBottle(1125, gy - 390);

    // ---------- gap ----------

    // ---------- Section 3: the Grape Cluster Brute ----------
    this.addGround(1580, 820);
    this.addCheckpoint(1610);
    this.addBrute(1980, gy - 30, 150);          // mini-boss arena
    this.addCorkRow(1620, gy - 60, 5);
    this.addPowerUp(1650, gy - 70, 'pu_cheese');
    this.addPowerUp(2300, gy - 70, 'pu_cork_cannon');

    // Rare Bottle #2 — reward for beating the brute
    this.addPlatform(2360, gy - 200, 90, 24);
    this.addBottle(2405, gy - 230);

    // ---------- Section 4: cracked-barrel + slime dash run ----------
    this.addGround(2560, 760);
    this.addBarrel(2700, gy - 30, 90, true);
    this.addCheese(2900, gy - 30, 80);
    this.addBarrel(3080, gy - 30, 100);
    this.addVine(3000);
    this.addBat(2820, gy - 230);
    this.addCorkRow(2600, gy - 70, 4);

    // ---------- Section 5: final push to the castle gate ----------
    this.addGround(3420, 580);
    this.addCheckpoint(3450);
    this.addPlatform(3460, gy - 150, 110, 24);
    this.addPlatform(3620, gy - 260, 110, 24);
    this.addGoblet(3540);
    this.addGoldenCork(3680, gy - 300);

    // Rare Bottle #3 — last grab before the boss
    this.addBottle(3760, gy - 230);
    this.addPlatform(3720, gy - 200, 90, 24);

    this.addCorkRow(3840, gy - 60, 3);
    this.addGoal(3940);
  }
}
