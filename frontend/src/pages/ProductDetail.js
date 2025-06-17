import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Alert, Form, Tabs, Tab, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import CartContext from '../contexts/CartContext';
import AuthContext from '../contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
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

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(response.data.data.product);
        setVariations(response.data.data.variations || []);
        
        // If there's only one variation, select it by default
        if (response.data.data.variations?.length === 1) {
          setSelectedVariation(response.data.data.variations[0]);
          setSelectedSize(response.data.data.variations[0].size || '');
          setSelectedColor(response.data.data.variations[0].color || '');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Gagal memuat produk. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentUser) {
      setCartMessage({ type: 'danger', text: 'Silakan login terlebih dahulu untuk menambahkan produk ke keranjang.' });
      return;
    }

    try {
      setAddingToCart(true);
      setCartMessage(null);
      
      const result = await addToCart(
        product.id,
        quantity,
        selectedVariation?.id,
        selectedSize,
        selectedColor
      );
      
      if (result.success) {
        setCartMessage({ type: 'success', text: 'Produk berhasil ditambahkan ke keranjang.' });
      } else {
        setCartMessage({ type: 'danger', text: result.message });
      }
    } catch (error) {
      setCartMessage({ type: 'danger', text: 'Gagal menambahkan produk ke keranjang. Silakan coba lagi.' });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Memuat produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Terjadi Kesalahan</Alert.Heading>
        <p>{error || 'Produk tidak ditemukan.'}</p>
        <Button as={Link} to="/products" variant="outline-danger">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali ke Daftar Produk
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Button as={Link} to="/products" variant="outline-primary" size="sm">
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
          Kembali ke Daftar Produk
        </Button>
      </div>
      
      <Row>
        <Col md={6} className="mb-4">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="product-main-image mb-3">
                <Image 
                  src={`http://localhost:5000/${product.images[activeImage].image}`}
                  alt={product.name}
                  fluid
                  className="rounded shadow-sm"
                  style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                />
              </div>
              <Row>
                {product.images.map((image, index) => (
                  <Col xs={3} key={image.id} className="mb-2">
                    <Image 
                      src={`http://localhost:5000/${image.image}`}
                      alt={`${product.name} - ${index + 1}`}
                      thumbnail
                      className={`cursor-pointer ${activeImage === index ? 'border-primary' : ''}`}
                      onClick={() => setActiveImage(index)}
                      style={{ height: '80px', objectFit: 'cover' }}
                    />
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <Image 
              src={product.image ? `http://localhost:5000/${product.image}` : '/placeholder.jpg'}
              alt={product.name}
              fluid
              className="rounded shadow-sm"
              style={{ width: '100%', height: '400px', objectFit: 'cover' }}
            />
          )}
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2>{product.name}</h2>
              <p className="text-muted mb-2">Kategori: {product.category?.name || 'Umum'}</p>
              
              <h3 className="text-primary mb-3">
                Rp {parseFloat(selectedVariation?.price || product.price).toLocaleString('id-ID')}
              </h3>
              
              {product.stock > 0 ? (
                <Badge bg="success" className="mb-3">Tersedia</Badge>
              ) : (
                <Badge bg="danger" className="mb-3">Stok Habis</Badge>
              )}
              
              <Form className="mt-4">
                {sizes.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Ukuran</Form.Label>
                    <Form.Select 
                      value={selectedSize} 
                      onChange={handleSizeChange}
                      required
                    >
                      <option value="">Pilih Ukuran</option>
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                
                {colors.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Warna</Form.Label>
                    <Form.Select 
                      value={selectedColor} 
                      onChange={handleColorChange}
                      required
                    >
                      <option value="">Pilih Warna</option>
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                
                <Form.Group className="mb-4">
                  <Form.Label>Jumlah</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    max={selectedVariation?.stock || product.stock}
                  />
                </Form.Group>
                
                {cartMessage && (
                  <Alert variant={cartMessage.type} className="mb-3">
                    {cartMessage.text}
                  </Alert>
                )}
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={
                      addingToCart || 
                      (variations.length > 0 && !selectedVariation) ||
                      (product.stock <= 0)
                    }
                  >
                    <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                    {addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mt-4 shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="description" className="mb-3">
                <Tab eventKey="description" title="Deskripsi">
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                </Tab>
                <Tab eventKey="details" title="Detail">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td>Berat</td>
                        <td>{product.weight} gram</td>
                      </tr>
                      <tr>
                        <td>Stok</td>
                        <td>{selectedVariation?.stock || product.stock}</td>
                      </tr>
                    </tbody>
                  </table>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetail; 