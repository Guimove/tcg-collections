import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import './HomePage.css';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set page title
    document.title = 'Guimove - Gestionnaire de Collections TCG';

    // Animation des cartes au chargement
    const cards = document.querySelectorAll('.tcg-card');
    cards.forEach(card => {
      card.classList.add('active');
    });

    // Créer des particules flottantes
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 15; i++) {
      const particle = createParticle();
      particles.push(particle);
    }

    return () => {
      // Cleanup particles on unmount
      particles.forEach(p => p.remove());
    };
  }, []);

  const createParticle = () => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    document.body.appendChild(particle);

    // Supprimer et recréer la particule après l'animation
    setTimeout(() => {
      particle.remove();
      createParticle();
    }, 25000);

    return particle;
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `translateY(-15px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <div className="homepage-container" ref={containerRef}>
      <header>
        <h1>Guimove</h1>
        <p className="subtitle">Gestionnaire de Collections TCG</p>
      </header>

      <div className="tcg-grid">
        <Link
          to="/akira"
          className="tcg-card active"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="logo-container">
            <OptimizedImage src="/images/dragon-ball-logo.png" alt="Dragon Ball Akira Logo" />
          </div>
          <h2 className="tcg-name">Dragon Ball Akira</h2>
        </Link>

        <Link
          to="/yugioh"
          className="tcg-card active"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="logo-container">
            <OptimizedImage src="/images/yugioh-logo.png" alt="Yu-Gi-Oh! Logo" />
          </div>
          <h2 className="tcg-name">Yu-Gi-Oh!</h2>
        </Link>

        <Link
          to="/riftbound"
          className="tcg-card active"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="logo-container">
            <OptimizedImage src="/images/riftbound-logo.png" alt="Riftbound Logo" />
          </div>
          <h2 className="tcg-name">Riftbound</h2>
        </Link>
      </div>

      <div className="coming-soon-section">
        <h2 className="coming-soon-title">Bientôt disponible</h2>
        <div className="tcg-grid">
          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <OptimizedImage src="/images/lorcana-logo.png" alt="Lorcana Logo" />
            </div>
            <h2 className="tcg-name">Lorcana</h2>
          </div>

          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <OptimizedImage src="/images/rise-logo.png" alt="Rise Logo" />
            </div>
            <h2 className="tcg-name">Rise</h2>
          </div>

          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <OptimizedImage src="/images/one-piece-logo.png" alt="One Piece Logo" />
            </div>
            <h2 className="tcg-name">One Piece</h2>
          </div>
        </div>
      </div>

      <footer>
        <p>© 2024 Guimove - Gestionnaire de Collections TCG</p>
      </footer>
    </div>
  );
}
