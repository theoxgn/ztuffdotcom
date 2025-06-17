import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(AuthContext);

  // Fetch cart items when user changes
  useEffect(() => {
    if (currentUser) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [currentUser]);

  // Fetch cart items from API
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/cart');
      setCartItems(response.data.data.cartItems || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Gagal memuat keranjang belanja');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity, variationId = null, size = null, color = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/cart', {
        productId,
        quantity,
        variationId,
        size,
        color
      });
      
      await fetchCartItems(); // Refresh cart items
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      const message = error.response?.data?.message || 'Gagal menambahkan ke keranjang';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`http://localhost:5000/api/cart/${cartId}`, { quantity });
      
      await fetchCartItems(); // Refresh cart items
      return { success: true };
    } catch (error) {
      console.error('Error updating cart:', error);
      const message = error.response?.data?.message || 'Gagal mengubah jumlah barang';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`http://localhost:5000/api/cart/${cartId}`);
      
      await fetchCartItems(); // Refresh cart items
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      const message = error.response?.data?.message || 'Gagal menghapus barang dari keranjang';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete('http://localhost:5000/api/cart');
      
      setCartItems([]);
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      const message = error.response?.data?.message || 'Gagal mengosongkan keranjang';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Calculate total items in cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate subtotal
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        fetchCartItems,
        getTotalItems,
        getSubtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 