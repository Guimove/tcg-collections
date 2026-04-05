import { useState } from 'react';
import { Link } from 'react-router-dom';
import CollectionHeader, { type Stat } from './CollectionHeader';
import ScrollToTopButton from './ScrollToTopButton';
import FloatingCartButton from './FloatingCartButton';
import CartPanel from './CartPanel';
import { useCart } from '../hooks/useCart';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { usePageTitle } from '../hooks/usePageTitle';

interface CartContext {
  cart: ReturnType<typeof useCart>;
  openCart: () => void;
}

interface WithCartProps {
  children: (ctx: CartContext) => React.ReactNode;
}

function WithCart({ children }: WithCartProps) {
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);

  return (
    <>
      {children({ cart, openCart })}
      <FloatingCartButton itemCount={cart.itemCount} onClick={openCart} />
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart.cart}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeFromCart}
        onClearCart={cart.clearCart}
        onExportCSV={cart.exportToCSV}
      />
    </>
  );
}

const NOOP_CART_CTX: CartContext = {
  cart: { cart: [], addToCart: () => {}, removeFromCart: () => {}, updateQuantity: () => {}, clearCart: () => {}, exportToCSV: () => {}, itemCount: 0 },
  openCart: () => {},
};

export interface CollectionPageLayoutProps {
  pageTitle: string;
  title: string;
  subtitle: string;
  cssClass: string;
  loading: boolean;
  error: string | null;
  stats: Stat[];
  hasCart?: boolean;
  children: (ctx: CartContext) => React.ReactNode;
}

export default function CollectionPageLayout({
  pageTitle,
  title,
  subtitle,
  cssClass,
  loading,
  error,
  stats,
  hasCart = true,
  children,
}: CollectionPageLayoutProps) {
  usePageTitle(pageTitle);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  if (loading) {
    return (
      <div className={`${cssClass} loading`}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cssClass}>
        <Link to="/" className="back-button">← Accueil</Link>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className={`${cssClass} collection-page`}>
      <CollectionHeader title={title} subtitle={subtitle} stats={stats} />
      {hasCart ? (
        <WithCart>{children}</WithCart>
      ) : (
        children(NOOP_CART_CTX)
      )}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}
