import Link from 'next/link';

/**
 * Marketing landing page. The actual game lives at /game so the heavy Phaser
 * bundle only loads when the player chooses to play.
 */
export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing__inner">
        <span className="eyebrow">A Wine Country Platformer</span>

        <h1 className="title">
          Cork
          <span className="accent">Connoisseur</span>
        </h1>

        <p className="tagline">Vinebound Rescue — save the vineyard, dodge the grapes, protect the pour.</p>

        <p className="story">
          A mysterious blight called <strong>The Sour Rot Curse</strong> has turned the grapes angry, the
          barrels rogue, and the vines downright grabby. Grab your corkscrew and set things right.
        </p>

        <Link href="/game" className="cta">
          Press Start ▸
        </Link>

        <div className="features">
          <span>3 Levels</span>
          <span>Cork Cannon</span>
          <span>Wine Dash</span>
          <span>Boss Battle</span>
        </div>

        <p className="footer-note">Wine knowledge optional. Survival recommended.</p>
      </div>
    </main>
  );
}
