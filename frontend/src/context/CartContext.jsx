import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    tax: 0,
    finalAmount: 0,
    coupon: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({
        items: [],
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        tax: 0,
        finalAmount: 0,
        coupon: null,
      });
    }
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setError(null);
      const res = await api.post('/cart/items', { productId, quantity });
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setError(null);
      const res = await api.patch(`/cart/items/${productId}`, { quantity });
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const removeItem = async (productId) => {
    try {
      setError(null);
      const res = await api.delete(`/cart/items/${productId}`);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const applyCoupon = async (code) => {
    try {
      setError(null);
      const res = await api.post('/cart/coupon', { code });
      if (res.success) {
        setCart(res.data);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = async () => {
    try {
      const res = await api.delete('/cart/coupon');
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
