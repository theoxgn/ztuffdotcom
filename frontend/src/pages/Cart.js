import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Card, Row, Col, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faShoppingCart, faArrowLeft, faPercent } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import CartContext from '../contexts/CartContext';
import AuthContext from '../contexts/AuthContext';

const Cart = () => {
  const { cartItems, loading, error, removeFromCart, updateCartItem, getSubtotal, calculateItemDiscount, getTotalDiscount, getDiscountedSubtotal } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groupedItems, setGroupedItems] = useState({});
  const [processingItem, setProcessingItem] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);

  // Group cart items by category
  useEffect(() => {
    if (!Array.isArray(cartItems)) {
      setGroupedItems({});
      return;
    }
    
    const grouped = cartItems.reduce((acc, item) => {
      if (!item || !item.product) return acc;
      const categoryId = item.product?.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {});
    
    setGroupedItems(grouped);
  }, [cartItems]);

  // Fetch active discounts
  useEffect(() => {
    const fetchActiveDiscounts = async () => {
      try {
        setDiscountsLoading(true);
        const response = await axios.get('/api/discounts/active');
        setDiscounts(response.data.data.discounts || []);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setDiscounts([]);
      } finally {
        setDiscountsLoading(false);
      }
    };

    fetchActiveDiscounts();
  }, []);

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
    if (!item || !item.product) return 0;
    return item.variation ? 
      (item.variation?.price || item.product?.price || 0) : 
      (item.product?.price || 0);
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
          <Button variant="outline-info" as={Link} to="/login" size="sm" className="px-4 py-2 fw-semibold rounded-pill">
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
        <Button as={Link} to="/products" variant="primary" size="lg" className="mt-3 px-5 py-3 fw-semibold rounded-pill">
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
                    const itemDiscount = calculateItemDiscount(item, discounts);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img 
                              src={item.product?.image ? `${process.env.REACT_APP_API_URL}${item.product.image}` : '/default.webp'} 
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
                              {itemDiscount.discount && (
                                <div className="mt-1">
                                  <Badge bg="danger" className="rounded-pill">
                                    <FontAwesomeIcon icon={faPercent} className="me-1" />
                                    {itemDiscount.discount.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {itemDiscount.discount ? (
                            <div>
                              <div className="text-primary fw-bold">
                                Rp {itemDiscount.discountedPrice.toLocaleString('id-ID')}
                              </div>
                              <small className="text-muted text-decoration-line-through">
                                Rp {itemDiscount.originalPrice.toLocaleString('id-ID')}
                              </small>
                            </div>
                          ) : (
                            <div>Rp {parseFloat(itemPrice).toLocaleString('id-ID')}</div>
                          )}
                        </td>
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
                        <td>
                          {itemDiscount.discount ? (
                            <div>
                              <div className="text-primary fw-bold">
                                Rp {(itemDiscount.discountedPrice * item.quantity).toLocaleString('id-ID')}
                              </div>
                              <small className="text-muted text-decoration-line-through">
                                Rp {(itemDiscount.originalPrice * item.quantity).toLocaleString('id-ID')}
                              </small>
                            </div>
                          ) : (
                            <div>Rp {(parseFloat(itemPrice) * item.quantity).toLocaleString('id-ID')}</div>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="danger" 
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={processingItem === item.id}
                            style={{ width: '32px', height: '32px' }}
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
                  size="sm"
                  className="px-4 py-2 fw-semibold rounded-pill"
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
              
              {/* Original Subtotal */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span className={getTotalDiscount(discounts) > 0 ? "text-muted text-decoration-line-through" : "fw-bold"}>
                  Rp {getSubtotal().toLocaleString('id-ID')}
                </span>
              </div>
              
              {/* Discount Information */}
              {getTotalDiscount(discounts) > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>
                      <FontAwesomeIcon icon={faPercent} className="me-1" />
                      Total Diskon:
                    </span>
                    <span>-Rp {getTotalDiscount(discounts).toLocaleString('id-ID')}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-bold">Total Setelah Diskon:</span>
                    <span className="fw-bold text-primary">
                      Rp {getDiscountedSubtotal(discounts).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-center">
                    <small className="text-success">
                      🎉 Anda hemat Rp {getTotalDiscount(discounts).toLocaleString('id-ID')}!
                    </small>
                  </div>
                </>
              )}
              
              {!getTotalDiscount(discounts) && (
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total Harga:</span>
                  <span className="fw-bold">Rp {getSubtotal().toLocaleString('id-ID')}</span>
                </div>
              )}
              
              <div className="d-grid mt-3">
                <Button 
                  as={Link} 
                  to="/checkout" 
                  variant="primary" 
                  size="lg"
                  className="px-5 py-3 fw-bold rounded-pill"
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