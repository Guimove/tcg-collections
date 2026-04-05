import { useState, useMemo } from 'react';
import OptimizedImage from '../components/OptimizedImage';
import CollectionPageLayout from '../components/CollectionPageLayout';
import EmptyState from '../components/EmptyState';
import DiffBanner from '../components/DiffBanner';
import { useCollectionData } from '../hooks/useCollectionData';
import { useCollectionDiff } from '../hooks/useCollectionDiff';
import './DreamcastPage.css';

interface DreamcastGame {
  name: string;
  region: string;
  serial: string;
  disc: boolean;
  manual: boolean;
  box: boolean;
  rom_name?: string;
  rom_size?: string;
  rom_crc?: string;
  rom_md5?: string;
  rom_sha1?: string;
  rom_serial?: string;
  owned: boolean;
}

function parseDreamcastRows(rows: Record<string, any>[]): DreamcastGame[] {
  return rows
    .filter((row) => row.name && row.name.trim())
    .map((row) => {
      const disc = row.disc === '1' || row.disc === 1 || row.disc === true;
      const manual = row.manual === '1' || row.manual === 1 || row.manual === true;
      const box = row.box === '1' || row.box === 1 || row.box === true;
      return {
        name: row.name.trim(),
        region: row.region?.trim() || 'Unknown',
        serial: row.serial?.trim() || 'N/A',
        disc,
        manual,
        box,
        owned: disc || manual || box,
        rom_name: row.rom_name?.trim(),
        rom_size: row.rom_size?.trim(),
        rom_crc: row.rom_crc?.trim(),
        rom_md5: row.rom_md5?.trim(),
        rom_sha1: row.rom_sha1?.trim(),
        rom_serial: row.rom_serial?.trim(),
      };
    });
}

export default function DreamcastPage() {
  const { data: games, loading, error } = useCollectionData<DreamcastGame>(
    '/dreamcast/collection.csv',
    parseDreamcastRows,
    { header: true, delimiter: ';' },
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [quantityFilter, setQuantityFilter] = useState<'all' | 'owned' | 'not-owned'>('all');

  // Get unique regions
  const regions = useMemo(() => {
    return Array.from(new Set(games.map(g => g.region))).sort();
  }, [games]);

  // Stats
  const ownedCount = useMemo(() => games.filter(g => g.owned).length, [games]);
  const notOwnedCount = useMemo(() => games.filter(g => !g.owned).length, [games]);
  const completeCount = useMemo(() => games.filter(g => g.disc && g.manual && g.box).length, [games]);

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.serial.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || game.region === selectedRegion;

      let matchesQuantity = true;
      if (quantityFilter === 'owned') matchesQuantity = game.owned;
      else if (quantityFilter === 'not-owned') matchesQuantity = !game.owned;

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

    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredGames]);

  // Diff
  const diffCards = useMemo(() => games.map(g => ({ key: g.serial, quantity: g.owned ? 1 : 0 })), [games]);
  const { diff, dismissDiff } = useCollectionDiff('dreamcast', diffCards, loading);

  // Helper function to get cover image path
  const getCoverImage = (serial: string) => {
    const sanitizedSerial = serial.replace(/\//g, '-').replace(/\s/g, '_');
    return `/dreamcast/covers/${sanitizedSerial}.png`;
  };

  return (
    <CollectionPageLayout
      pageTitle="Collection Dreamcast - Guimove"
      title="Collection Dreamcast"
      subtitle="La dernière console de Sega (1998-2001)"
      cssClass="dreamcast-container"
      loading={loading}
      error={error}
      stats={[
        { value: games.length, label: 'Total' },
        { value: ownedCount, label: 'Possédés' },
        { value: notOwnedCount, label: 'Manquants' },
        { value: completeCount, label: 'Complets' },
      ]}
      hasCart={false}
    >
      {() => (
        <>
          <DiffBanner diff={diff} onDismiss={dismissDiff} />
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
            <EmptyState icon="🎮" title="Aucun jeu trouvé" message="Essayez de modifier vos filtres de recherche" />
          ) : (
            <div className="container">
              {gamesByRegion.map(([region, regionGames]) => (
                <div key={region} className="region-section">
                  <div className="region-header">
                    <h2 className="region-title">{region}</h2>
                    <div className="region-meta">
                      <span className="region-count">{regionGames.length} jeu{regionGames.length > 1 ? 'x' : ''}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(() => { const all = games.filter(g => g.region === region); const owned = all.filter(g => g.owned).length; return all.length > 0 ? (owned / all.length) * 100 : 0; })()}%` }} />
                      </div>
                      <span className="progress-text">{games.filter(g => g.region === region && g.owned).length}/{games.filter(g => g.region === region).length}</span>
                    </div>
                  </div>
                  <div className="games-grid">
                    {regionGames.map((game, index) => (
                      <div key={`${game.serial}-${index}`} className={`game-card ${!game.owned ? 'not-owned' : ''}`}>
                        <div className="game-cover">
                          <OptimizedImage
                            src={getCoverImage(game.serial)}
                            alt={game.name}
                            loading="lazy"
                            onError={(e) => {
                              const placeholder = '/dreamcast/dreamcast-placeholder.png';
                              if (!e.currentTarget.src.includes('placeholder')) {
                                e.currentTarget.src = placeholder;
                                e.currentTarget.onerror = null;
                              }
                            }}
                          />
                        </div>
                        <div className="game-header" data-game-title={game.name}>
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
                          <div className="info-row inventory-status">
                            <span className="info-label">Inventaire:</span>
                            <div className="status-icons">
                              <span className={`status-icon ${game.disc ? 'owned' : 'missing'}`} title="Disque">
                                💿 {game.disc ? '✓' : '✗'}
                              </span>
                              <span className={`status-icon ${game.manual ? 'owned' : 'missing'}`} title="Notice">
                                📄 {game.manual ? '✓' : '✗'}
                              </span>
                              <span className={`status-icon ${game.box ? 'owned' : 'missing'}`} title="Boîte">
                                📦 {game.box ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </CollectionPageLayout>
  );
}
