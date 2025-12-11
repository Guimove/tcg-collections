import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './YugiohPage.css';
import { CardRow, AggregatedCard, ProcessedCardVersion } from '../types';
import { loadDefaultCSV } from '../utils/csvParser';
import { processCardCollection, getMarketplaceItems } from '../utils/algorithm';
import { getRarityColor, getRarityDisplayName, getRarityFullName } from '../utils/scoring';
import CardDetailModal from '../components/CardDetailModal';
import CartPanel from '../components/CartPanel';
import { useCardImage } from '../hooks/useCardImage';
import { useCart } from '../hooks/useCart';

export default function YugiohPage() {
  const [, setCardRows] = useState<CardRow[]>([]);
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

  // Cart
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(60);

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load default CSV on mount
  useEffect(() => {
    loadDefaultCSV().then((result) => {
      if (result.success && result.data) {
        setCardRows(result.data);
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

    // Apply filters
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

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a['Nom de la carte'].localeCompare(b['Nom de la carte']);
      } else if (sortBy === 'rarity') {
        comparison = b.rarityScore - a.rarityScore;
      } else if (sortBy === 'quantity') {
        comparison = b.toSell - a.toSell;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [marketplaceItems, searchQuery, rarityFilter, languageFilter, extensionFilter, sortBy, sortDirection]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(60);
  }, [searchQuery, rarityFilter, languageFilter, extensionFilter, sortBy, sortDirection]);

  // Lazy loading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show scroll to top button when scrolled down 300px
      setShowScrollTop(scrollTop > 300);

      // Load more when 500px from bottom
      if (scrollTop + windowHeight >= documentHeight - 500 && visibleCount < filteredItems.length) {
        setVisibleCount(prev => Math.min(prev + 40, filteredItems.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredItems.length]);

  // Stats
  const totalCardsForSale = marketplaceItems.reduce((sum, item) => sum + item.toSell, 0);
  const uniqueCardsForSale = new Set(marketplaceItems.map((item) => item['Nom de la carte'])).size;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="yugioh-page">
      <div className="header-stats-container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <Link to="/" className="back-button" title="Retour à l'accueil">
            ← Accueil
          </Link>
          <header className="header" style={{ marginBottom: 0 }}>
            <h1>Yu-Gi-Oh! Marketplace</h1>
            <p>Collection personnelle - Cartes disponibles</p>
          </header>
        </div>

        {!loading && (
          <div className="stats" style={{
            marginBottom: 0,
            flexDirection: 'row',
            gap: '2rem'
          }}>
            <div className="stat-item">
              <div className="stat-value">{uniqueCardsForSale}</div>
              <div className="stat-label">Cartes uniques</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalCardsForSale}</div>
              <div className="stat-label">Copies totales</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{filteredItems.length}</div>
              <div className="stat-label">Résultats</div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <>
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
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="name">Nom</option>
                    <option value="rarity">Rareté</option>
                    <option value="quantity">Quantité</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Ordre</label>
                  <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value as any)}>
                    <option value="asc">Croissant</option>
                    <option value="desc">Décroissant</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🃏</div>
              <p>Aucune carte trouvée</p>
            </div>
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
        </>
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          clickedVersion={selectedVersion}
          onAddToCart={(item) => {
            cart.addToCart(item);
            setIsCartOpen(true);
          }}
          onClose={() => {
            setSelectedCard(null);
            setSelectedVersion(null);
          }}
        />
      )}

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop} title="Retour en haut">
          ↑
        </button>
      )}

      <button
        className="floating-cart-btn"
        onClick={() => setIsCartOpen(true)}
        title="Voir le panier"
      >
        🛒
        {cart.itemCount > 0 && (
          <span className="cart-badge">{cart.itemCount}</span>
        )}
      </button>

      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart.cart}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeFromCart}
        onClearCart={cart.clearCart}
        onExportCSV={cart.exportToCSV}
      />
    </div>
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

  // Determine edition from available data
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
