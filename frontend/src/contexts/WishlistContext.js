import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [currentUser]);

  const fetchWishlist = async () => {
    if (!currentUser) return;
    
    try {
      setWishlistLoading(true);
      const response = await axios.get('/api/wishlist');
      setWishlistItems(response.data.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!currentUser) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    try {
      const response = await axios.post('/api/wishlist', { product_id: productId });
      
      // Add to local state
      setWishlistItems(prev => [...prev, response.data.data.wishlistItem]);
      
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error.response?.data?.message || 'Gagal menambahkan ke wishlist';
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!currentUser) return;

    try {
      await axios.delete(`/api/wishlist/${productId}`);
      
      // Remove from local state
      setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error.response?.data?.message || 'Gagal menghapus dari wishlist';
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product.id === productId);
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const clearWishlist = async () => {
    if (!currentUser) return;

    try {
      await axios.delete('/api/wishlist');
      setWishlistItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error.response?.data?.message || 'Gagal mengosongkan wishlist';
    }
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const value = {
    wishlistItems,
    wishlistLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount,
    fetchWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;