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
      
      const response = await axios.get('/api/cart');
      setCartItems(response.data.data.cartItems || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Gagal memuat keranjang belanja');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product_id, quantity, variation_id = null) => {
    if (loading) {
      return { success: false, message: 'Operasi cart sedang berjalan, tunggu sebentar' };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/cart', {
        product_id,
        quantity,
        variation_id
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
    if (loading) {
      return { success: false, message: 'Operasi cart sedang berjalan, tunggu sebentar' };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`/api/cart/${cartId}`, { quantity });
      
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
      
      await axios.delete(`/api/cart/${cartId}`);
      
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
      
      await axios.delete('/api/cart');
      
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
    return cartItems.reduce((total, item) => {
      if (!item || !item.product) return total;
      
      const price = item.variation ? 
        (item.variation.price || item.product.price || 0) : 
        (item.product.price || 0);
      
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate item discount
  const calculateItemDiscount = (item, discounts) => {
    if (!item || !item.product || !discounts || discounts.length === 0) {
      return { originalPrice: 0, discountedPrice: 0, discount: null };
    }

    const basePrice = item.variation ? 
      (item.variation.price || item.product.price || 0) : 
      (item.product.price || 0);

    // Find applicable discounts for this product
    const applicableDiscounts = discounts.filter(discount => {
      if (discount.target_type === 'all') return true;
      
      if (discount.target_type === 'category') {
        try {
          const targetIds = JSON.parse(discount.target_ids || '[]');
          return targetIds.includes(item.product.category_id);
        } catch (e) {
          return false;
        }
      }
      
      if (discount.target_type === 'product') {
        try {
          const targetIds = JSON.parse(discount.target_ids || '[]');
          return targetIds.includes(item.product.id);
        } catch (e) {
          return false;
        }
      }
      
      return false;
    });

    if (applicableDiscounts.length === 0) {
      return { originalPrice: basePrice, discountedPrice: basePrice, discount: null };
    }

    // Get the best discount (highest priority, then highest value)
    const bestDiscount = applicableDiscounts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.value - a.value;
    })[0];

    let discountAmount = 0;
    
    if (bestDiscount.type === 'percentage') {
      discountAmount = (basePrice * bestDiscount.value) / 100;
      if (bestDiscount.max_discount && discountAmount > bestDiscount.max_discount) {
        discountAmount = bestDiscount.max_discount;
      }
    } else {
      discountAmount = bestDiscount.value;
    }
    
    const discountedPrice = Math.max(0, basePrice - discountAmount);
    
    return { 
      originalPrice: basePrice, 
      discountedPrice: discountedPrice, 
      discount: bestDiscount,
      discountAmount: discountAmount 
    };
  };

  // Calculate total discount amount for all items
  const getTotalDiscount = (discounts) => {
    if (!discounts || discounts.length === 0) return 0;
    
    return cartItems.reduce((total, item) => {
      const itemDiscount = calculateItemDiscount(item, discounts);
      return total + (itemDiscount.discountAmount * item.quantity);
    }, 0);
  };

  // Calculate subtotal with discounts applied
  const getDiscountedSubtotal = (discounts) => {
    if (!discounts || discounts.length === 0) return getSubtotal();
    
    return cartItems.reduce((total, item) => {
      if (!item || !item.product) return total;
      
      const itemDiscount = calculateItemDiscount(item, discounts);
      const quantity = item.quantity || 0;
      return total + (itemDiscount.discountedPrice * quantity);
    }, 0);
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
        getSubtotal,
        calculateItemDiscount,
        getTotalDiscount,
        getDiscountedSubtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 