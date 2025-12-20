import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import './LorcanaPage.css';
import CartPanel from '../components/CartPanel';
import OptimizedImage from '../components/OptimizedImage';
import { useCart } from '../hooks/useCart';

interface LorcanaCard {
  cardId: string; // SET-NUMBER
  set: string;
  number: string;
  name: string;
  type: string;
  ink: string; // Color in Lorcana
  rarity: string;
  quantity: number;
  cost: string;
  strength: string;
  willpower: string;
  lore: string;
  classifications: string;
  ability: string;
  franchise: string;
  imagePath: string;
  owned: boolean;
}

type FilterType = 'all' | 'characters' | 'items' | 'actions' | 'songs' | 'locations';
type QuantityFilterType = 'all' | 'owned' | 'not-owned' | 'for-sale';

// Mapping des codes d'extensions vers leurs noms complets
const SET_NAMES: Record<string, string> = {
  'TFC': '1 - The First Chapter',
  'ROTF': '2 - Rise of the Floodborn',
  'ITI': '3 - Into the Inklands',
  'URR': "4 - Ursula's Return",
  'SHS': '5 - Shimmering Skies',
  'AZS': '6 - Azurite Sea',
  'ARI': "7 - Archazia's Island",
  'ROJ': '8 - Reign of Jafar',
  'FAB': '9 - Fabled',
  'WITW': '10 - Whispers in the Well',
  'WIS': '11 - Winterspell',
  'WIN': '11 - Winterspell',
};

// Fonction pour obtenir le nom complet d'une extension
const getSetName = (setCode: string): string => {
  // Gérer les cas avec plusieurs codes séparés par des retours à la ligne
  const codes = setCode.split('\n').map(c => c.trim()).filter(c => c);
  if (codes.length > 1) {
    // Si plusieurs codes, prendre le premier
    return SET_NAMES[codes[0]] || setCode;
  }
  return SET_NAMES[setCode] || setCode;
};

export default function LorcanaPage() {
  const [allCards, setAllCards] = useState<LorcanaCard[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [inkFilter, setInkFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [modalCard, setModalCard] = useState<LorcanaCard | null>(null);
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
    document.title = 'Lorcana - Guimove';
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
      const response = await fetch('/lorcana/collection.csv');
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

      const cards: LorcanaCard[] = [];

      for (let i = 0; i < (results.data as any[]).length; i++) {
        const row = (results.data as any[])[i];
        const rawSet = (row['SET'] || '').trim();
        const rawNumber = (row['#'] || '').trim();

        if (!rawSet || !rawNumber) continue; // Skip empty rows

        // Normaliser le set (prendre le premier si plusieurs)
        const setCodes = rawSet.split('\n').map((c: string) => c.trim()).filter((c: string) => c);
        const set = setCodes.length > 0 ? setCodes[0] : rawSet;

        // Normaliser le numéro (prendre le premier si plusieurs)
        const numbers = rawNumber.split('\n').map((n: string) => n.trim()).filter((n: string) => n);
        const number = numbers.length > 0 ? numbers[0] : rawNumber;

        const name = (row['NAME'] || '').trim();
        // Create unique cardId by including name to handle duplicates in CSV
        const cardId = `${set}-${number}-${name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}`;
        const type = (row['TYPE'] || '').trim();
        const ink = (row['INK'] || '').trim();
        const rarity = (row['RARITY'] || '').trim();
        const quantity = parseInt(row['QUANTITY']) || 0;
        const cost = (row['COST'] || '').trim();
        const strength = (row['STR'] || '').trim();
        const willpower = (row['WILL'] || '').trim();
        const lore = (row['LORE'] || '').trim();
        const classifications = (row['CLASSIFICATIONS'] || '').trim();
        const ability = (row['ABILITY'] || '').trim();
        const franchise = (row['FRANCHISE'] || '').trim();

        // Image path: formatter le numéro avec des zéros (set déjà normalisé)
        const numberPadded = number.padStart(3, '0');
        const imagePath = `/lorcana/cards/${set.toLowerCase()}-${numberPadded}.png`;

        cards.push({
          cardId,
          set,
          number,
          name,
          type,
          ink,
          rarity,
          quantity,
          cost,
          strength,
          willpower,
          lore,
          classifications,
          ability,
          franchise,
          imagePath,
          owned: quantity > 0,
        });
      }

      setAllCards(cards);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Lorcana collection:', error);
      setError(`Erreur lors du chargement de la collection: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  // Get unique sets, inks, rarities, and franchises for filters
  const uniqueSets = useMemo(() => {
    // Normaliser les codes d'extension (prendre le premier si plusieurs)
    const normalizedSets = allCards.map(c => {
      const codes = c.set.split('\n').map(code => code.trim()).filter(code => code);
      return codes.length > 0 ? codes[0] : c.set;
    });
    // Filtrer les codes inconnus (Q1, Q2, WIS, etc.)
    const knownSets = normalizedSets.filter(set => SET_NAMES[set]);
    const uniqueSetCodes = Array.from(new Set(knownSets));

    // Ordre des sets par numéro de chapitre
    const setOrder: Record<string, number> = {
      'TFC': 1, 'ROTF': 2, 'ITI': 3, 'URR': 4, 'SHS': 5,
      'AZS': 6, 'ARI': 7, 'ROJ': 8, 'FAB': 9, 'WITW': 10, 'WIS': 11, 'WIN': 11
    };

    return uniqueSetCodes.sort((a, b) => (setOrder[a] || 999) - (setOrder[b] || 999));
  }, [allCards]);

  const uniqueInks = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.ink))).filter(c => c).sort();
  }, [allCards]);

  const uniqueRarities = useMemo(() => {
    // Normaliser les raretés (prendre la première si plusieurs)
    const normalizedRarities = allCards.map(c => {
      const rarities = c.rarity.split('\n').map(r => r.trim()).filter(r => r);
      return rarities.length > 0 ? rarities[0] : c.rarity;
    });
    // Filtrer les raretés connues seulement
    const knownRarities = ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Legendary', 'Enchanted', 'Scenario'];
    const validRarities = normalizedRarities.filter(r => knownRarities.includes(r));
    return Array.from(new Set(validRarities)).sort();
  }, [allCards]);

  const uniqueFranchises = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.franchise))).filter(f => f).sort();
  }, [allCards]);

  // Filter by quantity
  const filterByQuantity = (card: LorcanaCard): boolean => {
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
        if (currentFilter === 'characters') return type === 'character';
        if (currentFilter === 'items') return type === 'item';
        if (currentFilter === 'actions') return type === 'action';
        if (currentFilter === 'songs') return type === 'song';
        if (currentFilter === 'locations') return type === 'location';
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(search) ||
        card.cardId.toLowerCase().includes(search) ||
        card.classifications.toLowerCase().includes(search)
      );
    }

    // Set filter
    if (setFilter) {
      filtered = filtered.filter(card => {
        // Normaliser le code d'extension de la carte
        const codes = card.set.split('\n').map(code => code.trim()).filter(code => code);
        const normalizedSet = codes.length > 0 ? codes[0] : card.set;
        return normalizedSet === setFilter;
      });
    }

    // Ink filter
    if (inkFilter) {
      filtered = filtered.filter(card => card.ink === inkFilter);
    }

    // Rarity filter
    if (rarityFilter) {
      filtered = filtered.filter(card => {
        // Normaliser la rareté de la carte
        const rarities = card.rarity.split('\n').map(r => r.trim()).filter(r => r);
        const normalizedRarity = rarities.length > 0 ? rarities[0] : card.rarity;
        return normalizedRarity === rarityFilter;
      });
    }

    // Franchise filter
    if (franchiseFilter) {
      filtered = filtered.filter(card => card.franchise === franchiseFilter);
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
  }, [allCards, currentFilter, quantityFilter, searchTerm, setFilter, inkFilter, rarityFilter, franchiseFilter, sortBy, sortDirection]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (card: LorcanaCard) => {
    if (card.quantity < 2) {
      alert('Cette carte n\'est pas disponible à la vente (quantité insuffisante)');
      return;
    }

    const cartItem = {
      cardName: card.name,
      extension: 'Lorcana',
      code: card.cardId,
      rarity: card.rarity,
      edition: getSetName(card.set),
      quantity: 1,
      maxQuantity: card.quantity - 1 // On garde 1 exemplaire
    };

    cart.addToCart(cartItem);
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="lorcana-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la collection Lorcana...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lorcana-container">
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
    <div className="lorcana-container">
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
            <h1>Lorcana Collection</h1>
            <p>Disney Lorcana TCG - {allCards.length} Cartes uniques</p>
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
              placeholder="Rechercher par nom, code ou classification..."
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
            className={`type-btn ${currentFilter === 'characters' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('characters')}
          >
            Personnages
          </button>
          <button
            className={`type-btn ${currentFilter === 'items' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('items')}
          >
            Objets
          </button>
          <button
            className={`type-btn ${currentFilter === 'actions' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('actions')}
          >
            Actions
          </button>
          <button
            className={`type-btn ${currentFilter === 'songs' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('songs')}
          >
            Chansons
          </button>
          <button
            className={`type-btn ${currentFilter === 'locations' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('locations')}
          >
            Lieux
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
              <option key={set} value={set}>{getSetName(set)}</option>
            ))}
          </select>

          <select
            value={inkFilter}
            onChange={(e) => setInkFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes les encres</option>
            {uniqueInks.map(ink => (
              <option key={ink} value={ink}>{ink}</option>
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
            value={franchiseFilter}
            onChange={(e) => setFranchiseFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes les franchises</option>
            {uniqueFranchises.map(franchise => (
              <option key={franchise} value={franchise}>{franchise}</option>
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
            const setCards = filteredCards.filter((card) => {
              // Normaliser le code d'extension de la carte
              const codes = card.set.split('\n').map(code => code.trim()).filter(code => code);
              const normalizedSet = codes.length > 0 ? codes[0] : card.set;
              return normalizedSet === set;
            });
            if (setCards.length === 0) return null;

            return (
              <div key={set} className="extension-section">
                <div className="extension-header">
                  <div className="extension-title">{getSetName(set)}</div>
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
                        <div className={`card-rarity-badge ${card.rarity.toLowerCase().replace(/\s+/g, '-')}`}>
                          {card.rarity}
                        </div>
                      </div>
                      <div className="card-info">
                        <h3 className="card-name">{card.name}</h3>
                        <p className="card-id">{card.cardId}</p>
                        <div className="card-meta">
                          <span className={`card-ink ink-${card.ink.toLowerCase()}`}>{card.ink}</span>
                          {card.cost && <span className="card-cost">💎 {card.cost}</span>}
                          {card.strength && <span className="card-strength">⚔️ {card.strength}</span>}
                          {card.lore && <span className="card-lore">📖 {card.lore}</span>}
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
                <p><strong>Extension:</strong> {getSetName(modalCard.set)}</p>
                <p><strong>Rareté:</strong> {modalCard.rarity}</p>
                <p><strong>Encre:</strong> {modalCard.ink}</p>
                {modalCard.franchise && <p><strong>Franchise:</strong> {modalCard.franchise}</p>}
                <p><strong>Quantité:</strong> {modalCard.quantity > 0 ? `×${modalCard.quantity}` : 'Non possédée'}</p>
                {modalCard.cost && <p><strong>Coût:</strong> {modalCard.cost}</p>}
                {modalCard.strength && <p><strong>Force:</strong> {modalCard.strength}</p>}
                {modalCard.willpower && <p><strong>Volonté:</strong> {modalCard.willpower}</p>}
                {modalCard.lore && <p><strong>Sagesse:</strong> {modalCard.lore}</p>}
                {modalCard.classifications && <p><strong>Classifications:</strong> {modalCard.classifications}</p>}
                {modalCard.ability && (
                  <div className="card-effect">
                    <strong>Capacité:</strong>
                    <p>{modalCard.ability}</p>
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
