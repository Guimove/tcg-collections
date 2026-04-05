import { Link } from 'react-router-dom';

export interface Stat {
  value: number;
  label: string;
}

interface CollectionHeaderProps {
  title: string;
  subtitle: string;
  stats: Stat[];
}

export default function CollectionHeader({ title, subtitle, stats }: CollectionHeaderProps) {
  return (
    <div className="header-stats-container">
      <div className="header-left">
        <Link to="/" className="back-button" title="Retour à l'accueil">
          ← Accueil
        </Link>
        <header className="header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
      </div>

      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
