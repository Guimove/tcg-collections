import { useState, useMemo } from 'react';
import './LorcanaPage.css';
import OptimizedImage from '../components/OptimizedImage';
import EmptyState from '../components/EmptyState';
import CardModal from '../components/CardModal';
import CollectionPageLayout from '../components/CollectionPageLayout';
import { useCollectionData } from '../hooks/useCollectionData';
import { filterByQuantity, computeSimpleStats, sortCards, addSimpleCardToCart, QuantityFilterType, SortDirection } from '../utils/filters';

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
  return SET_NAMES[setCode] || setCode;
};

function parseLorcanaRows(rows: any[]): LorcanaCard[] {
  const cards: LorcanaCard[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSet = (row['SET'] || '').trim();
    const rawNumber = (row['#'] || '').trim();

    if (!rawSet || !rawNumber) continue;

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
    const rawRarity = (row['RARITY'] || '').trim();
    const rarityValues = rawRarity.split('\n').map((r: string) => r.trim()).filter((r: string) => r);
    const rarity = rarityValues.length > 0 ? rarityValues[0] : rawRarity;
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

  return cards;
}

export default function LorcanaPage() {
  const { data: allCards, loading, error } = useCollectionData<LorcanaCard>(
    '/lorcana/collection.csv',
    parseLorcanaRows,
    { transformHeader: (h) => h.trim() },
  );

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [inkFilter, setInkFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [modalCard, setModalCard] = useState<LorcanaCard | null>(null);
  const [sortBy, setSortBy] = useState<'cardId' | 'name' | 'rarity' | 'quantity'>('cardId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get unique sets, inks, rarities, and franchises for filters
  const uniqueSets = useMemo(() => {
    const knownSets = allCards.map(c => c.set).filter(set => SET_NAMES[set]);
    const uniqueSetCodes = Array.from(new Set(knownSets));

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
    const knownRarities = ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Legendary', 'Enchanted', 'Scenario'];
    const validRarities = allCards.map(c => c.rarity).filter(r => knownRarities.includes(r));
    return Array.from(new Set(validRarities)).sort();
  }, [allCards]);

  const uniqueFranchises = useMemo(() => {
    return Array.from(new Set(allCards.map(c => c.franchise))).filter(f => f).sort();
  }, [allCards]);

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = allCards;

    // Quantity filter
    filtered = filtered.filter(card => filterByQuantity(card.quantity, quantityFilter));

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
      filtered = filtered.filter(card => card.set === setFilter);
    }

    // Ink filter
    if (inkFilter) {
      filtered = filtered.filter(card => card.ink === inkFilter);
    }

    // Rarity filter
    if (rarityFilter) {
      filtered = filtered.filter(card => card.rarity === rarityFilter);
    }

    // Franchise filter
    if (franchiseFilter) {
      filtered = filtered.filter(card => card.franchise === franchiseFilter);
    }

    return sortCards(filtered, sortBy, sortDirection, {
      cardId: (c) => c.cardId,
      name: (c) => c.name,
      rarity: (c) => c.rarity,
      quantity: (c) => c.quantity,
    });
  }, [allCards, currentFilter, quantityFilter, searchTerm, setFilter, inkFilter, rarityFilter, franchiseFilter, sortBy, sortDirection]);

  const stats = computeSimpleStats(allCards);

  return (
    <CollectionPageLayout
      pageTitle="Lorcana - Guimove"
      title="Lorcana Collection"
      subtitle={`Disney Lorcana TCG - ${allCards.length} Cartes uniques`}
      cssClass="lorcana-container"
      loading={loading}
      error={error}
      stats={[
        { value: stats.totalCards, label: 'Total' },
        { value: stats.uniqueOwned, label: 'Uniques' },
        { value: stats.totalForSale, label: 'À vendre' },
        { value: stats.uniqueForSale, label: 'Uniques à vendre' },
      ]}
    >
      {({ cart, openCart }) => (
        <>
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
                onChange={(e) => setSortBy(e.target.value as 'cardId' | 'name' | 'rarity' | 'quantity')}
                className="filter-select"
              >
                <option value="cardId">Trier par: ID</option>
                <option value="name">Trier par: Nom</option>
                <option value="rarity">Trier par: Rareté</option>
                <option value="quantity">Trier par: Quantité</option>
              </select>

              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
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
            <EmptyState icon="🃏" title="Aucune carte trouvée" message="Essayez de modifier vos filtres ou votre recherche" />
          ) : (
            <div className="container">
              {uniqueSets.map((set) => {
                const setCards = filteredCards.filter((card) => card.set === set);
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

          {/* Modal */}
          {modalCard && (
            <CardModal onClose={() => setModalCard(null)}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      addSimpleCardToCart(
                        modalCard,
                        {
                          cardName: modalCard.name,
                          extension: 'Lorcana',
                          code: modalCard.cardId,
                          rarity: modalCard.rarity,
                          edition: getSetName(modalCard.set),
                          quantity: 1,
                          maxQuantity: modalCard.quantity - 1,
                        },
                        cart.addToCart,
                        openCart,
                      );
                    }}
                  >
                    🛒 Ajouter au panier
                  </button>
                )}
              </div>
            </CardModal>
          )}
        </>
      )}
    </CollectionPageLayout>
  );
}
