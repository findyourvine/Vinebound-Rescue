import Phaser from 'phaser';

/** Minimal first scene. Could load a tiny logo here; for now jumps to Preload. */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  create() {
    this.scene.start('Preload');
  }
}
