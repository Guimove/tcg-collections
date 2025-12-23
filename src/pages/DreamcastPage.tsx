import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import './DreamcastPage.css';

interface DreamcastGame {
  name: string;
  region: string;
  serial: string;
  quantity: number;
  rom_name?: string;
  rom_size?: string;
  rom_crc?: string;
  rom_md5?: string;
  rom_sha1?: string;
  rom_serial?: string;
  owned: boolean;
}

export default function DreamcastPage() {
  const [games, setGames] = useState<DreamcastGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [quantityFilter, setQuantityFilter] = useState<'all' | 'owned' | 'not-owned' | 'for-sale'>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load CSV data
  useEffect(() => {
    Papa.parse('/dreamcast/collection.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const gamesData = results.data
          .filter((row: any) => row.name && row.name.trim())
          .map((row: any) => {
            const quantity = parseInt(row.quantity) || 0;
            return {
              name: row.name.trim(),
              region: row.region?.trim() || 'Unknown',
              serial: row.serial?.trim() || 'N/A',
              quantity: quantity,
              owned: quantity > 0,
              rom_name: row.rom_name?.trim(),
              rom_size: row.rom_size?.trim(),
              rom_crc: row.rom_crc?.trim(),
              rom_md5: row.rom_md5?.trim(),
              rom_sha1: row.rom_sha1?.trim(),
              rom_serial: row.rom_serial?.trim(),
            };
          });
        setGames(gamesData);
        setLoading(false);
      },
      error: (err) => {
        setError(`Erreur de chargement: ${err.message}`);
        setLoading(false);
      },
    });
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(games.map(g => g.region))).sort();
    return uniqueRegions;
  }, [games]);

  // Stats
  const ownedCount = useMemo(() => games.filter(g => g.owned).length, [games]);
  const notOwnedCount = useMemo(() => games.filter(g => !g.owned).length, [games]);
  const forSaleCount = useMemo(() => games.filter(g => g.quantity >= 2).length, [games]);

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.serial.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || game.region === selectedRegion;

      let matchesQuantity = true;
      if (quantityFilter === 'owned') matchesQuantity = game.owned;
      else if (quantityFilter === 'not-owned') matchesQuantity = !game.owned;
      else if (quantityFilter === 'for-sale') matchesQuantity = game.quantity >= 2;

      return matchesSearch && matchesRegion && matchesQuantity;
    });
  }, [games, searchTerm, selectedRegion, quantityFilter]);

  // Group games by region
  const gamesByRegion = useMemo(() => {
    const grouped = new Map<string, DreamcastGame[]>();

    filteredGames.forEach(game => {
      if (!grouped.has(game.region)) {
        grouped.set(game.region, []);
      }
      grouped.get(game.region)!.push(game);
    });

    // Sort regions alphabetically
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredGames]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="dreamcast-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la collection Dreamcast...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dreamcast-container error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <Link to="/">← Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="dreamcast-container">
      {/* Header with Stats */}
      <div className="header-stats-container">
        <Link to="/" className="back-button">← Accueil</Link>

        <div className="header">
          <h1>Collection Dreamcast</h1>
          <p>La dernière console de Sega (1998-2001)</p>
        </div>

        <div className="stats">
          <div className="stat-item">
            <div className="stat-value">{games.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{ownedCount}</div>
            <div className="stat-label">Possédés</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{notOwnedCount}</div>
            <div className="stat-label">Manquants</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{forSaleCount}</div>
            <div className="stat-label">À vendre</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="controls">
        <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Rechercher un jeu ou numéro de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="quantity-filters">
            <button
              className={`quantity-btn ${quantityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setQuantityFilter('all')}
            >
              Tous ({games.length})
            </button>
            <button
              className={`quantity-btn ${quantityFilter === 'owned' ? 'active' : ''}`}
              onClick={() => setQuantityFilter('owned')}
            >
              Possédés ({ownedCount})
            </button>
            <button
              className={`quantity-btn ${quantityFilter === 'not-owned' ? 'active' : ''}`}
              onClick={() => setQuantityFilter('not-owned')}
            >
              Non possédés ({notOwnedCount})
            </button>
            <button
              className={`quantity-btn ${quantityFilter === 'for-sale' ? 'active' : ''}`}
              onClick={() => setQuantityFilter('for-sale')}
            >
              À vendre ({forSaleCount})
            </button>
          </div>

          <div className="dropdown-filters">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes les régions ({games.length})</option>
              {regions.map(region => (
                <option key={region} value={region}>
                  {region} ({games.filter(g => g.region === region).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Games List */}
      {filteredGames.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🎮</div>
          <h3>Aucun jeu trouvé</h3>
          <p>Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className="container">
          {gamesByRegion.map(([region, regionGames]) => (
            <div key={region} className="region-section">
              <div className="region-header">
                <h2 className="region-title">{region}</h2>
                <span className="region-count">{regionGames.length} jeu{regionGames.length > 1 ? 'x' : ''}</span>
              </div>
              <div className="games-grid">
                {regionGames.map((game, index) => (
                  <div key={`${game.serial}-${index}`} className={`game-card ${!game.owned ? 'not-owned' : ''}`}>
                    {game.quantity > 0 && (
                      <div className="quantity-badge">×{game.quantity}</div>
                    )}
                    <div className="game-header">
                      <h3 className="game-name">{game.name}</h3>
                      <span className={`region-badge region-${game.region.toLowerCase().replace(/[^a-z]/g, '')}`}>
                        {game.region}
                      </span>
                    </div>
                    <div className="game-info">
                      <div className="info-row">
                        <span className="info-label">Série:</span>
                        <span className="info-value">{game.serial}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Statut:</span>
                        <span className={`status-badge ${game.owned ? 'owned' : 'not-owned'}`}>
                          {game.owned ? '✓ Possédé' : '✗ Manquant'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="scroll-to-top" aria-label="Scroll to top">
          ↑
        </button>
      )}
    </div>
  );
}
