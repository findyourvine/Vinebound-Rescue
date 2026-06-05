import { STARTING_LIVES } from './constants';

/**
 * Run-wide state that must survive across level scenes.
 * (Per-life things like current health live on the Player itself.)
 */
export const gameState = {
  corks: 0,
  bottles: 0,
  lives: STARTING_LIVES,
  // tracks the next cork milestone for awarding extra lives
  nextLifeAt: 100,
  // furthest checkpoint x reached per level scene key (respawn point on death)
  checkpoints: {} as Record<string, number>,
};

/** Reset everything for a fresh playthrough (called from the Menu). */
export function resetGameState() {
  gameState.corks = 0;
  gameState.bottles = 0;
  gameState.lives = STARTING_LIVES;
  gameState.nextLifeAt = 100;
  gameState.checkpoints = {};
}
