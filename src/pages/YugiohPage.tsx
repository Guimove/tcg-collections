import { useState, useEffect, useMemo } from 'react';
import './YugiohPage.css';
import { AggregatedCard, ProcessedCardVersion } from '../types';
import { loadDefaultCSV } from '../utils/csvParser';
import { processCardCollection, getMarketplaceItems } from '../utils/algorithm';
import { getRarityColor, getRarityDisplayName, getRarityFullName } from '../utils/scoring';
import CardDetailModal from '../components/CardDetailModal';
import CollectionPageLayout from '../components/CollectionPageLayout';
import EmptyState from '../components/EmptyState';
import DiffBanner from '../components/DiffBanner';
import { useCardImage } from '../hooks/useCardImage';
import { useCollectionDiff } from '../hooks/useCollectionDiff';

export default function YugiohPage() {
  const [aggregatedCards, setAggregatedCards] = useState<AggregatedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [extensionFilter, setExtensionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'quantity'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal
  const [selectedCard, setSelectedCard] = useState<AggregatedCard | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ProcessedCardVersion | null>(null);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(120);

  // Load default CSV on mount
  useEffect(() => {
    loadDefaultCSV().then((result) => {
      if (result.success && result.data) {
        const processed = processCardCollection(result.data);
        setAggregatedCards(processed);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
      setLoading(false);
    });
  }, []);

  // Get marketplace items (only cards for sale)
  const marketplaceItems = useMemo(() => {
    return getMarketplaceItems(aggregatedCards);
  }, [aggregatedCards]);

  // Get unique values for filters
  const uniqueRarities = useMemo(() => {
    const rarities = new Set<string>();
    marketplaceItems.forEach((item) => rarities.add(item.Rareté));
    return Array.from(rarities).sort();
  }, [marketplaceItems]);

  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>();
    marketplaceItems.forEach((item) => languages.add(item.Langue));
    return Array.from(languages).sort();
  }, [marketplaceItems]);

  const uniqueExtensions = useMemo(() => {
    const extensions = new Set<string>();
    marketplaceItems.forEach((item) => extensions.add(item.Extension));
    return Array.from(extensions).sort();
  }, [marketplaceItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...marketplaceItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) =>
        item['Nom de la carte'].toLowerCase().includes(query)
      );
    }

    if (rarityFilter) {
      items = items.filter((item) => item.Rareté === rarityFilter);
    }

    if (languageFilter) {
      items = items.filter((item) => item.Langue === languageFilter);
    }

    if (extensionFilter) {
      items = items.filter((item) => item.Extension === extensionFilter);
    }

    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a['Nom de la carte'].localeCompare(b['Nom de la carte']);
      } else if (sortBy === 'rarity') {
        comparison = a.rarityScore - b.rarityScore;
      } else if (sortBy === 'quantity') {
        comparison = a.toSell - b.toSell;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [marketplaceItems, searchQuery, rarityFilter, languageFilter, extensionFilter, sortBy, sortDirection]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(120);
  }, [searchQuery, rarityFilter, languageFilter, extensionFilter, sortBy, sortDirection]);

  // Lazy loading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 500 && visibleCount < filteredItems.length) {
        setVisibleCount(prev => Math.min(prev + 80, filteredItems.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredItems.length]);

  // Stats
  const totalAllCards = aggregatedCards.reduce((sum, item) => sum + item.totalToKeep + item.totalForSale, 0);
  const uniqueAllCards = aggregatedCards.length;
  const totalCardsForSale = marketplaceItems.reduce((sum, item) => sum + item.toSell, 0);
  const uniqueCardsForSale = marketplaceItems.length;

  // Diff banner — track per version including language to catch any inventory change
  const diffCards = useMemo(() =>
    aggregatedCards.flatMap(c =>
      c.versions.map(v => ({ key: `${v.Code}|${v.Extension}|${v.Rareté}|${v.Langue}`, quantity: v.Quantité }))
    ),
    [aggregatedCards]
  );
  const { diff, dismissDiff } = useCollectionDiff('yugioh', diffCards, loading);

  return (
    <CollectionPageLayout
      pageTitle="Yu-Gi-Oh! Marketplace - Guimove"
      title="Yu-Gi-Oh! Marketplace"
      subtitle="Collection personnelle - Cartes disponibles"
      cssClass="yugioh-page"
      loading={loading}
      error={error}
      stats={[
        { value: uniqueAllCards, label: 'Total' },
        { value: totalAllCards, label: 'Exemplaires' },
        { value: totalCardsForSale, label: 'À vendre' },
        { value: uniqueCardsForSale, label: 'Uniques à vendre' },
      ]}
    >
      {({ cart, openCart }) => (
        <>
          <DiffBanner diff={diff} onDismiss={dismissDiff} />
          <div className="controls">
            <div className="search-filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters">
                <div className="filter-group">
                  <label>Rareté</label>
                  <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
                    <option value="">Toutes</option>
                    {uniqueRarities.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {getRarityFullName(rarity)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Langue</label>
                  <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                    <option value="">Toutes</option>
                    {uniqueLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Extension</label>
                  <select value={extensionFilter} onChange={(e) => setExtensionFilter(e.target.value)}>
                    <option value="">Toutes</option>
                    {uniqueExtensions.map((ext) => (
                      <option key={ext} value={ext}>
                        {ext}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Trier par</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'rarity' | 'quantity')}>
                    <option value="name">Nom</option>
                    <option value="rarity">Rareté</option>
                    <option value="quantity">Quantité</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Ordre</label>
                  <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Croissant</option>
                    <option value="desc">Décroissant</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState icon="🃏" title="Aucune carte trouvée" message="Essayez de modifier vos filtres ou votre recherche" />
          ) : (
            <div className="marketplace-grid">
              {filteredItems.slice(0, visibleCount).map((item, index) => (
                <CardTile
                  key={`${item['Nom de la carte']}-${item.Extension}-${item.Rareté}-${index}`}
                  item={item}
                  onClick={() => {
                    const card = aggregatedCards.find(
                      (c) => c.cardName === item['Nom de la carte']
                    );
                    if (card) {
                      setSelectedCard(card);
                      setSelectedVersion(item);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {selectedCard && (
            <CardDetailModal
              card={selectedCard}
              clickedVersion={selectedVersion}
              onAddToCart={(item) => {
                cart.addToCart(item);
                openCart();
              }}
              onClose={() => {
                setSelectedCard(null);
                setSelectedVersion(null);
              }}
            />
          )}
        </>
      )}
    </CollectionPageLayout>
  );
}

interface CardTileProps {
  item: ProcessedCardVersion;
  onClick: () => void;
}

function CardTile({ item, onClick }: CardTileProps) {
  const { imageUrl, loading } = useCardImage(
    item.Code,
    item['Nom de la carte'],
    true
  );
  const rarityColor = getRarityColor(item.rarityScore);
  const rarityName = getRarityDisplayName(item.Rareté);

  const getEdition = (): string => {
    if (item['1st Edition'] && item['1st Edition'].trim() !== '') return '1st';
    if (item['Unlimited'] && item['Unlimited'].trim() !== '') return 'Unlimited';
    if (item['Limited / Autre'] && item['Limited / Autre'].trim() !== '') return 'Limited';
    return 'N/A';
  };

  return (
    <div className="card-tile" onClick={onClick}>
      <div className="card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={item['Nom de la carte']} loading="lazy" />
        ) : (
          <div className="card-media-fallback">
            <span className="fallback-code">{item.Code}</span>
            <span className="fallback-ext">{item.Extension}</span>
            <span className="fallback-state">
              {loading ? 'Chargement image...' : 'Image indisponible'}
            </span>
          </div>
        )}
      </div>

      <div className="card-header">
        <div className="card-name">{item['Nom de la carte']}</div>
        <div className="card-badges">
          <span className="badge badge-rarity" style={{ background: rarityColor }}>
            {rarityName}
          </span>
          <span className="badge badge-language">{item.Langue}</span>
        </div>
      </div>

      <div className="card-info">
        <div>Extension: {item.Extension}</div>
        <div>Code: {item.Code}</div>
        <div>Édition: {getEdition()}</div>
        {item['N° Artwork'] && <div>Artwork: {item['N° Artwork']}</div>}
      </div>

      <div className="card-footer">
        <span>Cliquer pour détails</span>
        <span className="quantity-badge">{item.toSell}x</span>
      </div>
    </div>
  );
}
