import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
        const productsResponse = await axios.get('http://localhost:5000/api/products/featured');
        setFeaturedProducts(productsResponse.data.data.products || []);
        
        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:5000/api/categories');
        setCategories(categoriesResponse.data.data.categories || []);
        
        // Fetch tutorials
        const tutorialsResponse = await axios.get('http://localhost:5000/api/tutorials');
        setTutorials(tutorialsResponse.data.data.tutorials || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data. Silakan coba lagi.');
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
        <p className="mt-2">Memuat data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="/banner1.jpg"
            alt="First slide"
            style={{ height: '400px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h3>Dropshipedia</h3>
            <p>Platform dropship terbaik untuk memulai bisnis online Anda.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="/banner2.jpg"
            alt="Second slide"
            style={{ height: '400px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h3>Produk Berkualitas</h3>
            <p>Berbagai pilihan produk berkualitas dengan harga terbaik.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* Featured Products Section */}
      <section className="mb-5">
        <h2 className="mb-4">Produk Unggulan</h2>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : featuredProducts.length === 0 ? (
          <p>Tidak ada produk unggulan saat ini.</p>
        ) : (
          <Row>
            {featuredProducts.slice(0, 4).map(product => (
              <Col key={product.id} md={3} sm={6} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={product.image ? `http://localhost:5000/${product.image}` : '/placeholder.jpg'} 
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text className="text-muted mb-0">
                      Rp {parseFloat(product.price).toLocaleString('id-ID')}
                    </Card.Text>
                    <div className="mt-auto pt-3">
                      <Button 
                        as={Link} 
                        to={`/products/${product.id}`} 
                        variant="primary" 
                        className="w-100"
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <div className="text-center mt-3">
          <Button as={Link} to="/products" variant="outline-primary">
            Lihat Semua Produk
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-5">
        <h2 className="mb-4">Kategori</h2>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : categories.length === 0 ? (
          <p>Tidak ada kategori saat ini.</p>
        ) : (
          <Row>
            {categories.map(category => (
              <Col key={category.id} md={3} sm={6} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={category.image ? `http://localhost:5000/${category.image}` : '/placeholder.jpg'} 
                    style={{ height: '150px', objectFit: 'cover' }}
                  />
                  <Card.Body className="text-center">
                    <Card.Title>{category.name}</Card.Title>
                    <Button 
                      as={Link} 
                      to={`/products?category=${category.id}`} 
                      variant="outline-primary" 
                      className="mt-2"
                    >
                      Lihat Produk
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </section>

      {/* Tutorial Section */}
      <section className="mb-5">
        <h2 className="mb-4">Tutorial</h2>
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : tutorials.length === 0 ? (
          <p>Tidak ada tutorial saat ini.</p>
        ) : (
          <Row>
            {tutorials.slice(0, 3).map(tutorial => (
              <Col key={tutorial.id} md={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={tutorial.image ? `http://localhost:5000/${tutorial.image}` : '/placeholder.jpg'} 
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title>{tutorial.nama}</Card.Title>
                    <Card.Text>
                      {tutorial.description.substring(0, 100)}...
                    </Card.Text>
                    <Button 
                      as={Link} 
                      to={`/tutorial/${tutorial.id}`} 
                      variant="outline-primary"
                    >
                      Baca Selengkapnya
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <div className="text-center mt-3">
          <Button as={Link} to="/tutorial" variant="outline-primary">
            Lihat Semua Tutorial
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home; 