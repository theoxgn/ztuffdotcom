import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Product List Component
const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/products');
      setProducts(response.data.data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data produk. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/products/${productId}`);
        fetchProducts();
      } catch (err) {
        setError('Gagal menghapus produk. Silakan coba lagi.');
      }
    }
  };

  // Filter products by search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock <= 0) {
      return <Badge bg="danger">Habis</Badge>;
    } else if (stock < 10) {
      return <Badge bg="warning">Hampir Habis</Badge>;
    } else {
      return <Badge bg="success">Tersedia</Badge>;
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pengelolaan Produk</h2>
        <Button variant="primary" onClick={() => navigate('/admin/products/add')}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Tambah Produk
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap gap-3">
            <div className="flex-grow-1">
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div style={{ minWidth: '200px' }}>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faFilter} />
                </InputGroup.Text>
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
              </InputGroup>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Gambar</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div 
                        className="bg-light d-flex align-items-center justify-content-center"
                        style={{ width: '50px', height: '50px' }}
                      >
                        No img
                      </div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>
                    {categories.find(c => c.id === product.category_id)?.name || '-'}
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock} {getStockBadge(product.stock)}</td>
                  <td>
                    <Badge bg={product.status === 'active' ? 'success' : 'secondary'}>
                      {product.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Tidak ada produk yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

// Product Form Component (for Add/Edit)
const ProductForm = ({ mode = 'add' }) => {
  // Implementation will be added later
  return <div>Form Produk {mode === 'add' ? 'Tambah' : 'Edit'}</div>;
};

// Main Products Component
const Products = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductList />} />
      <Route path="/add" element={<ProductForm mode="add" />} />
      <Route path="/edit/:id" element={<ProductForm mode="edit" />} />
    </Routes>
  );
};

export default Products; 