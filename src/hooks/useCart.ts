import { useState, useEffect } from 'react';
import { CartItem } from '../types';
import {
  loadCart,
  saveCart,
  clearCart as clearCartStorage,
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateCartItemQuantityUtil,
  getCartItemCount,
  exportCartToCSV as exportCartToCSVUtil
} from '../utils/cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());

  // Save to localStorage whenever cart changes
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(currentCart => addToCartUtil(item, currentCart));
  };

  const removeFromCart = (code: string, edition: string) => {
    setCart(currentCart => removeFromCartUtil(code, edition, currentCart));
  };

  const updateQuantity = (code: string, edition: string, quantity: number) => {
    setCart(currentCart => updateCartItemQuantityUtil(code, edition, quantity, currentCart));
  };

  const clearCart = () => {
    setCart([]);
    clearCartStorage();
  };

  const exportToCSV = () => {
    exportCartToCSVUtil(cart);
  };

  const itemCount = getCartItemCount(cart);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    exportToCSV,
    itemCount
  };
}
