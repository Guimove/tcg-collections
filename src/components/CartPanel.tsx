import { CartItem } from '../types';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (code: string, edition: string, quantity: number) => void;
  onRemoveItem: (code: string, edition: string) => void;
  onClearCart: () => void;
  onExportCSV: () => void;
}

function CartPanel({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExportCSV
}: CartPanelProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={onClose}
        />
      )}

      {/* Side panel */}
      <div className={`cart-panel ${isOpen ? 'cart-panel-open' : ''}`}>
        <div className="cart-header">
          <h2>Panier</h2>
          <button className="cart-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>Votre panier est vide</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
              Ajoutez des cartes depuis le marketplace
            </p>
          </div>
        ) : (
          <>
            <div className="cart-summary">
              <span>{totalItems} carte{totalItems > 1 ? 's' : ''} sélectionnée{totalItems > 1 ? 's' : ''}</span>
            </div>

            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={`${item.code}-${item.edition}-${index}`} className="cart-item">
                  <div className="cart-item-header">
                    <h3 className="cart-item-name">{item.cardName}</h3>
                    <button
                      className="cart-item-remove"
                      onClick={() => onRemoveItem(item.code, item.edition)}
                      title="Retirer du panier"
                    >
                      ×
                    </button>
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-info">
                      <span className="cart-item-label">Extension:</span>
                      <span>{item.extension}</span>
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-label">Code:</span>
                      <span>{item.code}</span>
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-label">Rareté:</span>
                      <span>{item.rarity}</span>
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-label">Édition:</span>
                      <span>{item.edition}</span>
                    </div>
                  </div>

                  <div className="cart-item-quantity">
                    <button
                      className="quantity-btn"
                      onClick={() => onUpdateQuantity(item.code, item.edition, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        onUpdateQuantity(item.code, item.edition, value);
                      }}
                      min={1}
                      max={item.maxQuantity}
                    />
                    <button
                      className="quantity-btn"
                      onClick={() => onUpdateQuantity(item.code, item.edition, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      +
                    </button>
                    <span className="quantity-max">/ {item.maxQuantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-actions">
              <button
                className="cart-btn cart-btn-primary"
                onClick={onExportCSV}
              >
                📥 Exporter en CSV
              </button>
              <button
                className="cart-btn cart-btn-secondary"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment vider le panier ?')) {
                    onClearCart();
                  }
                }}
              >
                🗑️ Vider le panier
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default CartPanel;
