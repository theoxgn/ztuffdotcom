import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel, Spinner, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faShoppingCart, faEye } from '@fortawesome/free-solid-svg-icons';

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
    <div className="animate-fade-in">
      {/* Hero Section */}
      <Carousel className="mb-5 hero-carousel">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="/banner1.jpg"
            onError={(e) => { e.target.src = '/default.webp'; }}
            alt="Premium Products"
            style={{ height: '500px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h1>Ztuff.com</h1>
            <p className="lead">Trusted Online Marketplace with Quality Products</p>
            <Button as={Link} to="/products" variant="light" size="lg" className="rounded-pill px-5 py-3 mt-3 fw-semibold">
              Shop Now
            </Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="/banner2.jpg"
            onError={(e) => { e.target.src = '/default.webp'; }}
            alt="Easy Shipping"
            style={{ height: '500px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h1>Fast & Reliable Shipping</h1>
            <p className="lead">We handle everything from packaging to delivery</p>
            <Button as={Link} to="/tutorial" variant="light" size="lg" className="rounded-pill px-5 py-3 mt-3 fw-semibold">
              Learn More
            </Button>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* Categories Section */}
      <section className="mb-5 py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Shop by Category</h2>
            <Link to="/products" className="text-decoration-none fw-bold">
              View All <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Link>
          </div>
          
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : categories.length === 0 ? (
            <p>No categories available at the moment.</p>
          ) : (
            <Row>
              {categories.map(category => (
                <Col key={category.id} md={3} sm={6} className="mb-4">
                  <Card className="category-card border-0 h-100">
                    <Card.Img 
                      src={category.image || '/default.webp'} 
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/default.webp'; }}
                    />
                    <div className="category-overlay">
                      <h5 className="mb-0">{category.name}</h5>
                    </div>
                    <Card.Body className="text-center p-3">
                      <Button 
                        as={Link} 
                        to={`/products?category=${category.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="w-100 rounded-pill py-2 fw-semibold"
                      >
                        Browse Products
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="mb-5 py-4 bg-light">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Products</h2>
            <Link to="/products" className="text-decoration-none fw-bold">
              View All <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Link>
          </div>
          
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : featuredProducts.length === 0 ? (
            <p>No featured products available at the moment.</p>
          ) : (
            <Row>
              {featuredProducts.slice(0, 4).map(product => (
                <Col key={product.id} md={3} sm={6} className="mb-4">
                  <Card className="product-card h-100 border-0">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={product.image || '/default.webp'} 
                        style={{ height: '250px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/default.webp'; }}
                      />
                      <div className="product-actions position-absolute w-100 d-flex justify-content-center" 
                           style={{ bottom: '10px', opacity: 0, transition: 'opacity 0.3s ease' }}>
                        <Button 
                          as={Link}
                          to={`/products/${product.id}`}
                          variant="light" 
                          size="sm"
                          className="rounded-circle d-flex align-items-center justify-content-center mx-1 shadow-sm"
                          style={{ width: '36px', height: '36px', padding: '0' }}
                        >
                          <FontAwesomeIcon icon={faEye} size="sm" />
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          className="rounded-circle d-flex align-items-center justify-content-center mx-1 shadow-sm"
                          style={{ width: '36px', height: '36px', padding: '0' }}
                        >
                          <FontAwesomeIcon icon={faShoppingCart} size="sm" />
                        </Button>
                      </div>
                    </div>
                    <Card.Body className="p-3">
                      <Card.Title className="product-title">{product.name}</Card.Title>
                      <Card.Text className="product-price">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(product.price)}
                      </Card.Text>
                      <Button 
                        as={Link} 
                        to={`/products/${product.id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="w-100 rounded-pill mt-2 py-2 fw-semibold"
                      >
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Banner Section */}
      <section className="mb-5">
        <Container>
          <div className="position-relative rounded overflow-hidden">
            <img 
              src="/promo.jpg"
              onError={(e) => { e.target.src = '/default.webp'; }} 
              alt="Special Offer" 
              className="w-100" 
              style={{ height: '300px', objectFit: 'cover' }}
            />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center">
              <div className="container">
                <div className="row">
                  <div className="col-md-6">
                    <div className="bg-white bg-opacity-75 p-4 rounded">
                      <h2>Special Offer</h2>
                      <p className="lead">Get 20% off on your first order</p>
                      <Button variant="primary" size="lg" className="rounded-pill px-5 py-3 fw-semibold">
                        Shop Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Tutorial Section */}
      <section className="mb-5 py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Shopping Guide</h2>
            <Link to="/tutorial" className="text-decoration-none fw-bold">
              View All <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Link>
          </div>
          
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : tutorials.length === 0 ? (
            <p>No tutorials available at the moment.</p>
          ) : (
            <Row>
              {tutorials.slice(0, 3).map(tutorial => (
                <Col key={tutorial.id} md={4} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Img 
                      variant="top" 
                      src={tutorial.image || '/default.webp'} 
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/default.webp'; }}
                    />
                    <Card.Body className="p-4">
                      <Card.Title>{tutorial.title}</Card.Title>
                      <Card.Text>
                        {tutorial.content ? tutorial.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No description available'}
                      </Card.Text>
                      <Button 
                        as={Link} 
                        to={`/tutorial/${tutorial.id}`} 
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill px-4 py-2 fw-semibold"
                      >
                        Read More
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Features Section */}
      <section className="mb-5 py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">Why Choose Us</h2>
          <Row className="text-center">
            <Col md={3} sm={6} className="mb-4">
              <div className="p-3">
                <div className="feature-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                  <i className="fas fa-shipping-fast fa-2x"></i>
                </div>
                <h5>Fast Shipping</h5>
                <p className="text-muted">Quick delivery to your customers</p>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <div className="p-3">
                <div className="feature-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                  <i className="fas fa-box-open fa-2x"></i>
                </div>
                <h5>Quality Products</h5>
                <p className="text-muted">Carefully selected merchandise</p>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <div className="p-3">
                <div className="feature-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                  <i className="fas fa-headset fa-2x"></i>
                </div>
                <h5>24/7 Support</h5>
                <p className="text-muted">Always ready to assist you</p>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-4">
              <div className="p-3">
                <div className="feature-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '70px', height: '70px' }}>
                  <i className="fas fa-undo fa-2x"></i>
                </div>
                <h5>Easy Returns</h5>
                <p className="text-muted">Hassle-free return policy</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home; 