import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faShoppingCart, faHeartBroken } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';

const Wishlist = () => {
  const { currentUser } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch wishlist
  useEffect(() => {
    if (currentUser) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/wishlist');
      setWishlist(response.data.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Gagal memuat wishlist. Silakan coba lagi.');
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setActionLoading(prev => ({ ...prev, [productId]: true }));
      
      await axios.delete(`/api/wishlist/${productId}`);
      
      // Remove from local state
      setWishlist(prev => prev.filter(item => item.product.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Gagal menghapus dari wishlist. Silakan coba lagi.');
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (product) => {
    try {
      setActionLoading(prev => ({ ...prev, [`cart-${product.id}`]: true }));
      
      // Add to cart context
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || (product.images && product.images[0] ? product.images[0].image : null),
        quantity: 1
      });
      
      // Optionally remove from wishlist after adding to cart
      // await removeFromWishlist(product.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Gagal menambahkan ke keranjang. Silakan coba lagi.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart-${product.id}`]: false }));
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semua item dari wishlist?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete('/api/wishlist');
      setWishlist([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      setError('Gagal mengosongkan wishlist. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <FontAwesomeIcon icon={faHeart} size="4x" className="text-muted mb-4" />
          <h3 className="mb-3">Masuk untuk Melihat Wishlist</h3>
          <p className="text-muted mb-4">
            Anda harus masuk untuk melihat dan mengelola wishlist Anda
          </p>
          <Button as={Link} to="/login" variant="primary" size="lg">
            Masuk Sekarang
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Memuat wishlist...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Wishlist</h2>
          <p className="text-muted mb-0">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {wishlist.length > 0 && (
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={clearWishlist}
            className="px-3 py-2"
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Kosongkan Wishlist
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {wishlist.length === 0 ? (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faHeartBroken} size="4x" className="text-muted mb-4" />
          <h4 className="mb-3">Wishlist Kosong</h4>
          <p className="text-muted mb-4">
            Anda belum menambahkan produk apapun ke wishlist
          </p>
          <Button as={Link} to="/products" variant="primary" size="lg">
            Mulai Belanja
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {wishlist.map((item) => (
            <Col key={item.id} lg={3} md={4} sm={6}>
              <Card 
                className="border-0 h-100"
                style={{ 
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div className="position-relative">
                  <div 
                    style={{ 
                      height: '200px',
                      background: item.product.image || (item.product.images && item.product.images[0])
                        ? `url(${process.env.REACT_APP_API_URL}/uploads/${item.product.image || item.product.images[0].image}) center/cover no-repeat`
                        : '#f8f9fa',
                      borderRadius: '12px 12px 0 0'
                    }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2 rounded-circle"
                    style={{ width: '32px', height: '32px', padding: '0' }}
                    onClick={() => removeFromWishlist(item.product.id)}
                    disabled={actionLoading[item.product.id]}
                  >
                    {actionLoading[item.product.id] ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    )}
                  </Button>
                </div>
                
                <Card.Body className="p-3">
                  <div className="mb-2">
                    <small className="text-muted">
                      {item.product.category?.name}
                    </small>
                  </div>
                  
                  <h6 className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                    <Link 
                      to={`/products/${item.product.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {item.product.name}
                    </Link>
                  </h6>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-primary">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(item.product.price)}
                    </h5>
                  </div>
                  
                  <div className="d-grid mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddToCart(item.product)}
                      disabled={actionLoading[`cart-${item.product.id}`]}
                      className="fw-semibold"
                      style={{ borderRadius: '8px' }}
                    >
                      {actionLoading[`cart-${item.product.id}`] ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                      )}
                      Tambah ke Keranjang
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Wishlist;