import Icon from './Icon';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function FloatingCartButton({ itemCount, onClick }: FloatingCartButtonProps) {
  return (
    <button className="floating-cart-btn" onClick={onClick} aria-label="Voir le panier" title="Voir le panier">
      <Icon name="cart" size={22} />
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
    </button>
  );
}
