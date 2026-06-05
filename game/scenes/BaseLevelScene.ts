import Phaser from 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import SourGrape from '../objects/SourGrape';
import BarrelRoller from '../objects/BarrelRoller';
import VineSnapper from '../objects/VineSnapper';
import CorkBat from '../objects/CorkBat';
import CheeseSlime from '../objects/CheeseSlime';
import SnobGoblet from '../objects/SnobGoblet';
import GrapeBrute from '../objects/GrapeBrute';
import Collectible, { CollectibleKind } from '../objects/Collectible';
import Hud from '../ui/Hud';
import TouchControls from '../ui/TouchControls';
import { gameState } from '../config/gameState';
import { resetInput } from '../config/inputState';
import * as C from '../config/constants';
import { COLLECT_LINES, HURT_LINES, STOMP_LINES, BOTTLE_LINES } from '../config/lines';
import { audio } from '../config/audio';
import { Juice } from '../config/juice';

const LOOKAHEAD = 90; // camera leads this many px in the direction you face

export interface LevelMeta {
  title: string;
  subtitle: string;
  worldWidth: number;
  bg: string;
  tile: string;
  next: string;     // next scene key (ignored on boss level)
  intro?: string;   // optional Old Man Cork line
}

/**
 * Shared base for every playable level. Subclasses override `getMeta()` and
 * `buildLevel()` to lay out platforms, enemies, collectibles and the goal.
 * Everything else (physics wiring, HUD, controls, damage, lives, scrolling)
 * is handled here so levels stay tiny and readable.
 */
export default class BaseLevelScene extends Phaser.Scene {
  player!: Player;
  platforms!: Phaser.GameObjects.Group;
  enemies!: Phaser.GameObjects.Group;
  pickups!: Phaser.GameObjects.Group;
  corkShots!: Phaser.Physics.Arcade.Group;
  enemyShots!: Phaser.Physics.Arcade.Group;
  hud!: Hud;
  controls!: TouchControls;
  juice!: Juice;

  meta!: LevelMeta;
  protected bottlesThisLevel = 0;
  protected complete = false;
  protected dead = false;
  protected groundY = C.GAME_HEIGHT - 70;

  /** Override: return this level's metadata. */
  getMeta(): LevelMeta {
    return {
      title: 'LEVEL',
      subtitle: '',
      worldWidth: 2000,
      bg: 'bg_vineyard',
      tile: 'tile_vineyard',
      next: 'Menu',
    };
  }

  /** Override: place platforms / enemies / collectibles / goal. */
  buildLevel() {}

  /** Override hook called after collisions are wired (boss level uses this). */
  afterCreate() {}

  /** Set to true on the boss level so we don't require a goal door. */
  protected isBossLevel = false;

  create() {
    resetInput();
    this.complete = false;
    this.dead = false;
    this.bottlesThisLevel = 0;
    this.meta = this.getMeta();

    // --- world & background ---
    this.physics.world.setBounds(0, 0, this.meta.worldWidth, C.GAME_HEIGHT + 400);
    this.cameras.main.setBounds(0, 0, this.meta.worldWidth, C.GAME_HEIGHT);
    this.add
      .image(C.GAME_WIDTH / 2, C.GAME_HEIGHT / 2, this.meta.bg)
      .setScrollFactor(0)
      .setDepth(-10)
      .setScale(this.coverScale(this.meta.bg));

    // --- groups ---
    this.platforms = this.add.group();
    this.enemies = this.add.group();
    this.pickups = this.add.group();
    this.corkShots = this.physics.add.group({ defaultKey: 'cork_shot', maxSize: 30 });
    this.enemyShots = this.physics.add.group({ defaultKey: 'grape_shot', maxSize: 40 });

    // --- juice (particles / hitstop / flash) ---
    this.juice = new Juice(this);

    // --- player (spawn at last checkpoint reached this run, if any) ---
    const spawnX = gameState.checkpoints[this.scene.key] ?? 80;
    this.player = new Player(this, spawnX, this.groundY - 60);
    this.player.projectiles = this.corkShots;
    this.player.onShieldBreak = () => {
      audio.sfx('shield');
      this.hud.quip(this.player.x, this.player.y - 36, 'Shield held!', '#ff8a98');
    };
    this.player.onJump = () => audio.sfx('jump');
    this.player.onDash = () => {
      audio.sfx('dash');
      this.juice.dust(this.player.x, this.player.y + 24, 0xffe08a);
    };
    this.player.onLand = (impact) => {
      audio.sfx('land');
      this.juice.dust(this.player.x, this.player.y + 24);
      if (impact > 700) this.cameras.main.shake(70, 0.003);
    };
    this.player.onCork = () => {
      audio.sfx('cork');
      this.juice.dust(this.player.x + this.player.facing * 18, this.player.y - 2, 0xd9a86c);
    };

    // camera: smooth follow + deadzone so small moves don't jitter, plus look-ahead
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.1, 0.12);
    cam.setDeadzone(80, 140);
    cam.setFollowOffset(0, 60);

    // defeated enemies pop with particles + a little pop sfx
    this.events.off('enemy-defeated');
    this.events.on('enemy-defeated', (e: Enemy) => {
      this.juice.burst(e.x, e.y, 0x6b2d8c, 14);
      this.juice.hitstop(45);
      audio.sfx('pop');
    });

    audio.startMusic(this.isBossLevel ? 'boss' : 'level');

    // --- subclass layout ---
    this.buildLevel();

    // --- collisions ---
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.corkShots, this.platforms, (cork) => this.killShot(cork as any));
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitsEnemy, undefined, this);
    this.physics.add.overlap(this.corkShots, this.enemies, this.onCorkHitsEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.onCollect, undefined, this);
    this.physics.add.overlap(
      this.player,
      this.enemyShots,
      (_p, shotObj) => {
        const shot = shotObj as Phaser.Physics.Arcade.Image;
        shot.disableBody(true, true);
        this.applyDamage(shot.x);
      },
      undefined,
      this
    );

    // --- HUD + controls ---
    this.hud = new Hud(this);
    this.hud.setHealth(this.player.health);
    this.hud.setCorks(gameState.corks);
    this.hud.setBottles(this.bottlesThisLevel);
    this.hud.setLives(gameState.lives);
    this.controls = new TouchControls(this);

    this.afterCreate();
    this.showTitleCard();
  }

  // -------------------------------------------------------------------
  // Layout helpers (used by subclasses)
  // -------------------------------------------------------------------
  protected addPlatform(x: number, y: number, w: number, h: number, tile?: string) {
    const p = this.add.tileSprite(x, y, w, h, tile ?? this.meta.tile).setOrigin(0, 0);
    this.physics.add.existing(p, true); // static body
    const body = p.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h);
    body.position.set(x, y);
    body.updateCenter();
    this.platforms.add(p);
    return p;
  }

  /** Long ground strip along the bottom from x to x+w. */
  protected addGround(x: number, w: number) {
    return this.addPlatform(x, this.groundY, w, C.GAME_HEIGHT - this.groundY + 60);
  }

  protected addCork(x: number, y: number) {
    this.pickups.add(new Collectible(this, x, y, 'cork'));
  }

  protected addCorkRow(x: number, y: number, count: number, gap = 34) {
    for (let i = 0; i < count; i++) this.addCork(x + i * gap, y);
  }

  /** Cork corks in a Mario-style arc. */
  protected addCorkArc(x: number, y: number, count = 5, gap = 34, height = 50) {
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      this.addCork(x + i * gap, y - Math.sin(t * Math.PI) * height);
    }
  }

  protected addBottle(x: number, y: number) {
    this.pickups.add(new Collectible(this, x, y, 'bottle'));
  }

  protected addGoldenCork(x: number, y: number) {
    this.pickups.add(new Collectible(this, x, y, 'golden_cork'));
  }

  protected addGrape(x: number, y: number) {
    this.enemies.add(new SourGrape(this, x, y));
  }

  protected addBarrel(x: number, y: number, range = 110, cracked = false) {
    this.enemies.add(new BarrelRoller(this, x, y, range, cracked));
  }

  protected addVine(x: number, groundY = this.groundY) {
    this.enemies.add(new VineSnapper(this, x, groundY));
  }

  protected addBat(x: number, y: number) {
    this.enemies.add(new CorkBat(this, x, y));
  }

  protected addCheese(x: number, y: number, range = 90) {
    this.enemies.add(new CheeseSlime(this, x, y, range));
  }

  protected addGoblet(x: number, groundY = this.groundY) {
    this.enemies.add(new SnobGoblet(this, x, groundY));
  }

  protected addBrute(x: number, y: number, range = 130) {
    this.enemies.add(new GrapeBrute(this, x, y, range));
  }

  /** Drop a power-up pickup (kind = its pu_* texture key). */
  protected addPowerUp(x: number, y: number, kind: CollectibleKind) {
    this.pickups.add(new Collectible(this, x, y, kind));
  }

  /** Scale factor that makes a background texture cover the whole viewport. */
  protected coverScale(key: string): number {
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number };
    if (!src || !src.width) return 1;
    return Math.max(C.GAME_WIDTH / src.width, C.GAME_HEIGHT / src.height);
  }

  protected addGoal(x: number, groundY = this.groundY) {
    const goal = this.add.image(x, groundY, 'goal').setOrigin(0.5, 1).setDepth(4);
    this.physics.add.existing(goal, true);
    this.physics.add.overlap(this.player, goal, () => this.onReachGoal(), undefined, this);
    // little sparkle
    this.tweens.add({ targets: goal, y: groundY - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return goal;
  }

  /**
   * Mid-level checkpoint. The first time the player passes it, their respawn
   * point for this run is moved here (so death doesn't send them back to the
   * very start of a long level). Cleared when the level is completed.
   */
  protected addCheckpoint(x: number, groundY = this.groundY) {
    const key = this.scene.key;
    const reached = gameState.checkpoints[key] === x;
    const post = this.add.rectangle(x, groundY - 38, 5, 76, 0x6b3d1c).setDepth(3);
    const flag = this.add
      .triangle(x + 2, groundY - 66, 0, 0, 26, 8, 0, 16, reached ? 0x4f8f3a : 0x9b2d3a)
      .setDepth(3)
      .setAlpha(0.9);
    void post;
    const zone = this.add.zone(x, groundY - 40, 44, 130);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(
      this.player,
      zone,
      () => {
        if (gameState.checkpoints[key] === x) return;
        gameState.checkpoints[key] = x;
        flag.setFillStyle(0x4f8f3a);
        audio.sfx('powerup');
        this.juice.burst(x, groundY - 64, 0x4f8f3a, 14);
        this.hud.quip(x, groundY - 96, 'Checkpoint!', '#bff0b0');
      },
      undefined,
      this
    );
    return zone;
  }

  // -------------------------------------------------------------------
  // Collision callbacks
  // -------------------------------------------------------------------
  private onPlayerHitsEnemy(playerObj: any, enemyObj: any) {
    const enemy = enemyObj as Enemy;
    if (enemy.dead || this.dead || this.complete) return;
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const eb = enemy.body as Phaser.Physics.Arcade.Body;

    // dash through cracked barrels
    if (this.player.isDashing && enemy.dashKillable) {
      enemy.defeat();
      this.cameras.main.shake(90, 0.005);
      return;
    }

    const fromAbove = pb.velocity.y > 0 && pb.bottom - eb.top < 20;
    if (enemy.canStomp && fromAbove) {
      enemy.defeat();
      this.player.bounce();
      audio.sfx('stomp');
      this.cameras.main.shake(60, 0.003);
      this.hud.quip(this.player.x, this.player.y - 34, Phaser.Utils.Array.GetRandom(STOMP_LINES));
    } else {
      this.applyDamage(enemy.x);
    }
  }

  private onCorkHitsEnemy(corkObj: any, enemyObj: any) {
    const cork = corkObj as Phaser.Physics.Arcade.Image;
    const hx = cork.x, hy = cork.y;
    this.killShot(corkObj);
    const enemy = enemyObj as Enemy;
    if (enemy.dead) return;
    if (enemy.corkKillable) {
      enemy.takeCork();
      this.juice.burst(hx, hy, 0xd9a86c, 6);
    } else {
      this.cameras.main.shake(50, 0.003); // bounced off a barrel
      this.juice.burst(hx, hy, 0xb07d44, 4);
    }
  }

  protected applyDamage(fromX: number) {
    if (this.player.takeDamage(this.time.now, fromX)) {
      this.hud.setHealth(this.player.health);
      this.hud.quip(this.player.x, this.player.y - 34, Phaser.Utils.Array.GetRandom(HURT_LINES), '#ff9b9b');
      this.cameras.main.shake(160, 0.008);
      this.juice.flash(0xff3344, 0.4, 130);
      this.juice.hitstop(70);
      audio.sfx('hurt');
    }
  }

  private onCollect(playerObj: any, pickupObj: any) {
    const pickup = pickupObj as Collectible;
    const kind: CollectibleKind = pickup.kind;
    const px = pickup.x, py = pickup.y;
    pickup.destroy();
    this.juice.burst(px, py, kind === 'cork' ? 0xe9b949 : 0xbfe6ff, kind === 'cork' ? 5 : 10);
    audio.sfx(kind === 'cork' ? 'coin' : kind === 'bottle' ? 'bottle' : 'powerup');

    if (kind === 'cork') {
      gameState.corks += 1;
      this.hud.setCorks(gameState.corks);
      if (Math.random() < 0.25) this.hud.quip(this.player.x, this.player.y - 30, Phaser.Utils.Array.GetRandom(COLLECT_LINES));
      if (gameState.corks >= gameState.nextLifeAt) {
        gameState.lives += 1;
        gameState.nextLifeAt += C.CORKS_PER_LIFE;
        this.hud.setLives(gameState.lives);
        audio.sfx('life');
        this.hud.quip(this.player.x, this.player.y - 50, 'Bonus bottle! +1 life', '#e9b949');
      }
    } else if (kind === 'bottle') {
      gameState.bottles += 1;
      this.bottlesThisLevel += 1;
      this.hud.setBottles(this.bottlesThisLevel);
      this.hud.quip(this.player.x, this.player.y - 34, Phaser.Utils.Array.GetRandom(BOTTLE_LINES), '#e9b949');
    } else if (kind === 'golden_cork' || kind === 'pu_sommelier') {
      // Sommelier Mode: temporary invincibility
      this.player.invulnUntil = this.time.now + 5000;
      this.player.setTint(0xffe08a);
      this.time.delayedCall(5000, () => this.player.clearTint());
      this.hud.quip(this.player.x, this.player.y - 34, 'Sommelier Mode!', '#e9b949');
    } else if (kind === 'pu_cheese') {
      this.player.heal(1);
      this.hud.setHealth(this.player.health);
      this.hud.quip(this.player.x, this.player.y - 34, 'Cheese plate! +1 HP', '#f3d98a');
    } else if (kind === 'pu_shield') {
      this.player.shielded = true;
      this.hud.quip(this.player.x, this.player.y - 34, 'Red Blend Shield!', '#ff8a98');
    } else if (kind === 'pu_sparkling') {
      this.player.speedBoostUntil = this.time.now + 6000;
      this.hud.quip(this.player.x, this.player.y - 34, 'Sparkling Boost!', '#bfe6ff');
    } else if (kind === 'pu_cork_cannon') {
      this.player.rapidUntil = this.time.now + 6000;
      this.hud.quip(this.player.x, this.player.y - 34, 'Cork Cannon!', '#e9b949');
    }
  }

  // -------------------------------------------------------------------
  // Projectile lifetime / cleanup
  // -------------------------------------------------------------------
  protected killShot(shot: Phaser.GameObjects.GameObject) {
    const s = shot as Phaser.Physics.Arcade.Image;
    s.disableBody(true, true);
  }

  // -------------------------------------------------------------------
  // Win / lose
  // -------------------------------------------------------------------
  protected onReachGoal() {
    if (this.complete || this.dead || this.isBossLevel) return;
    this.complete = true;
    delete gameState.checkpoints[this.scene.key]; // replaying this level starts fresh
    this.freeze();
    audio.sfx('win');
    this.juice.burst(this.player.x, this.player.y - 20, 0xe9b949, 24);
    this.showBanner('VINTAGE SAVED!', this.meta.subtitle, () => this.scene.start(this.meta.next));
  }

  protected handleDeath() {
    if (this.dead || this.complete) return;
    this.dead = true;
    this.freeze();
    audio.sfx('lose');
    this.juice.flash(0x000000, 0.5, 200);
    gameState.lives -= 1;
    this.hud.setLives(Math.max(0, gameState.lives));
    this.time.delayedCall(1100, () => {
      if (gameState.lives <= 0) this.scene.start('GameOver');
      else this.scene.restart();
    });
  }

  protected freeze() {
    resetInput();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.moves = false;
  }

  // -------------------------------------------------------------------
  // Banners / title cards
  // -------------------------------------------------------------------
  protected showTitleCard() {
    const cx = C.GAME_WIDTH / 2;
    const panel = this.add.container(cx, 240).setScrollFactor(0).setDepth(1500);
    const bg = this.add.rectangle(0, 0, 360, 110, 0x3a0d1c, 0.92).setStrokeStyle(4, 0xe9b949);
    const title = this.add
      .text(0, -22, this.meta.title, { fontFamily: 'monospace', fontSize: '26px', color: '#e9b949', align: 'center' })
      .setOrigin(0.5);
    const sub = this.add
      .text(0, 16, this.meta.subtitle, { fontFamily: 'monospace', fontSize: '14px', color: '#f3e7d3', align: 'center', wordWrap: { width: 330 } })
      .setOrigin(0.5);
    panel.add([bg, title, sub]);
    this.tweens.add({ targets: panel, alpha: 0, delay: 1700, duration: 500, onComplete: () => panel.destroy() });

    if (this.meta.intro) {
      this.time.delayedCall(400, () => this.hud.quip(this.player.x, this.player.y - 40, this.meta.intro!, '#e9b949'));
    }
  }

  protected showBanner(title: string, subtitle: string, onDone: () => void) {
    const cx = C.GAME_WIDTH / 2;
    const cy = C.GAME_HEIGHT / 2;
    const panel = this.add.container(cx, cy).setScrollFactor(0).setDepth(1500).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 380, 200, 0x3a0d1c, 0.95).setStrokeStyle(4, 0xe9b949);
    const t = this.add
      .text(0, -50, title, { fontFamily: 'monospace', fontSize: '28px', color: '#e9b949' })
      .setOrigin(0.5);
    const stats = this.add
      .text(0, 10, `Corks: ${gameState.corks}\nBottles this level: ${this.bottlesThisLevel}/${C.BOTTLES_PER_LEVEL}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f3e7d3',
        align: 'center',
      })
      .setOrigin(0.5);
    panel.add([bg, t, stats]);
    this.tweens.add({ targets: panel, alpha: 1, duration: 400 });
    this.time.delayedCall(1900, onDone);
  }

  // -------------------------------------------------------------------
  // Main loop: projectile lifetimes + death checks
  // -------------------------------------------------------------------
  update(time: number) {
    // camera look-ahead: lead in the direction the player faces (smoothed)
    if (!this.dead && !this.complete && this.player) {
      const cam = this.cameras.main;
      const target = -this.player.facing * LOOKAHEAD;
      cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, target, 0.05);
    }

    // expire cork shots
    this.corkShots.getChildren().forEach((obj) => {
      const s = obj as Phaser.Physics.Arcade.Image;
      if (!s.active) return;
      if (time > (s.getData('dieAt') || 0)) this.killShot(s);
    });

    // expire enemy shots (snob goblet splashes)
    this.enemyShots.getChildren().forEach((obj) => {
      const s = obj as Phaser.Physics.Arcade.Image;
      if (!s.active) return;
      if (time > (s.getData('dieAt') || 0) || s.y > C.GAME_HEIGHT + 60) {
        s.disableBody(true, true);
      }
    });

    // death by health or pit
    if (!this.dead && !this.complete) {
      if (this.player.health <= 0 || this.player.y > C.GAME_HEIGHT + 80) this.handleDeath();
    }
  }
}
