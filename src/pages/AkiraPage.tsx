import { useState, useMemo } from 'react';
import './AkiraPage.css';
import OptimizedImage from '../components/OptimizedImage';
import CollectionPageLayout from '../components/CollectionPageLayout';
import EmptyState from '../components/EmptyState';
import CardModal from '../components/CardModal';
import DiffBanner from '../components/DiffBanner';
import { filterByQuantity, computeSimpleStats, sortCards, addSimpleCardToCart, QuantityFilterType, SortDirection } from '../utils/filters';
import { useCollectionData } from '../hooks/useCollectionData';
import { useCollectionDiff } from '../hooks/useCollectionDiff';

interface Card {
  category: string;
  number: string;
  filename: string;
  path: string;
  isPuzzle: boolean;
  quantity: number;
  owned: boolean;
}

function parseAkiraRows(rows: string[][]): Card[] {
  const cards: Card[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;
    const categoryName = (row[0] || '').trim();
    const number = (row[1] || '').trim();
    const filename = (row[2] || '').trim();
    const quantity = parseInt(row[3]) || 0;
    if (!categoryName || !filename) continue;
    cards.push({
      category: categoryName,
      number,
      filename,
      path: `/akira/cards/${filename}`,
      isPuzzle: categoryName.toLowerCase().includes('puzzle'),
      quantity,
      owned: quantity > 0,
    });
  }
  return cards;
}

export default function AkiraPage() {
  const { data: allCards, loading, error } = useCollectionData<Card>(
    '/akira/collection.csv',
    parseAkiraRows,
    { header: false },
  );

  const [currentFilter, setCurrentFilter] = useState<QuantityFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    allCards.forEach(card => {
      categoryMap.set(card.category, (categoryMap.get(card.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
      isPuzzle: name.toLowerCase().includes('puzzle'),
    }));
  }, [allCards]);

  const filteredCards = useMemo(() => {
    const cards = allCards.filter(
      (card) =>
        filterByQuantity(card.quantity, currentFilter) &&
        (searchTerm === '' ||
          card.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return sortCards(cards, sortBy, sortDirection, {
      name: (c) => c.filename,
      quantity: (c) => c.quantity,
    });
  }, [allCards, currentFilter, searchTerm, sortBy, sortDirection]);

  const stats = computeSimpleStats(allCards);

  const diffCards = useMemo(() => allCards.map(c => ({ key: c.filename, quantity: c.quantity })), [allCards]);
  const { diff, dismissDiff } = useCollectionDiff('akira', diffCards, loading);

  return (
    <CollectionPageLayout
      pageTitle="Dragon Ball Akira - Guimove"
      title="Collection Dragon Ball Akira V2"
      subtitle={`Lucky Cards - ${allCards.length} cartes`}
      cssClass="akira-page"
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
        const bulkAddToCart = (cards: Card[]) => {
          const sellable = cards.filter(c => c.quantity >= 2);
          sellable.forEach(card => {
            cart.addToCart({
              cardName: `${card.category} #${card.number}`,
              extension: 'Akira',
              code: card.number,
              rarity: card.category,
              edition: 'N/A',
              quantity: 1,
              maxQuantity: card.quantity - 1,
            });
          });
          if (sellable.length > 0) openCart();
        };

        return (
        <>
          <DiffBanner diff={diff} onDismiss={dismissDiff} />
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
                <select value={currentFilter} onChange={(e) => setCurrentFilter(e.target.value as QuantityFilterType)} className="filter-select">
                  <option value="all">Toutes</option>
                  <option value="owned">Possédées</option>
                  <option value="not-owned">Non possédées</option>
                  <option value="for-sale">À vendre (×2+)</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity')} className="filter-select">
                  <option value="name">Trier par: Nom</option>
                  <option value="quantity">Trier par: Quantité</option>
                </select>
                <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')} className="filter-select">
                  <option value="asc">Croissant</option>
                  <option value="desc">Décroissant</option>
                </select>
              </div>
            </div>
          </div>

          <div className="container">
            {filteredCards.length === 0 ? (
              <EmptyState icon="🃏" title="Aucune carte trouvée" message="Essayez de modifier vos filtres ou votre recherche" />
            ) : (
              <>
                {categories.map((category) => {
                  const categoryCards = filteredCards.filter((c) => c.category === category.name);
                  if (categoryCards.length === 0) return null;
                  const allCategoryCards = allCards.filter(c => c.category === category.name);
                  const ownedInCategory = allCategoryCards.filter(c => c.owned).length;
                  return (
                    <div key={category.name} className="category-section">
                      <div className="category-header">
                        <div className="category-title">{category.name}</div>
                        <div className="category-meta">
                          <span className="category-count">{categoryCards.length} cartes</span>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${allCategoryCards.length > 0 ? (ownedInCategory / allCategoryCards.length) * 100 : 0}%` }} />
                          </div>
                          <span className="progress-text">{ownedInCategory}/{allCategoryCards.length}</span>
                          {categoryCards.some(c => c.quantity >= 2) && (
                            <button className="bulk-add-btn" onClick={(e) => { e.stopPropagation(); bulkAddToCart(categoryCards); }}>
                              Tout ajouter au panier
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={category.isPuzzle ? 'gallery puzzle-gallery' : 'gallery'}>
                        {categoryCards.map((card) => (
                          <div
                            key={card.filename}
                            className={`card-container ${!card.owned ? 'not-owned' : ''}`}
                            onClick={() => setModalCard(card)}
                          >
                            {card.quantity > 0 && <div className="quantity-badge">×{card.quantity}</div>}
                            <OptimizedImage src={card.path} alt={card.filename} loading="lazy" />
                            <div className="card-info">{card.category} #{card.number}</div>
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
            <CardModal onClose={() => setModalCard(null)}>
              <OptimizedImage src={modalCard.path} alt={modalCard.filename} className="modal-image" loading="eager" />
              <div className="modal-info">
                <h2>{modalCard.category} #{modalCard.number}</h2>
                <p><strong>Catégorie:</strong> {modalCard.category}</p>
                <p><strong>Numéro:</strong> {modalCard.number}</p>
                <p><strong>Type:</strong> {modalCard.isPuzzle ? 'Puzzle' : 'Carte'}</p>
                <p><strong>Quantité:</strong> {modalCard.quantity > 0 ? `×${modalCard.quantity}` : 'Non possédée'}</p>
                {modalCard.quantity >= 2 && (
                  <button
                    className="modal-add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSimpleCardToCart(
                        modalCard,
                        {
                          cardName: `${modalCard.category} #${modalCard.number}`,
                          extension: 'Akira',
                          code: modalCard.number,
                          rarity: modalCard.category,
                          edition: 'N/A',
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
