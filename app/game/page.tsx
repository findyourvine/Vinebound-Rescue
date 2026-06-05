import Link from 'next/link';
import GameCanvas from '../../components/GameCanvas';

/**
 * Game route. GameCanvas is a client component that loads Phaser dynamically
 * inside a useEffect, so nothing Phaser-related runs during SSR — we can import
 * it directly without next/dynamic.
 */
export default function GamePage() {
  return (
    <main className="game-page">
      <Link href="/" className="back-link">
        ‹ back
      </Link>
      <GameCanvas />
    </main>
  );
}
