import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Alert, Form, Tabs, Tab, Image, Badge, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faArrowLeft, 
  faHeart, 
  faShare, 
  faStar, 
  faShieldAlt, 
  faTruck, 
  faUndo,
  faPercent 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import CartContext from '../contexts/CartContext';
import AuthContext from '../contexts/AuthContext';
import WishlistContext from '../contexts/WishlistContext';
import { ReviewForm, ReviewList } from '../components';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/products/${id}`);
        const productData = response.data.data.product;
        const variationsData = productData.variations || response.data.data.variations || [];
        
        setProduct(productData);
        setVariations(variationsData);
        
        // If there's only one variation, select it by default
        if (variationsData.length === 1) {
          setSelectedVariation(variationsData[0]);
          setSelectedSize(variationsData[0].size || '');
          setSelectedColor(variationsData[0].color || '');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product) return;
      
      try {
        setRelatedLoading(true);
        
        // Fetch products from the same category
        const response = await axios.get(`/api/products?category=${product.category?.id}&limit=8`);
        const products = response.data.data.products || [];
        
        // Filter out current product and limit to 4 products
        const filtered = products
          .filter(p => p.id !== product.id)
          .slice(0, 4);
        
        setRelatedProducts(filtered);
      } catch (error) {
        console.error('Error fetching related products:', error);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  // Fetch product discounts
  useEffect(() => {
    const fetchProductDiscounts = async () => {
      if (!product) return;
      
      try {
        setDiscountsLoading(true);
        
        const response = await axios.get(`/api/discounts/product/${product.id}`);
        const discountsData = response.data.data.discounts || [];
        
        setDiscounts(discountsData);
      } catch (error) {
        console.error('Error fetching product discounts:', error);
        setDiscounts([]);
      } finally {
        setDiscountsLoading(false);
      }
    };

    fetchProductDiscounts();
  }, [product]);

  // Handle size change
  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);
    
    // Find variation with this size and current color
    const variation = variations.find(v => 
      v.size === size && 
      (selectedColor === '' || v.color === selectedColor)
    );
    
    if (variation) {
      setSelectedVariation(variation);
      setSelectedColor(variation.color || '');
    } else {
      setSelectedVariation(null);
    }
  };

  // Handle color change
  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    
    // Find variation with this color and current size
    const variation = variations.find(v => 
      v.color === color && 
      (selectedSize === '' || v.size === selectedSize)
    );
    
    if (variation) {
      setSelectedVariation(variation);
      setSelectedSize(variation.size || '');
    } else {
      setSelectedVariation(null);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Get unique sizes and colors
  const sizes = [...new Set(variations.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variations.map(v => v.color).filter(Boolean))];

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    // Return default values if product is not loaded yet
    if (!product) {
      return { originalPrice: 0, discountedPrice: 0, discount: null };
    }
    
    const basePrice = parseFloat(selectedVariation?.price || product.price);
    
    if (discounts.length === 0) {
      return { originalPrice: basePrice, discountedPrice: basePrice, discount: null };
    }
    
    // Get the best discount (highest priority, then highest value)
    const bestDiscount = discounts[0];
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

  const priceInfo = calculateDiscountedPrice();

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!currentUser) {
      setCartMessage({ type: 'warning', text: 'Please login first to add products to your wishlist.' });
      return;
    }

    try {
      setWishlistLoading(true);
      await toggleWishlist(product.id);
      
      const message = isInWishlist(product.id) 
        ? 'Product removed from wishlist.' 
        : 'Product added to wishlist.';
      setCartMessage({ type: 'success', text: message });
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      setCartMessage({ type: 'danger', text: 'Failed to update wishlist. Please try again.' });
    } finally {
      setWishlistLoading(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentUser) {
      setCartMessage({ type: 'danger', text: 'Please login first to add products to your cart.' });
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage(null);
      
      const result = await addToCart(
        product.id,
        quantity,
        selectedVariation?.id
      );
      
      if (result.success) {
        setCartMessage({ type: 'success', text: 'Product successfully added to cart.' });
      } else {
        setCartMessage({ type: 'danger', text: result.message });
      }
    } catch (error) {
      setCartMessage({ type: 'danger', text: 'Failed to add product to cart. Please try again.' });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Alert variant="danger">
        <Alert.Heading>An Error Occurred</Alert.Heading>
        <p>{error || 'Product not found.'}</p>
        <Button as={Link} to="/products" variant="outline-danger" size="sm" className="px-3 py-2 fw-semibold rounded-pill">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Products
        </Button>
      </Alert>
    );
  }

  return (
    <div className="animate-fade-in">
      <Container>
        <div className="mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
              <li className="breadcrumb-item"><Link to={`/products?category=${product.category?.id}`}>{product.category?.name || 'General'}</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
            </ol>
          </nav>
        </div>
        
        <Row className="mb-5">
          <Col lg={6} className="mb-4">
            <div className="product-gallery">
              {product.images && product.images.length > 0 ? (
                <>
                  <div className="product-main-image mb-3">
                    <Image 
                      src={product.images[activeImage].image ? `${process.env.REACT_APP_API_URL}${product.images[activeImage].image}` : '/default.webp'}
                      alt={product.name}
                      fluid
                      className="rounded"
                      style={{ width: '100%', height: '500px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                      onError={(e) => { e.target.src = '/default.webp'; }}
                    />
                  </div>
                  <Row className="g-2">
                    {product.images.map((image, index) => (
                      <Col xs={3} key={image.id}>
                        <Image 
                          src={image.image ? `${process.env.REACT_APP_API_URL}${image.image}` : '/default.webp'}
                          alt={`${product.name} - ${index + 1}`}
                          className={`cursor-pointer rounded ${activeImage === index ? 'border border-2 border-primary' : 'border'}`}
                          onClick={() => setActiveImage(index)}
                          style={{ height: '80px', width: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = '/default.webp'; }}
                        />
                      </Col>
                    ))}
                  </Row>
                </>
              ) : (
                <Image 
                  src={product.image ? `${process.env.REACT_APP_API_URL}${product.image}` : '/default.webp'}
                  alt={product.name}
                  fluid
                  className="rounded"
                  style={{ width: '100%', height: '500px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                  onError={(e) => { e.target.src = '/default.webp'; }}
                />
              )}
            </div>
          </Col>
          
          <Col lg={6}>
            <div className="product-info">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <Badge bg="primary" className="rounded-pill px-3 py-2">{product.category?.name || 'Product'}</Badge>
                <div>
                  <Button 
                    variant={isInWishlist(product.id) ? "danger" : "light"} 
                    size="sm" 
                    className="rounded-circle me-2" 
                    style={{ width: '36px', height: '36px', padding: '0' }} 
                    title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                  >
                    {wishlistLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon 
                        icon={faHeart} 
                        size="sm" 
                        className={isInWishlist(product.id) ? "text-white" : "text-danger"} 
                      />
                    )}
                  </Button>
                  <Button variant="light" size="sm" className="rounded-circle" style={{ width: '36px', height: '36px', padding: '0' }} title="Share">
                    <FontAwesomeIcon icon={faShare} size="sm" />
                  </Button>
                </div>
              </div>
              
              <h1 className="mb-3">{product.name}</h1>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  {priceInfo.discount ? (
                    <div>
                      <h3 className="text-primary fw-bold mb-1">
                        Rp {priceInfo.discountedPrice.toLocaleString('id-ID')}
                      </h3>
                      <div className="d-flex align-items-center">
                        <span className="text-muted text-decoration-line-through me-2">
                          Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                        </span>
                        <Badge bg="danger" className="rounded-pill">
                          -{priceInfo.discount.type === 'percentage' ? `${priceInfo.discount.value}%` : `Rp ${priceInfo.discount.value.toLocaleString('id-ID')}`}
                        </Badge>
                      </div>
                      <small className="text-success">
                        Hemat Rp {priceInfo.discountAmount.toLocaleString('id-ID')}
                      </small>
                    </div>
                  ) : (
                    <h2 className="text-primary fw-bold mb-0">
                      Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                    </h2>
                  )}
                </div>
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center me-2">
                      {Array.from({ length: 5 }, (_, index) => (
                        <FontAwesomeIcon
                          key={index}
                          icon={faStar}
                          className={index < Math.round(reviewStats.averageRating) ? 'text-warning' : 'text-muted'}
                          size="sm"
                        />
                      ))}
                    </div>
                    <span className="text-muted">
                      {reviewStats.averageRating} ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                {product.stock > 0 ? (
                  <Badge bg="success" className="rounded-pill px-3 py-2">In Stock</Badge>
                ) : (
                  <Badge bg="danger" className="rounded-pill px-3 py-2">Out of Stock</Badge>
                )}
              </div>

              {/* Active Discounts */}
              {discounts.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">🔥 Promo Aktif</h6>
                  {discounts.map((discount) => (
                    <div key={discount.id} className="discount-badge mb-2">
                      <Badge bg="warning" className="rounded-pill px-3 py-2 me-2">
                        <FontAwesomeIcon icon={faPercent} className="me-1" />
                        {discount.name}
                      </Badge>
                      {discount.description && (
                        <small className="text-muted d-block mt-1">
                          {discount.description}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="product-description mb-4">
                <p className="text-muted">{product.description?.replace(/<[^>]*>/g, '').substring(0, 200)}...</p>
              </div>
              
              <Form className="product-form">
                {colors.length > 0 && (
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Warna</Form.Label>
                    <div className="d-flex flex-wrap">
                      {colors.map(color => (
                        <Button 
                          key={color} 
                          variant={selectedColor === color ? 'primary' : 'outline-secondary'}
                          size="sm"
                          className="me-2 mb-2 px-3 py-2 fw-semibold"
                          onClick={() => handleColorChange({ target: { value: color } })}
                          style={{ 
                            minWidth: '80px',
                            borderRadius: '20px'
                          }}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                {sizes.length > 0 && (
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Ukuran</Form.Label>
                    <div className="d-flex flex-wrap">
                      {sizes.map(size => (
                        <div 
                          key={size} 
                          onClick={() => handleSizeChange({ target: { value: size } })}
                          className={`size-option me-2 mb-2 d-flex align-items-center justify-content-center ${selectedSize === size ? 'bg-primary text-white' : 'bg-light'}`}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Jumlah</Form.Label>
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="light" 
                      size="sm"
                      className="border px-3 py-2"
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      max={selectedVariation?.stock || product.stock}
                      className="text-center mx-2"
                      style={{ width: '80px' }}
                    />
                    <Button 
                      variant="light"
                      size="sm"
                      className="border px-3 py-2"
                      onClick={() => quantity < (selectedVariation?.stock || product.stock) && setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </Form.Group>
                
                {cartMessage && (
                  <Alert variant={cartMessage.type} className="mb-4">
                    {cartMessage.text}
                  </Alert>
                )}
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="rounded-pill px-5 py-3 fw-bold flex-grow-1"
                    onClick={handleAddToCart}
                    disabled={
                      addingToCart || 
                      (variations.length > 0 && !selectedVariation) ||
                      (product.stock <= 0)
                    }
                  >
                    <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant={isInWishlist(product.id) ? "danger" : "outline-danger"}
                    size="lg"
                    className="rounded-pill px-4 py-3"
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    style={{ minWidth: '60px' }}
                  >
                    {wishlistLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon 
                        icon={faHeart} 
                        className={isInWishlist(product.id) ? "text-white" : "text-danger"} 
                      />
                    )}
                  </Button>
                </div>
              </Form>
              
              <hr className="my-4" />
              
              <div className="product-features">
                <div className="d-flex mb-3">
                  <div className="me-3">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-1">Original Product Guarantee</h6>
                    <p className="text-muted small mb-0">All products are 100% original</p>
                  </div>
                </div>
                
                <div className="d-flex mb-3">
                  <div className="me-3">
                    <FontAwesomeIcon icon={faTruck} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-1">Fast Shipping</h6>
                    <p className="text-muted small mb-0">Delivery within 2-5 business days</p>
                  </div>
                </div>
                
                <div className="d-flex">
                  <div className="me-3">
                    <FontAwesomeIcon icon={faUndo} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-1">Easy Returns</h6>
                    <p className="text-muted small mb-0">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        
        <div className="product-details mb-5">
          <Tabs defaultActiveKey="description" className="mb-4">
            <Tab eventKey="description" title="Description">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {product.description}
                  </div>
                </Card.Body>
              </Card>
            </Tab>
            <Tab eventKey="specifications" title="Specifications">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <table className="table">
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="30%">Weight</td>
                        <td>{product.weight} grams</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Stock</td>
                        <td>{selectedVariation?.stock || product.stock} units</td>
                      </tr>
                      {product.dimensions && (
                        <tr>
                          <td className="fw-bold">Dimensions</td>
                          <td>{product.dimensions}</td>
                        </tr>
                      )}
                      {product.material && (
                        <tr>
                          <td className="fw-bold">Material</td>
                          <td>{product.material}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            </Tab>
            <Tab eventKey="reviews" title={`Reviews ${reviewStats ? `(${reviewStats.totalReviews})` : ''}`}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Customer Reviews</h5>
                    {currentUser && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setShowReviewForm(true)}
                      >
                        Write Review
                      </Button>
                    )}
                  </div>
                  <ReviewList 
                    productId={product.id} 
                    onReviewsLoaded={setReviewStats}
                  />
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </div>
        
        <div className="related-products">
          <h3 className="mb-4">You May Also Like</h3>
          {relatedLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading related products...</p>
            </div>
          ) : relatedProducts.length > 0 ? (
            <Row className="g-4">
              {relatedProducts.map(relatedProduct => (
                <Col md={6} lg={3} key={relatedProduct.id}>
                  <Card className="h-100 shadow-sm border-0 product-card">
                    <div className="position-relative overflow-hidden">
                      <Card.Img 
                        variant="top" 
                        src={relatedProduct.image ? `${process.env.REACT_APP_API_URL}${relatedProduct.image}` : '/default.webp'}
                        alt={relatedProduct.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/default.webp'; }}
                      />
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge bg="primary" className="rounded-pill">
                          {relatedProduct.category?.name || 'Product'}
                        </Badge>
                      </div>
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h6 mb-2" style={{ minHeight: '48px' }}>
                        {relatedProduct.name}
                      </Card.Title>
                      <Card.Text className="text-muted small mb-2" style={{ minHeight: '40px' }}>
                        {relatedProduct.description?.replace(/<[^>]*>/g, '').substring(0, 80)}...
                      </Card.Text>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-primary fw-bold mb-0">
                            Rp {parseFloat(relatedProduct.price).toLocaleString('id-ID')}
                          </h5>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faStar} className="text-warning me-1" size="sm" />
                            <small className="text-muted">{reviewStats?.averageRating || '0.0'}</small>
                          </div>
                        </div>
                        <Button 
                          as={Link} 
                          to={`/products/${relatedProduct.id}`}
                          variant="primary" 
                          size="sm" 
                          className="w-100 rounded-pill fw-semibold"
                        >
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center text-muted">
              <p>No related products found.</p>
            </div>
          )}
        </div>
        
        {/* Review Form Modal */}
        <ReviewForm 
          show={showReviewForm}
          onHide={() => setShowReviewForm(false)}
          productId={product.id}
          onReviewSubmitted={() => {
            // Refresh review stats after new review
            window.location.reload();
          }}
        />
      </Container>
    </div>
  );
};

export default ProductDetail; 