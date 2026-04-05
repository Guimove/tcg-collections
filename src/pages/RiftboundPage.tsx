import { useState, useMemo } from 'react';
import './RiftboundPage.css';
import OptimizedImage from '../components/OptimizedImage';
import EmptyState from '../components/EmptyState';
import CardModal from '../components/CardModal';
import CollectionPageLayout from '../components/CollectionPageLayout';
import DiffBanner from '../components/DiffBanner';
import { useCollectionData } from '../hooks/useCollectionData';
import { useCollectionDiff } from '../hooks/useCollectionDiff';
import { filterByQuantity, computeSimpleStats, sortCards, addSimpleCardToCart, QuantityFilterType, SortDirection } from '../utils/filters';

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

function parseRiftboundRows(rows: any[]): RiftboundCard[] {
  const cards: RiftboundCard[] = [];

  for (const row of rows) {
    if (!row['card-id']) continue;

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

  return cards;
}

export default function RiftboundPage() {
  const { data: allCards, loading, error } = useCollectionData<RiftboundCard>(
    '/riftbound/collection.csv',
    parseRiftboundRows,
    { transformHeader: (h) => h.trim() },
  );

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [modalCard, setModalCard] = useState<RiftboundCard | null>(null);
  const [sortBy, setSortBy] = useState<'cardId' | 'name' | 'rarity' | 'quantity'>('cardId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = allCards;

    // Quantity filter
    filtered = filtered.filter(card => filterByQuantity(card.quantity, quantityFilter));

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

    return sortCards(filtered, sortBy, sortDirection, {
      cardId: (c) => c.cardId,
      name: (c) => c.name,
      rarity: (c) => c.rarity,
      quantity: (c) => c.quantity,
    });
  }, [allCards, currentFilter, quantityFilter, searchTerm, setFilter, colorFilter, rarityFilter, sortBy, sortDirection]);

  const stats = computeSimpleStats(allCards);
  const diffCards = useMemo(() => allCards.map(c => ({ key: c.cardId, quantity: c.quantity })), [allCards]);
  const { diff, dismissDiff } = useCollectionDiff('riftbound', diffCards, loading);

  return (
    <CollectionPageLayout
      pageTitle="Riftbound - Guimove"
      title="Riftbound Collection"
      subtitle={`League of Legends - ${allCards.length} cartes`}
      cssClass="riftbound-container"
      loading={loading}
      error={error}
      stats={[
        { value: allCards.length, label: 'Total' },
        { value: stats.uniqueOwned, label: 'Possédées' },
        { value: stats.totalCards, label: 'Exemplaires' },
        { value: stats.totalForSale, label: 'À vendre' },
      ]}
    >
      {({ cart, openCart }) => {
        const bulkAddToCart = (cards: RiftboundCard[]) => {
          const sellable = cards.filter(c => c.quantity >= 2);
          sellable.forEach(card => {
            cart.addToCart({
              cardName: card.name,
              extension: 'Riftbound',
              code: card.cardId,
              rarity: card.rarity,
              edition: card.set,
              quantity: 1,
              maxQuantity: card.quantity - 1,
            });
          });
          if (sellable.length > 0) openCart();
        };

        return (
        <>
          <DiffBanner diff={diff} onDismiss={dismissDiff} />
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
                      <div className="extension-title">{set}</div>
                      <div className="extension-meta">
                        <span className="extension-count">{setCards.length} cartes</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${(() => { const all = allCards.filter(c => c.set === set); const owned = all.filter(c => c.owned).length; return all.length > 0 ? (owned / all.length) * 100 : 0; })()}%` }} />
                        </div>
                        <span className="progress-text">{allCards.filter(c => c.set === set && c.owned).length}/{allCards.filter(c => c.set === set).length}</span>
                        {setCards.some(c => c.quantity >= 2) && (
                          <button className="bulk-add-btn" onClick={(e) => { e.stopPropagation(); bulkAddToCart(setCards); }}>
                            Tout ajouter au panier
                          </button>
                        )}
                      </div>
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

          {/* Modal */}
          {modalCard && (
            <CardModal onClose={() => setModalCard(null)}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      addSimpleCardToCart(
                        modalCard,
                        {
                          cardName: modalCard.name,
                          extension: 'Riftbound',
                          code: modalCard.cardId,
                          rarity: modalCard.rarity,
                          edition: modalCard.set,
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
        );
      }}
    </CollectionPageLayout>
  );
}
