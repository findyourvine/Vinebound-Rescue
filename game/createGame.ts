import Phaser from 'phaser';
import * as C from './config/constants';

import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import MenuScene from './scenes/MenuScene';
import HowToPlayScene from './scenes/HowToPlayScene';
import Level1Scene from './scenes/Level1Scene';
import Level2Scene from './scenes/Level2Scene';
import Level3Scene from './scenes/Level3Scene';
import Level4Scene from './scenes/Level4Scene';
import FinalBossScene from './scenes/FinalBossScene';
import GameOverScene from './scenes/GameOverScene';
import VictoryScene from './scenes/VictoryScene';

/**
 * Builds the Phaser.Game instance. This module imports Phaser at the top level,
 * so it must ONLY ever be loaded via a client-side dynamic import (see
 * components/GameCanvas.tsx) — never during server-side rendering.
 *
 * @param parent  id of the DOM element to mount the canvas into.
 */
export function createGame(parent: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1320',
    // Logical portrait resolution; Scale.FIT keeps it sharp on any phone.
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: C.GAME_WIDTH,
      height: C.GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: C.GRAVITY },
        debug: false,
      },
    },
    input: {
      activePointers: 4, // multitouch: move + jump/shoot at once
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    // Scene order = boot flow. Boot → Preload (generates textures) → Menu.
    scene: [
      BootScene,
      PreloadScene,
      MenuScene,
      HowToPlayScene,
      Level1Scene,
      Level2Scene,
      Level3Scene,
      Level4Scene,
      FinalBossScene,
      GameOverScene,
      VictoryScene,
    ],
  };

  return new Phaser.Game(config);
}
