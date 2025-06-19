import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faShoppingCart, 
  faEye, 
  faUserTie,
  faUsers,
  faChartLine,
  faShoppingBag,
  faStar,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch featured products
        const productsResponse = await axios.get('/api/products/featured');
        setFeaturedProducts(Array.isArray(productsResponse.data.data.products) ? productsResponse.data.data.products : []);
        
        // Fetch categories
        const categoriesResponse = await axios.get('/api/categories');
        setCategories(Array.isArray(categoriesResponse.data.data.categories) ? categoriesResponse.data.data.categories : []);
        
        // Fetch tutorials
        const tutorialsResponse = await axios.get('/api/tutorials');
        setTutorials(Array.isArray(tutorialsResponse.data.data.tutorials) ? tutorialsResponse.data.data.tutorials : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        setFeaturedProducts([]);
        setCategories([]);
        setTutorials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Hero Banner Section */}
      <section className="position-relative overflow-hidden" style={{ backgroundColor: '#f8f9fb' }}>
        <Container fluid className="px-0">
          <div 
            className="position-relative text-center text-white d-flex align-items-center justify-content-center"
            style={{
              minHeight: '60vh',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%), url("/banner1.jpg") center/cover no-repeat',
              borderRadius: '0 0 24px 24px'
            }}
          >
            <div className="position-relative" style={{ zIndex: 2 }}>
              <h1 className="display-3 fw-bold mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.02em' }}>
                Temukan Ztuff Terbaik
              </h1>
              <p className="fs-4 mb-5 opacity-90" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                Produk berkualitas dengan harga terbaik
              </p>
              <Button 
                as={Link} 
                to="/products" 
                size="lg"
                className="px-5 py-3 fw-semibold border-0"
                style={{ 
                  backgroundColor: '#1976d2',
                  borderRadius: '8px',
                  fontSize: '1.1rem'
                }}
              >
                Belanja Sekarang
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="py-5" style={{ backgroundColor: '#ffffff' }}>
        <Container>
          <div className="mb-5">
            <h2 className="fw-bold mb-2" style={{ color: '#1a1a1a', fontSize: '2rem' }}>Kategori</h2>
            <p className="text-muted mb-0">Temukan produk sesuai kebutuhan Anda</p>
          </div>
          
          <Row className="g-3">
            {categories.slice(0, 8).map((category) => (
              <Col key={category.id} lg={3} md={4} sm={6} xs={12}>
                <Link 
                  to={`/products?category=${category.id}`}
                  className="text-decoration-none"
                >
                  <Card 
                    className="border-0 h-100 category-card"
                    style={{ 
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <Card.Body className="p-4 text-center">
                      <div 
                        className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          background: category.image 
                            ? `url(${category.image.includes('uploads/') 
                                ? `${process.env.REACT_APP_API_URL}/${category.image}` 
                                : `${process.env.REACT_APP_API_URL}/uploads/categories/${category.image}`
                              }) center/cover no-repeat`
                            : '#1976d2'
                        }}
                      >
                        {!category.image && (
                          <FontAwesomeIcon 
                            icon={faShoppingBag} 
                            className="text-white" 
                            size="lg" 
                          />
                        )}
                      </div>
                      <h6 className="fw-semibold mb-0" style={{ color: '#1a1a1a' }}>{category.name}</h6>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="py-5" style={{ backgroundColor: '#f8f9fb' }}>
        <Container>
          <div className="mb-5">
            <h2 className="fw-bold mb-2" style={{ color: '#1a1a1a', fontSize: '2rem' }}>Produk Pilihan</h2>
            <p className="text-muted mb-0">Produk terbaik dengan kualitas terpercaya</p>
          </div>
          
          <Row className="g-3">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <Col key={product.id} lg={3} md={6} sm={6}>
                <Card 
                  className="border-0 h-100 product-card"
                  style={{ 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="position-relative">
                    <div 
                      style={{ 
                        height: '200px',
                        background: product.image || (product.images && product.images[0])
                          ? `url(${process.env.REACT_APP_API_URL}/uploads/${product.image || product.images[0].image}) center/cover no-repeat`
                          : '#f8f9fa'
                      }}
                    />
                    {index === 0 && (
                      <div className="position-absolute top-0 start-0 p-2">
                        <span 
                          className="badge fw-semibold px-2 py-1"
                          style={{ 
                            backgroundColor: '#1976d2',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}
                        >
                          Terlaris
                        </span>
                      </div>
                    )}
                  </div>
                  <Card.Body className="p-3">
                    <h6 className="fw-semibold mb-2" style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>{product.name}</h6>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="fw-bold mb-0" style={{ color: '#1976d2' }}>
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(product.price)}
                        </h5>
                      </div>
                      <Button 
                        as={Link}
                        to={`/products/${product.id}`}
                        size="sm"
                        className="px-3 py-1 fw-semibold border-0"
                        style={{ 
                          backgroundColor: '#1976d2',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}
                      >
                        Lihat
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div className="text-center mt-4">
            <Button 
              as={Link} 
              to="/products" 
              variant="outline-primary"
              className="px-4 py-2 fw-semibold"
              style={{ 
                borderRadius: '8px',
                borderColor: '#1976d2',
                color: '#1976d2'
              }}
            >
              Lihat Semua Produk
            </Button>
          </div>
        </Container>
      </section>

      {/* Promo Banner */}
      <section className="py-5" style={{ backgroundColor: '#ffffff' }}>
        <Container>
          <div 
            className="text-center p-5 position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              borderRadius: '16px',
              color: 'white'
            }}
          >
            <h2 className="fw-bold mb-3" style={{ fontSize: '2rem' }}>
              Bergabung dengan Ztuff
            </h2>
            <p className="fs-5 mb-4 opacity-90">
              Dapatkan penawaran eksklusif dan akses ke produk terbaru
            </p>
            <Button 
              as={Link}
              to="/register"
              variant="light" 
              size="lg" 
              className="px-4 py-2 fw-semibold border-0"
              style={{ borderRadius: '8px', color: '#1976d2' }}
            >
              Daftar Sekarang
            </Button>
          </div>
        </Container>
      </section>

      {/* Panduan Dropship */}
      <section className="py-5" style={{ backgroundColor: '#f8f9fb' }}>
        <Container>
          <div className="mb-5">
            <h2 className="fw-bold mb-2" style={{ color: '#1a1a1a', fontSize: '2rem' }}>Panduan Sukses</h2>
            <p className="text-muted mb-0">Tips dan panduan untuk kesuksesan bisnis Anda</p>
          </div>
          
          <Row className="g-3">
            <Col md={4}>
              <Card 
                className="border-0 h-100 text-center"
                style={{ 
                  borderRadius: '12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <Card.Body className="p-4">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: '#1976d2'
                    }}
                  >
                    <FontAwesomeIcon icon={faUserTie} className="text-white" size="lg" />
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Cara Memulai</h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Pelajari langkah-langkah mudah untuk memulai bisnis dropship dengan sukses
                  </p>
                  <Button 
                    as={Link}
                    to="/tutorial"
                    variant="outline-primary" 
                    size="sm"
                    className="px-3 py-2 fw-semibold"
                    style={{ 
                      borderRadius: '8px',
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }}
                  >
                    Pelajari Sekarang
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card 
                className="border-0 h-100 text-center"
                style={{ 
                  borderRadius: '12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <Card.Body className="p-4">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: '#1976d2'
                    }}
                  >
                    <FontAwesomeIcon icon={faUsers} className="text-white" size="lg" />
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Strategi Marketing</h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Tips dan trik untuk memasarkan produk dengan efektif dan mencapai target
                  </p>
                  <Button 
                    as={Link}
                    to="/tutorial"
                    variant="outline-primary" 
                    size="sm"
                    className="px-3 py-2 fw-semibold"
                    style={{ 
                      borderRadius: '8px',
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }}
                  >
                    Pelajari Sekarang
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card 
                className="border-0 h-100 text-center"
                style={{ 
                  borderRadius: '12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <Card.Body className="p-4">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: '#1976d2'
                    }}
                  >
                    <FontAwesomeIcon icon={faChartLine} className="text-white" size="lg" />
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Analisis Profit</h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    Cara menghitung dan memaksimalkan keuntungan dalam bisnis dropship
                  </p>
                  <Button 
                    as={Link}
                    to="/tutorial"
                    variant="outline-primary" 
                    size="sm"
                    className="px-3 py-2 fw-semibold"
                    style={{ 
                      borderRadius: '8px',
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }}
                  >
                    Pelajari Sekarang
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <style jsx>{`
        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
        }
        
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;