import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AkiraPage.css';
import CartPanel from '../components/CartPanel';
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
type ViewType = 'categories' | 'grid';

export default function AkiraPage() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentView, setCurrentView] = useState<ViewType>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Cart
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

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
            path: `/akira/card_list/${filename}`,
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

  const filteredCards = allCards.filter(
    (card) =>
      filterByQuantity(card) &&
      (searchTerm === '' ||
        card.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openModal = (card: Card, index: number) => {
    setModalCard(card);
    setModalIndex(index);
  };

  const closeModal = () => {
    setModalCard(null);
  };

  const nextCard = () => {
    const newIndex = (modalIndex + 1) % allCards.length;
    setModalIndex(newIndex);
    setModalCard(allCards[newIndex]);
  };

  const prevCard = () => {
    const newIndex = (modalIndex - 1 + allCards.length) % allCards.length;
    setModalIndex(newIndex);
    setModalCard(allCards[newIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalCard) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') prevCard();
        if (e.key === 'ArrowRight') nextCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalCard, modalIndex]);

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
      <div className="akira-page">
        <div className="loading">Chargement des cartes...</div>
      </div>
    );
  }

  // Calculate stats
  const totalOwned = allCards.filter(card => card.quantity > 0).length;
  const totalForSale = allCards.filter(card => card.quantity >= 2).length;

  return (
    <div className="akira-page">
      <div className="header-stats-container">
        <Link to="/" className="back-button" title="Retour à l'accueil">
          ← Accueil
        </Link>
        <header className="header">
          <h1>Collection Dragon Ball Akira V2</h1>
          <p>Lucky Cards - 303 Cartes</p>
        </header>

        {!loading && (
          <div className="stats">
            <div className="stat-item">
              <div className="stat-value">{totalOwned}</div>
              <div className="stat-label">Possédées</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalForSale}</div>
              <div className="stat-label">À vendre</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{filteredCards.length}</div>
              <div className="stat-label">Résultats</div>
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

          <div className="filters">
            <div className="filter-group">
              <label>Affichage</label>
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as ViewType)}
              >
                <option value="categories">Par catégories</option>
                <option value="grid">Vue compacte</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Filtre</label>
              <select
                value={currentFilter}
                onChange={(e) => setCurrentFilter(e.target.value as FilterType)}
              >
                <option value="all">Toutes</option>
                <option value="owned">Possédées</option>
                <option value="not-owned">Non possédées</option>
                <option value="for-sale">À vendre (×2+)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {currentView === 'categories' ? (
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
                        onClick={() => openModal(card, allCards.indexOf(card))}
                      >
                        {card.quantity > 0 && (
                          <div className="quantity-badge">×{card.quantity}</div>
                        )}
                        <img src={card.path} alt={card.filename} loading="lazy" />
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
        ) : (
          <div className="gallery" style={{ padding: '20px' }}>
            {filteredCards.map((card) => (
              <div
                key={card.filename}
                className={`card-container ${!card.owned ? 'not-owned' : ''}`}
                onClick={() => openModal(card, allCards.indexOf(card))}
              >
                {card.quantity > 0 && (
                  <div className="quantity-badge">×{card.quantity}</div>
                )}
                <img src={card.path} alt={card.filename} loading="lazy" />
                <div className="card-info">
                  {card.category} #{card.number}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalCard && (
        <div className="modal active" onClick={closeModal}>
          <span className="modal-close" onClick={closeModal}>
            &times;
          </span>
          <span className="modal-nav modal-prev" onClick={(e) => { e.stopPropagation(); prevCard(); }}>
            &lt;
          </span>
          <img
            className="modal-content"
            src={modalCard.path}
            alt={modalCard.filename}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="modal-nav modal-next" onClick={(e) => { e.stopPropagation(); nextCard(); }}>
            &gt;
          </span>
          <div className="modal-info" onClick={(e) => e.stopPropagation()}>
            {modalCard.category} #{modalCard.number}
            {modalCard.quantity > 0 ? ` (×${modalCard.quantity})` : ' (Non possédée)'} -{' '}
            {modalIndex + 1}/{allCards.length}
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
