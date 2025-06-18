import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faSortAmountDown, faSortAmountUp } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [priceMin, setPriceMin] = useState(searchParams.get('min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('max') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get page from URL or default to 1
        const page = searchParams.get('page') || 1;
        setCurrentPage(parseInt(page));
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', 12); // Products per page
        
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        if (sortBy) params.append('sort', sortBy);
        if (priceMin) params.append('min', priceMin);
        if (priceMax) params.append('max', priceMax);
        
        // Fetch products
        const productsResponse = await axios.get(`/api/products?${params.toString()}`);
        setProducts(Array.isArray(productsResponse.data.data.products) ? productsResponse.data.data.products : []);
        setTotalPages(productsResponse.data.data.totalPages || 1);
        
        // Fetch categories (only once)
        if (categories.length === 0) {
          const categoriesResponse = await axios.get('/api/categories');
          setCategories(Array.isArray(categoriesResponse.data.data.categories) ? categoriesResponse.data.data.categories : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data. Silakan coba lagi.');
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, categories.length]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams({ search: searchTerm, page: 1 });
  };

  // Handle filter changes
  const applyFilters = () => {
    updateSearchParams({
      category: selectedCategory,
      sort: sortBy,
      min: priceMin,
      max: priceMax,
      page: 1
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    updateSearchParams({ page });
    window.scrollTo(0, 0);
  };

  // Update search params
  const updateSearchParams = (params) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setPriceMin('');
    setPriceMax('');
    
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    newParams.set('page', 1);
    
    setSearchParams(newParams);
  };

  // Generate pagination items
  const paginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev"
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    items.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Pages around current page
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
      if (page > 1 && page < totalPages) {
        items.push(
          <Pagination.Item 
            key={page} 
            active={currentPage === page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Last page if there are more than 1 page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next"
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
    
    return items;
  };

  return (
    <div>
      <h2 className="mb-4">Produk</h2>
      
      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={6} className="d-flex justify-content-md-end">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} className="me-1" />
            Filter & Urutkan
          </Button>
        </Col>
      </Row>
      
      {/* Filters */}
      {showFilters && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Urutkan</Form.Label>
                  <Form.Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="price_asc">Harga: Rendah ke Tinggi</option>
                    <option value="price_desc">Harga: Tinggi ke Rendah</option>
                    <option value="name_asc">Nama: A-Z</option>
                    <option value="name_desc">Nama: Z-A</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Harga Minimum</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Rp"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>Harga Maksimum</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Rp"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-2">
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button 
                variant="primary"
                onClick={applyFilters}
              >
                Terapkan Filter
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Products Grid */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Memuat produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center my-5">
          <h4>Tidak ada produk yang ditemukan</h4>
          <p className="text-muted">Coba ubah filter atau kata kunci pencarian Anda</p>
          {(searchTerm || selectedCategory || priceMin || priceMax) && (
            <Button 
              variant="outline-primary" 
              onClick={resetFilters}
              className="mt-2"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <Row>
            {products.map(product => (
              <Col key={product.id} lg={3} md={4} sm={6} className="mb-4">
                <Card className="h-100 shadow-sm product-card">
                  <div className="product-image-container">
                    <Card.Img 
                      variant="top" 
                      src={product.image || '/default.webp'} 
                      alt={product.name}
                      className="product-image"
                      onError={(e) => { e.target.src = '/default.webp'; }}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="product-title">
                      {product.name}
                    </Card.Title>
                    <div className="text-muted mb-2 small">
                      {product.category?.name || 'Umum'}
                    </div>
                    <Card.Text className="text-primary fw-bold mb-0">
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>{paginationItems()}</Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products; 