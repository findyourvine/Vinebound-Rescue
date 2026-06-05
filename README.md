# 🍷 Cork Connoisseur: Vinebound Rescue

A mobile-first 2D side-scrolling platformer built with **Next.js + Phaser 3**, ready to deploy on **Vercel**.

A mysterious blight — *The Sour Rot Curse* — has turned the vineyard against you. Play as the **Cork Connoisseur** (smart-casual wine guy: blazer, graphic tee, dark jeans, sneakers), stomp angry grapes, dash through cracked barrels, pop corks at lashing vines, and defeat the final boss, **The Sour Sommelier**.

> Artwork is **hand-drawn** (sliced from the Cork Connoisseur art bible into `public/assets/*.png`)
> and loaded in `PreloadScene`. A procedural `Graphics` generator (`game/config/textures.ts`)
> still runs as a **fallback**, filling in any texture key that doesn't have a bundled image
> (platform tiles, the cellar door, the boss grape shot, particles). To re-skin a sprite, just
> drop a new PNG into `public/assets/` with the same filename — the texture keys are unchanged.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The landing page is at `/`; the game is at `/game`.
Resize the browser to a narrow/portrait window (or use device emulation) to see the mobile layout.

### Build / production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel, **New Project → Import** the repo.
3. Framework preset is auto-detected as **Next.js**. No environment variables are required.
4. Click **Deploy**. That's it.

(Or with the CLI: `npm i -g vercel && vercel`.)

---

## Controls

| Action      | Touch                       | Keyboard            |
| ----------- | --------------------------- | ------------------- |
| Move L/R    | ◀ ▶ buttons (bottom-left)   | Arrows / A,D        |
| Jump / Stomp| JUMP (bottom-right)         | Space / W / ↑       |
| Cork Pop    | POP (bottom-right)          | F / J               |
| Dash        | DASH (bottom-right)         | Shift / K           |

- **Stomp** Sour Grapes from above, or pop them with corks.
- **Barrel Rollers** must be jumped over — unless they're **cracked** (purple), which you can **dash** through.
- **Vine Snappers** hide until you get close; hit them with a **cork shot**.
- Collect **corks** (100 = extra life) and find **3 rare bottles** per level.
- A **Golden Cork** grants brief *Sommelier Mode* invincibility.

---

## Project structure

```
app/
  layout.tsx          Root layout, fonts, metadata
  page.tsx            Marketing landing page
  game/page.tsx       Renders <GameCanvas/>
  globals.css         Landing styles + full-viewport game container
components/
  GameCanvas.tsx      'use client'; loads Phaser dynamically (no SSR)
game/
  createGame.ts       Phaser.Game config + scene list
  config/
    constants.ts      All gameplay tunables (speed, gravity, cooldowns…)
    inputState.ts     Shared input singleton (set by touch/keyboard)
    gameState.ts      Run-wide state (corks, bottles, lives)
    textures.ts       Procedural art — every texture key is generated here
    lines.ts          Funny dialogue / quip pools
  objects/
    Player.ts         Movement, jump, dash, cork shot, i-frames
    Enemy.ts          Base enemy (stomp/cork/dash rules)
    SourGrape.ts      Hops toward the player
    BarrelRoller.ts   Patrols; cracked variant is dash-killable
    VineSnapper.ts    Pops up when the player is near
    CorkBat.ts        Flying sine-wave chaser (L3+)
    CheeseSlime.ts    Slow, 3-hit tank (L4)
    SnobGoblet.ts     Ranged — lobs wine splashes (L3+)
    GrapeBrute.ts     Charging 5-hit mini-boss (L4)
    Boss.ts           The Sour Sommelier (4 HP-based phases)
    Collectible.ts    Cork / bottle / golden cork
  ui/
    Hud.ts            Wine-glass health, cork/bottle/life counters, quips
    TouchControls.ts  On-screen buttons + keyboard fallback
  scenes/
    BootScene.ts      → Preload
    PreloadScene.ts   Generates textures → Menu
    MenuScene.ts      Title + Start / How to Play
    HowToPlayScene.ts Instructions
    BaseLevelScene.ts Core level engine (physics, HUD, damage, scrolling)
    Level1Scene.ts    Mutated Vineyard — "Grape Expectations"
    Level2Scene.ts    Barrel Cellar — "Barrelly Surviving"
    Level3Scene.ts    Haunted Tasting Room — "Corked & Cursed" (Cork Bats, Snob Goblets)
    Level4Scene.ts    Fermentation Caves — "Must Get Out" (Cheese Slimes, Grape Brute)
    FinalBossScene.ts Level 5 — Grand Cru Showdown vs. The Sour Sommelier
    GameOverScene.ts  Out of lives
    VictoryScene.ts   You won (+ sequel teaser)
```

---

## How to expand the game

The codebase is intentionally modular so you can grow it without rewrites.

- **Tune the feel:** edit `game/config/constants.ts` (jump height, dash cooldown, gravity, etc.).
- **Add a level:** create `game/scenes/Level3Scene.ts` extending `BaseLevelScene`, override
  `getMeta()` (set `next` to the following scene) and `buildLevel()` using the helpers
  (`addGround`, `addPlatform`, `addGrape`, `addBarrel`, `addVine`, `addCork`, `addCorkArc`,
  `addBottle`, `addGoldenCork`, `addGoal`). Then register it in `game/createGame.ts` and point the
  previous level's `next` at it.
- **Add an enemy:** subclass `Enemy` (see `SourGrape.ts` for the pattern), set its
  `canStomp` / `corkKillable` / `dashKillable` / `touchDamage` flags, and add an `addX` helper to
  `BaseLevelScene` if you want shorthand.
- **Add dialogue:** drop new lines into `game/config/lines.ts`.

### Swapping in real art

Every sprite is a **texture key** generated in `game/config/textures.ts`
(e.g. `player_idle`, `player_run`, `sour_grape`, `barrel`, `boss`, `cork`, `bottle`,
`bg_vineyard`, `tile_stone`…). To use your own pixel art:

1. Put images in `public/assets/...`.
2. In `PreloadScene.ts`, `this.load.image('player_idle', '/assets/sprites/player_idle.png')`
   (and so on) instead of relying on the generated texture.
3. Remove or skip the matching block in `textures.ts`. The rest of the game references only the
   keys, so nothing else needs to change.

---

Built for fun. Wine knowledge optional. Survival recommended.
