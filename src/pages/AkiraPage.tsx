import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './AkiraPage.css';
import CartPanel from '../components/CartPanel';
import OptimizedImage from '../components/OptimizedImage';
import { useCart } from '../hooks/useCart';

interface Card {
  category: string;
  number: string;
  filename: string;
  path: string;
  isPuzzle: boolean;
  quantity: number;
  owned: boolean;
}

interface Category {
  name: string;
  count: number;
  isPuzzle: boolean;
}

type FilterType = 'all' | 'owned' | 'not-owned' | 'for-sale';

export default function AkiraPage() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Cart
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Dragon Ball Akira - Guimove';
  }, []);

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      const response = await fetch('/akira/collection.csv');
      const text = await response.text();
      const lines = text.split('\n');
      const separator = text.includes(';') ? ';' : ',';

      const categoryMap = new Map<string, number>();
      const cardQuantities = new Map<string, number>();
      const cards: Card[] = [];

      // Parse CSV
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(separator);
        if (parts.length >= 4) {
          const categoryName = parts[0].trim();
          const number = parts[1].trim();
          const filename = parts[2].trim();
          const quantity = parseInt(parts[3].trim()) || 0;

          cardQuantities.set(filename, quantity);

          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, 0);
          }
          categoryMap.set(categoryName, categoryMap.get(categoryName)! + 1);

          const isPuzzle = categoryName.toLowerCase().includes('puzzle');

          cards.push({
            category: categoryName,
            number,
            filename,
            path: `/akira/cards/${filename}`,
            isPuzzle,
            quantity,
            owned: quantity > 0,
          });
        }
      }

      setAllCards(cards);

      const cats = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
        isPuzzle: name.toLowerCase().includes('puzzle'),
      }));
      setCategories(cats);

      setLoading(false);
    } catch (error) {
      console.error('Error loading collection:', error);
      setError(`Erreur lors du chargement de la collection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  const filterByQuantity = (card: Card): boolean => {
    switch (currentFilter) {
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

  const filteredCards = useMemo(() => {
    let cards = allCards.filter(
      (card) =>
        filterByQuantity(card) &&
        (searchTerm === '' ||
          card.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort
    cards.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return cards;
  }, [allCards, currentFilter, searchTerm, sortBy, sortDirection]);

  const openModal = (card: Card) => {
    setModalCard(card);
  };

  const closeModal = () => {
    setModalCard(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalCard && e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalCard]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (card: Card) => {
    if (card.quantity < 2) {
      alert('Cette carte n\'est pas disponible à la vente (quantité insuffisante)');
      return;
    }

    // Convertir la carte Akira en format compatible avec le panier
    const cartItem = {
      cardName: `${card.category} #${card.number}`,
      extension: 'Akira',
      code: card.number,
      rarity: card.category,
      edition: 'N/A',
      quantity: 1,
      maxQuantity: card.quantity - 1 // On garde 1 exemplaire
    };

    cart.addToCart(cartItem);
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="akira-page loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="akira-page">
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
    <div className="akira-page">
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
            <h1>Collection Dragon Ball Akira V2</h1>
            <p>Lucky Cards - {allCards.length} Cartes uniques</p>
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

      <div className="controls">
        <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher une carte ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dropdown-filters">
            <select
              value={currentFilter}
              onChange={(e) => setCurrentFilter(e.target.value as FilterType)}
              className="filter-select"
            >
              <option value="all">Toutes</option>
              <option value="owned">Possédées</option>
              <option value="not-owned">Non possédées</option>
              <option value="for-sale">À vendre (×2+)</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select">
              <option value="name">Trier par: Nom</option>
              <option value="quantity">Trier par: Quantité</option>
            </select>

            <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value as any)} className="filter-select">
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container">
        {filteredCards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🃏</div>
            <h3>Aucune carte trouvée</h3>
            <p>Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        ) : (
          <>
            {categories.map((category) => {
              const categoryCards = filteredCards.filter((c) => c.category === category.name);
              if (categoryCards.length === 0) return null;

              return (
                <div key={category.name} className="category-section">
                  <div className="category-header">
                    <div className="category-title">{category.name}</div>
                    <div className="category-count">{categoryCards.length} cartes</div>
                  </div>
                  <div className={category.isPuzzle ? 'gallery puzzle-gallery' : 'gallery'}>
                    {categoryCards.map((card) => (
                      <div
                        key={card.filename}
                        className={`card-container ${!card.owned ? 'not-owned' : ''}`}
                        onClick={() => openModal(card)}
                      >
                        {card.quantity > 0 && (
                          <div className="quantity-badge">×{card.quantity}</div>
                        )}
                        <OptimizedImage src={card.path} alt={card.filename} loading="lazy" />
                        <div className="card-info">
                          {card.category} #{card.number}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {modalCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-body">
              <OptimizedImage
                src={modalCard.path}
                alt={modalCard.filename}
                className="modal-image"
                loading="eager"
              />
              <div className="modal-info">
                <h2>{modalCard.category} #{modalCard.number}</h2>
                <p><strong>Catégorie:</strong> {modalCard.category}</p>
                <p><strong>Numéro:</strong> {modalCard.number}</p>
                <p><strong>Type:</strong> {modalCard.isPuzzle ? 'Puzzle' : 'Carte'}</p>
                <p><strong>Quantité:</strong> {modalCard.quantity > 0 ? `×${modalCard.quantity}` : 'Non possédée'}</p>
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
