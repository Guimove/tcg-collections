interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function FloatingCartButton({ itemCount, onClick }: FloatingCartButtonProps) {
  return (
    <button className="floating-cart-btn" onClick={onClick} title="Voir le panier">
      🛒
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
    </button>
  );
}
