import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Card, Row, Col, Form, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faShoppingCart, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import CartContext from '../contexts/CartContext';
import AuthContext from '../contexts/AuthContext';

const Cart = () => {
  const { cartItems, loading, error, removeFromCart, updateCartItem, getSubtotal } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groupedItems, setGroupedItems] = useState({});
  const [processingItem, setProcessingItem] = useState(null);

  // Group cart items by category
  useEffect(() => {
    const grouped = cartItems.reduce((acc, item) => {
      const categoryId = item.product?.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {});
    
    setGroupedItems(grouped);
  }, [cartItems]);

  // Handle quantity change
  const handleQuantityChange = async (cartId, quantity) => {
    if (quantity < 1) return;
    
    setProcessingItem(cartId);
    await updateCartItem(cartId, quantity);
    setProcessingItem(null);
  };

  // Handle remove item
  const handleRemoveItem = async (cartId) => {
    setProcessingItem(cartId);
    await removeFromCart(cartId);
    setProcessingItem(null);
  };

  // Get price for an item
  const getItemPrice = (item) => {
    return item.variation ? 
      (item.variation.price || item.product.price) : 
      item.product.price;
  };

  // Calculate subtotal for a category
  const getCategorySubtotal = (items) => {
    return items.reduce((total, item) => {
      const price = getItemPrice(item);
      return total + (parseFloat(price) * item.quantity);
    }, 0);
  };

  if (!currentUser) {
    return (
      <Alert variant="info">
        <Alert.Heading>Anda belum login</Alert.Heading>
        <p>Silakan login terlebih dahulu untuk melihat keranjang belanja Anda.</p>
        <div className="d-flex justify-content-end">
          <Button variant="outline-info" as={Link} to="/login">
            Login Sekarang
          </Button>
        </div>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Memuat keranjang belanja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Terjadi Kesalahan</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center my-5">
        <FontAwesomeIcon icon={faShoppingCart} size="4x" className="text-muted mb-3" />
        <h3>Keranjang Belanja Kosong</h3>
        <p className="text-muted">Anda belum menambahkan produk apapun ke keranjang.</p>
        <Button as={Link} to="/products" variant="primary" className="mt-3">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Belanja Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Keranjang Belanja</h2>
      
      {Object.keys(groupedItems).map((categoryId) => {
        const items = groupedItems[categoryId];
        const categorySubtotal = getCategorySubtotal(items);
        
        return (
          <Card key={categoryId} className="mb-4 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Kategori: {items[0]?.product?.category?.name || 'Produk'}</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Harga</th>
                    <th>Jumlah</th>
                    <th>Total</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const itemPrice = getItemPrice(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img 
                              src={item.product?.image ? `/${item.product.image}` : '/placeholder.jpg'} 
                              alt={item.product?.name} 
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                            />
                            <div>
                              <Link to={`/products/${item.product_id}`} className="text-decoration-none">
                                {item.product?.name || 'Produk'}
                              </Link>
                              {item.variation && (
                                <small className="d-block text-muted">
                                  {item.variation.size && item.variation.color ? 
                                    `${item.variation.size} - ${item.variation.color}` : ''}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>Rp {parseFloat(itemPrice).toLocaleString('id-ID')}</td>
                        <td style={{ width: '120px' }}>
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                            disabled={processingItem === item.id}
                            size="sm"
                          />
                        </td>
                        <td>Rp {(parseFloat(itemPrice) * item.quantity).toLocaleString('id-ID')}</td>
                        <td>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={processingItem === item.id}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                    <td colSpan="2"><strong>Rp {categorySubtotal.toLocaleString('id-ID')}</strong></td>
                  </tr>
                </tfoot>
              </Table>
              <div className="d-flex justify-content-end">
                <Button 
                  as={Link} 
                  to={`/checkout?category=${categoryId}`} 
                  variant="success"
                >
                  Checkout
                </Button>
              </div>
            </Card.Body>
          </Card>
        );
      })}
      
      <Row className="mt-4">
        <Col md={6} className="ms-auto">
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Ringkasan Belanja</h5>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Total Produk:</span>
                <span>{cartItems.length} item</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Total Harga:</span>
                <span className="fw-bold">Rp {getSubtotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="d-grid mt-3">
                <Button 
                  as={Link} 
                  to="/checkout" 
                  variant="primary" 
                  size="lg"
                >
                  Checkout Semua
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cart; 