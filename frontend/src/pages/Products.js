import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Pagination, Badge } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faSortAmountDown, faSortAmountUp, faHeart, faTimes, faPercent } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import WishlistContext from '../contexts/WishlistContext';
import AuthContext from '../contexts/AuthContext';

const Products = () => {
  const { currentUser } = useContext(AuthContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
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
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [productDiscounts, setProductDiscounts] = useState({});

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get page from URL or default to 1
        const page = searchParams.get('page') || 1;
        const pageNum = parseInt(page, 10);
        setCurrentPage(!isNaN(pageNum) && pageNum > 0 ? pageNum : 1);
        
        // Sync state with URL parameters
        const urlSearchTerm = searchParams.get('search') || '';
        const urlCategory = searchParams.get('category') || '';
        const urlSort = searchParams.get('sort') || 'newest';
        const urlMin = searchParams.get('min') || '';
        const urlMax = searchParams.get('max') || '';
        
        setSearchTerm(urlSearchTerm);
        setSelectedCategory(urlCategory);
        setSortBy(urlSort);
        setPriceMin(urlMin);
        setPriceMax(urlMax);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', 12); // Products per page
        
        if (urlSearchTerm) params.append('search', urlSearchTerm);
        if (urlCategory) params.append('category', urlCategory);
        if (urlSort && urlSort !== 'newest') params.append('sort', urlSort);
        if (urlMin) params.append('min', urlMin);
        if (urlMax) params.append('max', urlMax);
        
        // Fetch products
        const productsResponse = await axios.get(`/api/products?${params.toString()}`);
        const productsData = Array.isArray(productsResponse.data.data.products) ? productsResponse.data.data.products : [];
        setProducts(productsData);
        setTotalPages(productsResponse.data.data.totalPages || 1);
        
        // Fetch active discounts
        try {
          const discountsResponse = await axios.get('/api/discounts/active');
          const activeDiscounts = discountsResponse.data.data.discounts || [];
          
          // Create a map of product ID to best applicable discount
          const discountMap = {};
          productsData.forEach(product => {
            const applicableDiscounts = activeDiscounts.filter(discount => {
              if (discount.target_type === 'all') return true;
              
              if (discount.target_type === 'category') {
                try {
                  const targetIds = JSON.parse(discount.target_ids || '[]');
                  return targetIds.includes(product.category_id);
                } catch (e) {
                  return false;
                }
              }
              
              if (discount.target_type === 'product') {
                try {
                  const targetIds = JSON.parse(discount.target_ids || '[]');
                  return targetIds.includes(product.id);
                } catch (e) {
                  return false;
                }
              }
              
              return false;
            });
            
            if (applicableDiscounts.length > 0) {
              // Get the best discount (highest priority, then highest value)
              const bestDiscount = applicableDiscounts.sort((a, b) => {
                if (a.priority !== b.priority) return b.priority - a.priority;
                return b.value - a.value;
              })[0];
              
              discountMap[product.id] = bestDiscount;
            }
          });
          
          setProductDiscounts(discountMap);
        } catch (discountError) {
          console.error('Error fetching discounts:', discountError);
          setProductDiscounts({});
        }
        
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

  // Calculate discounted price for a product
  const calculateDiscountedPrice = (product) => {
    // Safety check
    if (!product || !product.price) {
      return { originalPrice: 0, discountedPrice: 0, discount: null };
    }
    
    const discount = productDiscounts[product.id];
    const basePrice = parseFloat(product.price);
    
    if (!discount) {
      return { originalPrice: basePrice, discountedPrice: basePrice, discount: null };
    }
    
    let discountAmount = 0;
    
    if (discount.type === 'percentage') {
      discountAmount = (basePrice * discount.value) / 100;
      if (discount.max_discount && discountAmount > discount.max_discount) {
        discountAmount = discount.max_discount;
      }
    } else {
      discountAmount = discount.value;
    }
    
    const discountedPrice = Math.max(0, basePrice - discountAmount);
    
    return { 
      originalPrice: basePrice, 
      discountedPrice: discountedPrice, 
      discount: discount,
      discountAmount: discountAmount 
    };
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams({ search: searchTerm, page: 1 });
  };

  // Handle filter changes
  const applyFilters = () => {
    const newParams = {
      page: 1
    };
    
    // Only add non-empty values
    if (searchTerm) newParams.search = searchTerm;
    if (selectedCategory) newParams.category = selectedCategory;
    if (sortBy && sortBy !== 'newest') newParams.sort = sortBy;
    if (priceMin) newParams.min = priceMin;
    if (priceMax) newParams.max = priceMax;
    
    updateSearchParams(newParams);
    setShowFilters(false); // Hide filters after applying
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
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  // Handle sort change with immediate application
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const newParams = {
      page: 1,
      sort: newSort !== 'newest' ? newSort : undefined
    };
    
    // Preserve other filters
    if (searchTerm) newParams.search = searchTerm;
    if (selectedCategory) newParams.category = selectedCategory;
    if (priceMin) newParams.min = priceMin;
    if (priceMax) newParams.max = priceMax;
    
    updateSearchParams(newParams);
  };

  // Handle category change with immediate application
  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
    const newParams = {
      page: 1,
      category: newCategory || undefined
    };
    
    // Preserve other filters
    if (searchTerm) newParams.search = searchTerm;
    if (sortBy && sortBy !== 'newest') newParams.sort = sortBy;
    if (priceMin) newParams.min = priceMin;
    if (priceMax) newParams.max = priceMax;
    
    updateSearchParams(newParams);
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId) => {
    if (!currentUser) {
      // Could redirect to login or show login modal
      return;
    }

    try {
      setWishlistLoading(prev => ({ ...prev, [productId]: true }));
      await toggleWishlist(productId);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
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
              <Button variant="primary" type="submit" className="px-3">
                <FontAwesomeIcon icon={faSearch} />
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={6} className="d-flex justify-content-md-end">
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="px-3 py-2 fw-semibold"
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
                    onChange={(e) => handleCategoryChange(e.target.value)}
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
                    onChange={(e) => handleSortChange(e.target.value)}
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
                size="sm"
                className="me-2 px-3 py-2 fw-semibold"
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button 
                variant="primary"
                size="sm"
                className="px-3 py-2 fw-semibold"
                onClick={applyFilters}
              >
                Terapkan Filter
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Active Filters Display */}
      {(searchTerm || selectedCategory || (sortBy && sortBy !== 'newest') || priceMin || priceMax) && (
        <div className="mb-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted me-2">Filter aktif:</span>
            {searchTerm && (
              <span className="badge bg-primary">
                Pencarian: {searchTerm}
                <button 
                  className="btn-close btn-close-white ms-2 small"
                  onClick={() => {
                    setSearchTerm('');
                    updateSearchParams({ search: undefined, page: 1 });
                  }}
                ></button>
              </span>
            )}
            {selectedCategory && (
              <span className="badge bg-info">
                Kategori: {categories.find(c => c.id === selectedCategory)?.name}
                <button 
                  className="btn-close btn-close-white ms-2 small"
                  onClick={() => handleCategoryChange('')}
                ></button>
              </span>
            )}
            {sortBy && sortBy !== 'newest' && (
              <span className="badge bg-success">
                Urutan: {
                  sortBy === 'oldest' ? 'Terlama' :
                  sortBy === 'price_asc' ? 'Harga: Rendah-Tinggi' :
                  sortBy === 'price_desc' ? 'Harga: Tinggi-Rendah' :
                  sortBy === 'name_asc' ? 'Nama: A-Z' :
                  sortBy === 'name_desc' ? 'Nama: Z-A' : sortBy
                }
                <button 
                  className="btn-close btn-close-white ms-2 small"
                  onClick={() => handleSortChange('newest')}
                ></button>
              </span>
            )}
            {(priceMin || priceMax) && (
              <span className="badge bg-warning">
                Harga: {priceMin ? `Rp ${parseInt(priceMin).toLocaleString('id-ID')}` : '0'} - {priceMax ? `Rp ${parseInt(priceMax).toLocaleString('id-ID')}` : '∞'}
                <button 
                  className="btn-close btn-close-white ms-2 small"
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                    const newParams = { page: 1, min: undefined, max: undefined };
                    if (searchTerm) newParams.search = searchTerm;
                    if (selectedCategory) newParams.category = selectedCategory;
                    if (sortBy && sortBy !== 'newest') newParams.sort = sortBy;
                    updateSearchParams(newParams);
                  }}
                ></button>
              </span>
            )}
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={resetFilters}
              className="ms-2"
            >
              <FontAwesomeIcon icon={faTimes} className="me-1" />
              Reset Semua
            </Button>
          </div>
        </div>
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
              size="sm"
              onClick={resetFilters}
              className="mt-2 px-4 py-2 fw-semibold rounded-pill"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <Row>
            {products.map(product => {
              const priceInfo = calculateDiscountedPrice(product);
              
              return (
                <Col key={product.id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm product-card">
                    <div className="product-image-container position-relative">
                      <Card.Img 
                        variant="top" 
                        src={product.image ? `${process.env.REACT_APP_API_URL}${product.image}` : '/default.webp'} 
                        alt={product.name}
                        className="product-image"
                        onError={(e) => { e.target.src = '/default.webp'; }}
                        style={{ height: '250px', objectFit: 'cover' }}
                      />
                      
                      {/* Discount Badge */}
                      {priceInfo.discount && (
                        <div className="position-absolute top-0 start-0 p-2">
                          <Badge bg="danger" className="rounded-pill">
                            -{priceInfo.discount.type === 'percentage' ? `${priceInfo.discount.value}%` : `Rp ${priceInfo.discount.value.toLocaleString('id-ID')}`}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="position-absolute top-0 end-0 p-2">
                        <Button
                          variant={isInWishlist(product.id) ? "danger" : "light"}
                          size="sm"
                          className="rounded-circle border-0"
                          style={{ width: '32px', height: '32px', padding: '0' }}
                          onClick={() => handleWishlistToggle(product.id)}
                          disabled={wishlistLoading[product.id]}
                        >
                          {wishlistLoading[product.id] ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <FontAwesomeIcon 
                              icon={faHeart} 
                              className={isInWishlist(product.id) ? "text-white" : "text-danger"} 
                            />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="product-title">
                        {product.name}
                      </Card.Title>
                      <div className="text-muted mb-2 small">
                        {product.category?.name || 'Umum'}
                      </div>
                      
                      {/* Price Display */}
                      {priceInfo.discount ? (
                        <div className="mb-1">
                          <div className="text-primary fw-bold">
                            Rp {priceInfo.discountedPrice.toLocaleString('id-ID')}
                          </div>
                          <small className="text-muted text-decoration-line-through">
                            Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                          </small>
                        </div>
                      ) : (
                        <Card.Text className="text-primary fw-bold mb-1">
                          Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                        </Card.Text>
                      )}
                      
                      <div className="mt-auto pt-3">
                        <Button 
                          as={Link} 
                          to={`/products/${product.id}`} 
                          variant="primary" 
                          size="sm"
                          className="w-100 py-2 fw-semibold rounded-pill"
                        >
                          Lihat Detail
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
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