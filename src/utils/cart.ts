import { CartItem } from '../types';

const CART_STORAGE_KEY = 'ygo-cart';

// Load cart from localStorage
export function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load cart from localStorage:', e);
  }
  return [];
}

// Save cart to localStorage
export function saveCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('Failed to save cart to localStorage:', e);
  }
}

// Clear cart
export function clearCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear cart from localStorage:', e);
  }
}

// Add item to cart or update quantity
export function addToCart(item: CartItem, cart: CartItem[]): CartItem[] {
  const existingIndex = cart.findIndex(
    i => i.code === item.code && i.edition === item.edition
  );

  if (existingIndex >= 0) {
    // Update quantity, but don't exceed max
    const newCart = [...cart];
    const newQuantity = Math.min(
      newCart[existingIndex].quantity + item.quantity,
      item.maxQuantity
    );
    newCart[existingIndex] = {
      ...newCart[existingIndex],
      quantity: newQuantity
    };
    return newCart;
  } else {
    // Add new item
    return [...cart, item];
  }
}

// Remove item from cart
export function removeFromCart(code: string, edition: string, cart: CartItem[]): CartItem[] {
  return cart.filter(item => !(item.code === code && item.edition === edition));
}

// Update item quantity
export function updateCartItemQuantity(
  code: string,
  edition: string,
  quantity: number,
  cart: CartItem[]
): CartItem[] {
  return cart.map(item => {
    if (item.code === code && item.edition === edition) {
      return {
        ...item,
        quantity: Math.max(1, Math.min(quantity, item.maxQuantity))
      };
    }
    return item;
  });
}

// Get total item count in cart
export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

// Export cart to CSV
export function exportCartToCSV(cart: CartItem[]): void {
  if (cart.length === 0) {
    alert('Le panier est vide !');
    return;
  }

  // CSV header: Nom, Extension, Code, Rareté, Edition, Quantité
  const headers = ['Nom', 'Extension', 'Code', 'Rareté', 'Edition', 'Quantité'];
  const rows = cart.map(item => [
    item.cardName,
    item.extension,
    item.code,
    item.rarity,
    item.edition,
    item.quantity.toString()
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells containing commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `panier_cartes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
