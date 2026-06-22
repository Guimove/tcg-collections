import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import Icon, { type IconName } from '../components/Icon';
import { collectibles, comingSoon } from '../collectibles';
import { usePageTitle } from '../hooks/usePageTitle';
import './HomePage.css';

// Per-collection accent — ties each display case to its page identity.
const ACCENTS: Record<string, string> = {
  akira: '#ff7a2b',
  yugioh: '#e8c25a',
  riftbound: '#19c8b6',
  lorcana: '#9d6bff',
  dreamcast: '#2e86ff',
};

const GUIDE: { icon: IconName; title: string; body: string }[] = [
  { icon: 'cart', title: 'Acheter', body: "Parcourez les collections et ajoutez au panier ce qui vous intéresse. Les pièces disponibles sont calculées automatiquement selon les règles de chaque collection." },
  { icon: 'search', title: 'Ce qui me manque', body: 'Activez le filtre « Non possédées » pour voir mes manques. Si vous les avez, proposez-les moi.' },
  { icon: 'filter', title: 'Rechercher & filtrer', body: 'Trouvez une pièce par nom, rareté, extension ou langue grâce à la recherche et aux filtres.' },
  { icon: 'download', title: 'Exporter', body: 'Votre sélection faite, exportez le panier en CSV pour me contacter avec votre liste.' },
  { icon: 'target', title: 'Lire les statuts', body: 'Badge ×N : quantité possédée. Pièce grisée : non possédée. Pièce en couleur : dans la collection ou disponible.' },
  { icon: 'device', title: 'Partout', body: 'L\'archive fonctionne sur mobile comme sur ordinateur, pour consulter les collections où que vous soyez.' },
];

export default function HomePage() {
  usePageTitle('Guimove — L\'Archive du collectionneur');

  return (
    <div className="home">
      {/* ---------- Masthead ---------- */}
      <header className="home-hero">
        <p className="home-eyebrow">
          <span className="home-eyebrow-dot" /> Archive privée · Collections TCG &amp; rétro
        </p>
        <h1 className="home-wordmark foil-text">Guimove</h1>
        <p className="home-lede">
          Le cabinet de mes collections — cartes à collectionner et jeux d'époque,
          catalogués, complétés, et ouverts à l'échange.
        </p>
        <div className="home-meta">
          <span><strong>{collectibles.length}</strong> collections</span>
          <span className="home-meta-sep" />
          <span><strong>{comingSoon.length}</strong> à venir</span>
          <span className="home-meta-sep" />
          <Link to="/stats" className="home-stats-link">
            <Icon name="chart" size={15} /> Statistiques détaillées
          </Link>
        </div>
      </header>

      {/* ---------- Collections ---------- */}
      <section className="home-section" aria-labelledby="collections-title">
        <div className="section-head">
          <h2 id="collections-title" className="section-title">Les collections</h2>
          <span className="section-rule" />
        </div>
        <div className="case-grid">
          {collectibles.map((c) => (
            <Link
              key={c.slug}
              to={`/${c.slug}`}
              className="case"
              style={{ '--card-accent': ACCENTS[c.slug] ?? 'var(--accent)' } as React.CSSProperties}
            >
              <div className="case-plate">
                <OptimizedImage src={c.logo} alt={c.logoAlt} />
              </div>
              <div className="case-foot">
                <span className="case-name">{c.name}</span>
                <span className="case-go" aria-hidden="true"><Icon name="arrow-left" size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Guide ---------- */}
      <section className="home-section" aria-labelledby="guide-title">
        <div className="section-head">
          <h2 id="guide-title" className="section-title">Mode d'emploi</h2>
          <span className="section-rule" />
        </div>
        <div className="guide-grid">
          {GUIDE.map((g) => (
            <article key={g.title} className="guide-card">
              <span className="guide-icon"><Icon name={g.icon} size={20} /></span>
              <h3>{g.title}</h3>
              <p>{g.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Coming soon ---------- */}
      {comingSoon.length > 0 && (
        <section className="home-section" aria-labelledby="soon-title">
          <div className="section-head">
            <h2 id="soon-title" className="section-title">Acquisitions à venir</h2>
            <span className="section-rule" />
          </div>
          <div className="case-grid">
            {comingSoon.map((c) => (
              <div key={c.name} className="case case-soon" aria-disabled="true">
                <span className="case-tag">Bientôt</span>
                <div className="case-plate">
                  <OptimizedImage src={c.logo} alt={c.logoAlt} />
                </div>
                <div className="case-foot">
                  <span className="case-name">{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="home-footer">
        <span className="home-footer-mark">Guimove</span>
        <span>© 2025 · Archive personnelle</span>
      </footer>
    </div>
  );
}
