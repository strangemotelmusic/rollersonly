import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-logo">Rollers<span>Only</span></div>
          <p className="footer-tagline">
            The world&apos;s first dedicated marketplace for elite roller pigeon breeders, competitors, and collectors.
          </p>
        </div>
        <div>
          <div className="footer-col-title">Platform</div>
          <ul className="footer-links">
            <li><Link href="/auctions">Live Auctions</Link></li>
            <li><Link href="/browse">Browse Birds</Link></li>
            <li><Link href="/pedigree">Pedigree Vault</Link></li>
            <li><Link href="/leaderboards">Leaderboards</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Community</div>
          <ul className="footer-links">
            <li><Link href="/breeders">Top Breeders</Link></li>
            <li><Link href="/breeders?tier=elite">Elite Lofts</Link></li>
            <li><Link href="/leaderboards">Championship Events</Link></li>
            <li><Link href="/matchmaking">AI Matchmaking</Link></li>
            <li><Link href="/how-it-works#nbrc">About NBRC</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Support</div>
          <ul className="footer-links">
            <li><Link href="/how-it-works">How it Works</Link></li>
            <li><Link href="/how-it-works#shipping">Shipping Guide</Link></li>
            <li><Link href="/how-it-works#escrow">Escrow Policy</Link></li>
            <li><a href="mailto:strangemotelmusic@gmail.com">Contact Us</a></li>
            <li><a href="mailto:strangemotelmusic@gmail.com">Become a Partner</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 RollersOnly LLC. All rights reserved.</span>
        <div className="footer-badges">
          <span className="footer-badge">Escrow Protected</span>
          <span className="footer-badge">Verified Pedigrees</span>
          <span className="footer-badge">DNA Certified</span>
        </div>
      </div>
    </footer>
  );
}
