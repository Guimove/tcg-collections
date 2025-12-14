import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import './RiftboundPage.css';
import CartPanel from '../components/CartPanel';
import OptimizedImage from '../components/OptimizedImage';
import { useCart } from '../hooks/useCart';

interface RiftboundCard {
  cardId: string;
  name: string;
  type: string;
  set: string;
  rarity: string;
  quantity: number;
  color: string;
  cost: string;
  might: string;
  effect: string;
  subType: string;
  imagePath: string;
  owned: boolean;
}

type FilterType = 'all' | 'champions' | 'units' | 'spells' | 'runes';
type QuantityFilterType = 'all' | 'owned' | 'not-owned' | 'for-sale';

export default function RiftboundPage() {
  const [allCards, setAllCards] = useState<RiftboundCard[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [modalCard, setModalCard] = useState<RiftboundCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortBy, setSortBy] = useState<'cardId' | 'name' | 'rarity' | 'quantity'>('cardId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Cart
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Riftbound - Guimove';
  }, []);

  useEffect(() => {
    loadCollection();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadCollection = async () => {
    try {
      const response = await fetch('/riftbound/collection.csv');
      const text = await response.text();

      // Parse CSV avec PapaParse pour gérer correctement les champs quotés et les différents séparateurs
      const results = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: '', // Auto-detect (virgule ou point-virgule)
        transformHeader: (header) => header.trim(),
      });

      if (results.errors.length > 0) {
        console.error('CSV parsing errors:', results.errors);
        setError(`Erreur lors du parsing du CSV: ${results.errors[0].message}`);
        setLoading(false);
        return;
      }

      const cards: RiftboundCard[] = [];

      for (const row of results.data as any[]) {
        if (!row['card-id']) continue; // Skip empty rows

        const cardId = (row['card-id'] || '').trim();
        const name = (row['name'] || '').trim();
        const type = (row['type'] || '').trim();
        const set = (row['set'] || '').trim();
        const rarity = (row['rarity'] || '').trim();
        const quantity = parseInt(row['quantity']) || 0;
        const color = (row['color'] || '').trim();
        const cost = (row['cost'] || '').trim();
        const might = (row['might'] || '').trim();
        const effect = (row['effect'] || '').trim();
        const subType = (row['sub-type'] || '').trim();

        // Image path: /riftbound/cards/ogn-001.png
        const imagePath = `/riftbound/cards/${cardId.toLowerCase()}.png`;

        cards.push({
          cardId,
          name,
          type,
          set,
          rarity,
          quantity,
          color,
          cost,
          might,
          effect,
          subType,
          imagePath,
          owned: quantity > 0,
        });
      }

      setAllCards(cards);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Riftbound collection:', error);
      setError(`Erreur lors du chargement de la collection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  // Get unique sets, colors, and rarities for filters
  const uniqueSets = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.set))).sort();
  }, [allCards]);

  const uniqueColors = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.color))).filter(c => c).sort();
  }, [allCards]);

  const uniqueRarities = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.rarity))).filter(r => r).sort();
  }, [allCards]);

  // Filter by quantity
  const filterByQuantity = (card: RiftboundCard): boolean => {
    switch (quantityFilter) {
      case 'owned':
        return card.quantity > 0;
      case 'not-owned':
        return card.quantity === 0;
      case 'for-sale':
        return card.quantity >= 2;
      case 'all':
      default:
        return true;
    }
  };

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = allCards;

    // Quantity filter
    filtered = filtered.filter(filterByQuantity);

    // Type filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(card => {
        const type = card.type.toLowerCase();
        if (currentFilter === 'champions') return type === 'champion';
        if (currentFilter === 'units') return type === 'unit';
        if (currentFilter === 'spells') return type === 'spell';
        if (currentFilter === 'runes') return type === 'rune';
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(search) ||
        card.cardId.toLowerCase().includes(search) ||
        card.subType.toLowerCase().includes(search)
      );
    }

    // Set filter
    if (setFilter) {
      filtered = filtered.filter(card => card.set === setFilter);
    }

    // Color filter
    if (colorFilter) {
      filtered = filtered.filter(card => card.color === colorFilter);
    }

    // Rarity filter
    if (rarityFilter) {
      filtered = filtered.filter(card => card.rarity === rarityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'cardId') {
        comparison = a.cardId.localeCompare(b.cardId);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'rarity') {
        comparison = a.rarity.localeCompare(b.rarity);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allCards, currentFilter, quantityFilter, searchTerm, setFilter, colorFilter, rarityFilter, sortBy, sortDirection]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (card: RiftboundCard) => {
    if (card.quantity < 2) {
      alert('Cette carte n\'est pas disponible à la vente (quantité insuffisante)');
      return;
    }

    const cartItem = {
      cardName: card.name,
      extension: 'Riftbound',
      code: card.cardId,
      rarity: card.rarity,
      edition: card.set,
      quantity: 1,
      maxQuantity: card.quantity - 1 // On garde 1 exemplaire
    };

    cart.addToCart(cartItem);
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="riftbound-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la collection Riftbound...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="riftbound-container">
        <Link to="/" className="back-button">← Accueil</Link>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Calculate stats
  const totalCards = allCards.reduce((sum, card) => sum + card.quantity, 0);
  const uniqueOwned = allCards.filter(card => card.quantity > 0).length;
  const totalForSale = allCards.reduce((sum, card) => card.quantity >= 2 ? sum + (card.quantity - 1) : sum, 0);
  const uniqueForSale = allCards.filter(card => card.quantity >= 2).length;

  return (
    <div className="riftbound-container">
      {/* Header and Stats */}
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
            <h1>Riftbound Collection</h1>
            <p>League of Legends TCG - {allCards.length} Cartes uniques</p>
          </header>
        </div>

        {!loading && (
          <div className="stats" style={{
            marginBottom: 0,
            flexDirection: 'row',
            gap: '2rem'
          }}>
            <div className="stat-item">
              <div className="stat-value">{totalCards}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{uniqueOwned}</div>
              <div className="stat-label">Uniques</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalForSale}</div>
              <div className="stat-label">À vendre</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{uniqueForSale}</div>
              <div className="stat-label">Uniques à vendre</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="controls">
        <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher par nom, code ou sous-type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="type-filters">
          <button
            className={`type-btn ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('all')}
          >
            Toutes
          </button>
          <button
            className={`type-btn ${currentFilter === 'champions' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('champions')}
          >
            Champions
          </button>
          <button
            className={`type-btn ${currentFilter === 'units' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('units')}
          >
            Unités
          </button>
          <button
            className={`type-btn ${currentFilter === 'spells' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('spells')}
          >
            Sorts
          </button>
          <button
            className={`type-btn ${currentFilter === 'runes' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('runes')}
          >
            Runes
          </button>
        </div>

        <div className="dropdown-filters">
          <select
            value={quantityFilter}
            onChange={(e) => setQuantityFilter(e.target.value as QuantityFilterType)}
            className="filter-select"
          >
            <option value="all">Toutes</option>
            <option value="owned">Possédées</option>
            <option value="not-owned">Non possédées</option>
            <option value="for-sale">À vendre (×2+)</option>
          </select>

          <select
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes les extensions</option>
            {uniqueSets.map(set => (
              <option key={set} value={set}>{set}</option>
            ))}
          </select>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes les couleurs</option>
            {uniqueColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>

          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes les raretés</option>
            {uniqueRarities.map(rarity => (
              <option key={rarity} value={rarity}>{rarity}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="cardId">Trier par: ID</option>
            <option value="name">Trier par: Nom</option>
            <option value="rarity">Trier par: Rareté</option>
            <option value="quantity">Trier par: Quantité</option>
          </select>

          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as any)}
            className="filter-select"
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🃏</div>
          <h3>Aucune carte trouvée</h3>
          <p>Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      ) : (
        <div className="container">
          {uniqueSets.map((set) => {
            const setCards = filteredCards.filter((card) => card.set === set);
            if (setCards.length === 0) return null;

            return (
              <div key={set} className="extension-section">
                <div className="extension-header">
                  <div className="extension-title">{set}</div>
                  <div className="extension-count">{setCards.length} cartes</div>
                </div>
                <div className="cards-grid">
                  {setCards.map((card) => (
                    <div
                      key={card.cardId}
                      className={`card-item ${card.type.toLowerCase()} ${!card.owned ? 'not-owned' : ''}`}
                      onClick={() => setModalCard(card)}
                    >
                      <div className="card-image-wrapper">
                        {card.quantity > 0 && (
                          <div className="quantity-badge">×{card.quantity}</div>
                        )}
                        <OptimizedImage
                          src={card.imagePath}
                          alt={card.name}
                          className="card-image"
                          loading="lazy"
                        />
                        <div className={`card-rarity-badge ${card.rarity.toLowerCase()}`}>
                          {card.rarity}
                        </div>
                      </div>
                      <div className="card-info">
                        <h3 className="card-name">{card.name}</h3>
                        <p className="card-id">{card.cardId}</p>
                        <div className="card-meta">
                          <span className={`card-color color-${card.color.toLowerCase()}`}>{card.color}</span>
                          {card.cost && <span className="card-cost">💎 {card.cost}</span>}
                          {card.might && <span className="card-might">⚔️ {card.might}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}

      {/* Floating cart button */}
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

      {/* Cart Panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart.cart}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeFromCart}
        onClearCart={cart.clearCart}
        onExportCSV={cart.exportToCSV}
      />

      {/* Modal */}
      {modalCard && (
        <div className="modal-overlay" onClick={() => setModalCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalCard(null)}>×</button>
            <div className="modal-body">
              <OptimizedImage src={modalCard.imagePath} alt={modalCard.name} className="modal-image" loading="eager" />
              <div className="modal-info">
                <h2>{modalCard.name}</h2>
                <p><strong>ID:</strong> {modalCard.cardId}</p>
                <p><strong>Type:</strong> {modalCard.type}</p>
                <p><strong>Extension:</strong> {modalCard.set}</p>
                <p><strong>Rareté:</strong> {modalCard.rarity}</p>
                <p><strong>Couleur:</strong> {modalCard.color}</p>
                <p><strong>Quantité:</strong> {modalCard.quantity > 0 ? `×${modalCard.quantity}` : 'Non possédée'}</p>
                {modalCard.cost && <p><strong>Coût:</strong> {modalCard.cost}</p>}
                {modalCard.might && <p><strong>Puissance:</strong> {modalCard.might}</p>}
                {modalCard.subType && <p><strong>Sous-type:</strong> {modalCard.subType}</p>}
                {modalCard.effect && (
                  <div className="card-effect">
                    <strong>Effet:</strong>
                    <p>{modalCard.effect}</p>
                  </div>
                )}
                {modalCard.quantity >= 2 && (
                  <button
                    className="modal-add-to-cart-btn"
                    onClick={(e) => { e.stopPropagation(); addToCart(modalCard); }}
                  >
                    🛒 Ajouter au panier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
