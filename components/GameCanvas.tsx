'use client';

import { useEffect, useRef } from 'react';

const CONTAINER_ID = 'cork-game-root';

/**
 * Mounts the Phaser game on the client only. Phaser touches `window`, so it is
 * imported dynamically inside useEffect to keep it out of the SSR bundle.
 */
export default function GameCanvas() {
  const gameRef = useRef<unknown>(null);

  useEffect(() => {
    let destroyed = false;

    (async () => {
      // dynamic imports → these never run on the server
      const { createGame } = await import('../game/createGame');
      if (destroyed) return;
      gameRef.current = createGame(CONTAINER_ID);
    })();

    return () => {
      destroyed = true;
      // Phaser.Game has .destroy(true); typed loosely to avoid importing Phaser here
      const game = gameRef.current as { destroy?: (removeCanvas: boolean) => void } | null;
      if (game && typeof game.destroy === 'function') {
        game.destroy(true);
      }
      gameRef.current = null;
    };
  }, []);

  return <div id={CONTAINER_ID} className="game-root" />;
}
