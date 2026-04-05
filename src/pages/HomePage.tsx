import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import { collectibles, comingSoon } from '../collectibles';
import { usePageTitle } from '../hooks/usePageTitle';
import './HomePage.css';

const PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${(Math.random() > 0.5 ? 50 + Math.random() * 50 : Math.random() * 100)}%`,
  size: 5 + Math.random() * 10,
  delay: i * 0.15,
  duration: 10 + Math.random() * 10,
  xOffset: -50 + Math.random() * 200,
}));

export default function HomePage() {
  usePageTitle('Guimove - Mes Collections');

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
    <div className="homepage-container">
      <div className="particles-container">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--x-offset': `${p.xOffset}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <header>
        <h1>Guimove</h1>
        <p className="subtitle">Mes Collections</p>
        <Link to="/stats" className="stats-link">Statistiques</Link>
      </header>

      <div className="tcg-grid">
        {collectibles.map((c) => (
          <Link
            key={c.slug}
            to={`/${c.slug}`}
            className="tcg-card active"
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <div className="logo-container">
              <OptimizedImage src={c.logo} alt={c.logoAlt} />
            </div>
            <h2 className="tcg-name">{c.name}</h2>
          </Link>
        ))}
      </div>

      <div className="help-section">
        <h2 className="help-title">Comment utiliser cette plateforme ?</h2>
        <div className="help-grid">
          <div className="help-card">
            <div className="help-icon">🛒</div>
            <h3>Acheter</h3>
            <p>Parcourez mes collections et ajoutez au panier ce qui vous intéresse. Les éléments disponibles à la vente sont calculés automatiquement selon les règles de chaque collection.</p>
          </div>

          <div className="help-card">
            <div className="help-icon">🔍</div>
            <h3>Ce qui me manque</h3>
            <p>Utilisez le filtre "Non possédées" pour voir ce qui me manque. Si vous les avez, vous pouvez me les proposer !</p>
          </div>

          <div className="help-card">
            <div className="help-icon">📊</div>
            <h3>Recherche & Filtres</h3>
            <p>Utilisez la barre de recherche et les filtres pour trouver rapidement un élément par nom, rareté, extension ou langue.</p>
          </div>

          <div className="help-card">
            <div className="help-icon">💾</div>
            <h3>Exporter</h3>
            <p>Une fois votre sélection faite, exportez le panier en CSV pour me contacter avec votre liste.</p>
          </div>

          <div className="help-card">
            <div className="help-icon">🎯</div>
            <h3>Comprendre les statuts</h3>
            <p>Badge ×N : quantité possédée. Éléments grisés : non possédés. Éléments colorés : disponibles ou dans ma collection.</p>
          </div>

          <div className="help-card">
            <div className="help-icon">📱</div>
            <h3>Mobile & Desktop</h3>
            <p>La plateforme fonctionne sur tous les appareils pour consulter mes collections partout.</p>
          </div>
        </div>
      </div>

      <div className="coming-soon-section">
        <h2 className="coming-soon-title">Bientôt disponible</h2>
        <div className="tcg-grid">
          {comingSoon.map((c) => (
            <div key={c.name} className="tcg-card coming-soon active">
              <div className="logo-container">
                <OptimizedImage src={c.logo} alt={c.logoAlt} />
              </div>
              <h2 className="tcg-name">{c.name}</h2>
            </div>
          ))}
        </div>
      </div>

      <footer>
        <p>© 2025 Guimove</p>
      </footer>
    </div>
  );
}
