import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import './HomePage.css';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set page title
    document.title = 'Guimove - Gestionnaire de Collections TCG';
    isMountedRef.current = true;

    // Animation des cartes au chargement
    const cards = document.querySelectorAll('.tcg-card');
    cards.forEach(card => {
      card.classList.add('active');
    });

    // Créer des particules flottantes seulement si le container est prêt
    const particles: HTMLDivElement[] = [];
    if (containerRef.current) {
      for (let i = 0; i < 35; i++) {
        const particle = createParticle(i);
        if (particle) particles.push(particle);
      }
    }

    return () => {
      // Cleanup particles and timeouts on unmount
      isMountedRef.current = false;
      particles.forEach(p => {
        try {
          p.remove();
        } catch (e) {
          // Ignore si déjà supprimé
        }
      });
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];

      // Supprimer toutes les particules qui pourraient traîner
      const allParticles = document.querySelectorAll('.particle');
      allParticles.forEach(p => p.remove());
    };
  }, []);

  const createParticle = (index?: number): HTMLDivElement | null => {
    if (!isMountedRef.current) return null;

    const particle = document.createElement('div');
    particle.className = 'particle homepage-particle';
    particle.style.left = Math.random() * 100 + '%';

    // Certaines particules partent de la moitié basse
    const startFromBottom = Math.random() > 0.5;
    particle.style.top = startFromBottom
      ? (50 + Math.random() * 50) + '%'  // Moitié basse (50-100%)
      : Math.random() * 100 + '%';        // N'importe où (0-100%)

    particle.style.opacity = '0';

    // Varier la taille des particules
    const size = 5 + Math.random() * 10; // Entre 5px et 15px
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    // Espacer les délais d'animation avec plus de variation
    const baseDelay = index !== undefined ? index * 0.15 : Math.random() * 3;
    const duration = 10 + Math.random() * 10; // Entre 10 et 20 secondes
    particle.style.animationDelay = baseDelay + 's';
    particle.style.animationDuration = duration + 's';

    // Varier la trajectoire horizontale
    const xOffset = -50 + Math.random() * 200; // Entre -50px et 150px
    particle.style.setProperty('--x-offset', xOffset + 'px');

    document.body.appendChild(particle);

    // Supprimer et recréer la particule après l'animation complète (délai + durée)
    const totalTime = (baseDelay + duration) * 1000;
    const timeout = window.setTimeout(() => {
      if (isMountedRef.current) {
        particle.remove();
        createParticle();
      }
    }, totalTime);

    timeoutsRef.current.push(timeout);

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
