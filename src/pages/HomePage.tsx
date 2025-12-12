import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
            <img src="/images/dragon-ball-logo.png" alt="Dragon Ball Akira Logo" />
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
            <img src="/images/yugioh-logo.png" alt="Yu-Gi-Oh! Logo" />
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
            <img src="/images/riftbound-logo.webp" alt="Riftbound Logo" />
          </div>
          <h2 className="tcg-name">Riftbound</h2>
        </Link>
      </div>

      <div className="coming-soon-section">
        <h2 className="coming-soon-title">Bientôt disponible</h2>
        <div className="tcg-grid">
          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <img src="https://cdn.shopify.com/s/files/1/0588/0866/4235/files/DLC_Logo_Full_RGB.png?v=1760968319" alt="Lorcana Logo" />
            </div>
            <h2 className="tcg-name">Lorcana</h2>
          </div>

          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <img src="https://www.atmos-arena.com/web/image/24111-a1c27a5e/logo_colorX.png" alt="Rise Logo" />
            </div>
            <h2 className="tcg-name">Rise</h2>
          </div>

          <div className="tcg-card coming-soon active">
            <div className="logo-container">
              <img src="https://static.wixstatic.com/media/57a197_e334385962ac4203abe6390f3b6ff4c6~mv2.png/v1/fill/w_560,h_314,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ONE%20PIECE%20LOGO.png" alt="One Piece Logo" />
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
