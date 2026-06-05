import Phaser from 'phaser';

/**
 * The regenerated art is high-resolution and tight-cropped, and every sprite has
 * its own size/aspect. This helper makes any sprite behave like the small,
 * consistent placeholder it replaced:
 *
 *   1. scales it to a target ON-SCREEN height (so level geometry still fits), and
 *   2. anchors an arcade body of a fixed on-screen size to the sprite, so the
 *      collision box lines up with the character's feet regardless of framing.
 *
 * anchor:
 *   'bottom' – body sits at the bottom of the frame (ground units: feet on floor)
 *   'center' – body centred (flying enemies, hovering boss heads)
 *   'full'   – body = whole frame (pickups, projectiles)
 *
 * Arcade bodies scale with the sprite's scale in Phaser 3.80, so body dimensions
 * are given in ON-SCREEN pixels here and converted to texture pixels internally.
 */
export type Anchor = 'bottom' | 'center' | 'full';

type ArcadeObj = Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image;

export function fitSprite(
  sprite: ArcadeObj,
  targetHeight: number,
  bodyW = 0,
  bodyH = 0,
  anchor: Anchor = 'bottom'
) {
  try {
    const texW = sprite.width;
    const texH = sprite.height;
    if (!texW || !texH) return;

    const s = targetHeight / texH;
    sprite.setScale(s);

    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    if (anchor === 'full') {
      body.setSize(texW, texH, false);
      body.setOffset(0, 0);
      return;
    }

    const bw = bodyW / s;
    const bh = bodyH / s;
    const ox = (texW - bw) / 2;
    const oy = anchor === 'bottom' ? texH - bh : (texH - bh) / 2;
    body.setSize(bw, bh, false);
    body.setOffset(ox, oy);
  } catch {
    /* never crash the loop over a sizing call */
  }
}

/** On-screen display heights matching the original placeholder sizes. */
export const DISPLAY_H = {
  player: 56,
  sour_grape: 36,
  barrel: 40,
  cheese_slime: 40,
  snob_goblet: 46,
  grape_brute: 46,
  cork_bat: 34,
  vine_snapper: 46,
  boss: 128,
  cork: 24,
  golden_cork: 24,
  bottle: 44,
  pu: 34,
  cork_shot: 16,
} as const;
