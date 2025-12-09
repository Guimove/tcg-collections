import { useState, useEffect } from 'react';
import { AggregatedCard, ProcessedCardVersion, CartItem } from '../types';
import { getRarityColor, getRarityDisplayName } from '../utils/scoring';
import { useCardImage } from '../hooks/useCardImage';

interface CardDetailModalProps {
  card: AggregatedCard;
  clickedVersion: ProcessedCardVersion | null;
  onAddToCart: (item: CartItem) => void;
  onClose: () => void;
}

function CardDetailModal({ card, clickedVersion, onAddToCart, onClose }: CardDetailModalProps) {
  const [showDebug, setShowDebug] = useState(false);

  const imageHooks = card.versions.map(version =>
    useCardImage(version.Code, card.cardName)
  );

  const displayVersion = clickedVersion || card.versions[0];
  const displayIndex = card.versions.indexOf(displayVersion);
  const { imageUrl, loading } = imageHooks[displayIndex] || imageHooks[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine edition from available data
  const getEdition = (version: ProcessedCardVersion): string => {
    if (version['1st Edition'] && version['1st Edition'].trim() !== '') return '1st';
    if (version['Unlimited'] && version['Unlimited'].trim() !== '') return 'Unlimited';
    if (version['Limited / Autre'] && version['Limited / Autre'].trim() !== '') return 'Limited';
    return 'N/A';
  };

  const handleAddToCart = (version: ProcessedCardVersion) => {
    const cartItem: CartItem = {
      cardName: card.cardName,
      extension: version.Extension,
      code: version.Code,
      rarity: version.Rareté,
      edition: getEdition(version),
      quantity: 1,
      maxQuantity: version.toSell
    };

    onAddToCart(cartItem);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{card.cardName}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-image">
            {imageUrl ? (
              <img src={imageUrl} alt={card.cardName} />
            ) : (
              <div className="card-media-fallback">
                <span className="fallback-code">{displayVersion.Code}</span>
                <span className="fallback-ext">{displayVersion.Extension}</span>
                <span className="fallback-state">
                  {loading ? 'Chargement image...' : 'Image indisponible'}
                </span>
              </div>
            )}
          </div>

          <div className="modal-stats">
            <div className="stat-item">
              <div className="stat-value">{card.totalToKeep}</div>
              <div className="stat-label">À garder</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{card.numExtensions}</div>
              <div className="stat-label">Versions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{card.totalForSale}</div>
              <div className="stat-label">À vendre</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowDebug(!showDebug)}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-blue)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {showDebug ? 'Masquer' : 'Afficher'} mode debug
            </button>
          </div>

          <h3 style={{ color: 'var(--color-gold)', marginBottom: '1rem' }}>
            Toutes les versions
          </h3>

          <div className="version-list">
            {card.versions.map((version, index) => {
              const rarityColor = getRarityColor(version.rarityScore);
              const rarityName = getRarityDisplayName(version.Rareté);

              return (
                <div key={index} className="version-item">
                  <div className="version-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="card-badges">
                      <span
                        className="badge badge-rarity"
                        style={{ background: rarityColor }}
                      >
                        {rarityName}
                      </span>
                      <span className="badge badge-language">{version.Langue}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        borderRadius: '12px',
                        background: 'var(--color-red)',
                        color: 'white'
                      }}>
                        {version.toSell}x à vendre
                      </span>
                      {version.toSell > 0 && (
                        <button
                          onClick={() => handleAddToCart(version)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            background: 'var(--color-gold)',
                            color: 'var(--bg-primary)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🛒 Ajouter
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="version-details">
                    <div className="detail-row">
                      <span className="detail-label">Extension:</span>
                      <span>{version.Extension}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Code:</span>
                      <span>{version.Code}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Édition:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-gold)' }}>
                        {getEdition(version)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Quantité totale:</span>
                      <span>{version.Quantité}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">À garder:</span>
                      <span>{version.keepTotal}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">À vendre:</span>
                      <span>{version.toSell}</span>
                    </div>
                    {version['N° Artwork'] && (
                      <div className="detail-row">
                        <span className="detail-label">Artwork:</span>
                        <span>{version['N° Artwork']}</span>
                      </div>
                    )}
                  </div>

                  {showDebug && (
                    <div className="debug-section" style={{ marginTop: '1rem' }}>
                      <div className="debug-info">
                        <div>Rarity Score: {version.rarityScore}</div>
                        <div>Language Score: {version.languageScore}</div>
                        <div>Total Score: {version.totalScore.toFixed(6)}</div>
                        <div>Keep for Extension: {version.keepForExtension}</div>
                        <div>Extra Keep: {version.extraKeep}</div>
                        <div>Keep Total: {version.keepTotal}</div>
                        <div>Left After Extension: {version.leftAfterExtension}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showDebug && (
            <div className="debug-section" style={{ marginTop: '1.5rem' }}>
              <div className="debug-title">Debug Info - Carte globale</div>
              <div className="debug-info">
                <div>Nom de la carte: {card.cardName}</div>
                <div>Nombre d'extensions: {card.numExtensions}</div>
                <div>Total à garder: {card.totalToKeep}</div>
                <div>Total à vendre: {card.totalForSale}</div>
                <div>Nombre de versions: {card.versions.length}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardDetailModal;
