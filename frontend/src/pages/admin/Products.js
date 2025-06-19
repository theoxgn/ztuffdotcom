import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Row, Col, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faSave, faArrowLeft, faUpload, faImage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { ConfirmDialog, LoadingSpinner, useToast } from '../../components';

// Product List Component
const ProductList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/products');
      setProducts(Array.isArray(response.data.data.products) ? response.data.data.products : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = 'Gagal memuat data produk. Silakan coba lagi nanti.';
      setError(errorMessage);
      toast.error(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(Array.isArray(response.data.data.categories) ? response.data.data.categories : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/admin/products/${productToDelete.id}`);
      toast.success(`Produk "${productToDelete.name}" berhasil dihapus`);
      fetchProducts();
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Gagal menghapus produk. Silakan coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter products by search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryId = selectedCategory ? parseInt(selectedCategory, 10) : null;
    const matchesCategory = selectedCategory === '' || (categoryId && !isNaN(categoryId) && product.category_id === categoryId);
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
    return <LoadingSpinner text="Memuat data produk..." />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pengelolaan Produk</h2>
        <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => navigate('/admin/products/add')}>
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
                  <td>
                    <img 
                      src={product.image || '/default.webp'} 
                      alt={product.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                    />
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
                      className="me-2 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Tidak ada produk yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteProduct}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

// Product Form Component (for Add/Edit)
const ProductForm = ({ mode = 'add' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [variations, setVariations] = useState([]);
  const [showVariationModal, setShowVariationModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    status: 'active',
    weight: '',
    dimensions: '',
    image: null
  });

  const [newVariation, setNewVariation] = useState({
    name: '',
    type: 'size',
    values: ['']
  });

  // Fetch categories and product data if editing
  useEffect(() => {
    fetchCategories();
    if (mode === 'edit' && id) {
      fetchProduct();
    }
  }, [mode, id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(Array.isArray(response.data.data.categories) ? response.data.data.categories : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/products/${id}`);
      const product = response.data.data.product;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        category_id: product.category_id || '',
        status: product.status || 'active',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        image: null
      });

      if (product.image) {
        setImagePreview(product.image);
      }

      if (product.variations) {
        setVariations(product.variations);
      }

    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('File harus berupa gambar (JPEG, PNG, atau WebP)');
        return;
      }
      
      // Validate file size (max 10MB for products)
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariationChange = (field, value) => {
    setNewVariation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVariationValueChange = (index, value) => {
    setNewVariation(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  const addVariationValue = () => {
    setNewVariation(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const removeVariationValue = (index) => {
    setNewVariation(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const addVariation = () => {
    if (newVariation.name && newVariation.values.some(v => v.trim())) {
      setVariations(prev => [...prev, {
        ...newVariation,
        values: newVariation.values.filter(v => v.trim())
      }]);
      setNewVariation({
        name: '',
        type: 'size',
        values: ['']
      });
      setShowVariationModal(false);
    }
  };

  const removeVariation = (index) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!formData.name?.trim()) {
      setError('Nama produk harus diisi');
      setLoading(false);
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Harga produk harus lebih dari 0');
      setLoading(false);
      return;
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('Stok tidak boleh negatif');
      setLoading(false);
      return;
    }
    
    if (!formData.category_id) {
      setError('Kategori harus dipilih');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          submitData.append('image', formData[key]);
        } else if (key !== 'image') {
          submitData.append(key, formData[key]);
        }
      });

      // Append variations
      if (variations.length > 0) {
        submitData.append('variations', JSON.stringify(variations));
      }

      const url = mode === 'add' 
        ? '/api/admin/products' 
        : `/api/admin/products/${id}`;
      
      const method = mode === 'add' ? 'post' : 'put';
      
      await axios[method](url, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const successMessage = `Produk berhasil ${mode === 'add' ? 'ditambahkan' : 'diperbarui'}!`;
      setSuccess(successMessage);
      toast.success(successMessage);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);

    } catch (err) {
      console.error('Error submitting product:', err);
      const errorMessage = err.response?.data?.message || `Gagal ${mode === 'add' ? 'menambahkan' : 'memperbarui'} produk.`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{mode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</h2>
        <Button variant="outline-secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => navigate('/admin/products')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="admin-form">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Produk *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Masukkan nama produk"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Deskripsi</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Masukkan deskripsi produk"
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Harga *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>Rp</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          placeholder="0"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stok *</Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        required
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Berat (gram)</Form.Label>
                      <Form.Control
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Kategori *</Form.Label>
                      <Form.Select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak Aktif</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Dimensi (PxLxT cm)</Form.Label>
                  <Form.Control
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    placeholder="contoh: 20x15x10"
                  />
                </Form.Group>

                {/* Product Variations */}
                <Card className="mb-3">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Variasi Produk</h6>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="px-3 py-2 fw-semibold"
                        onClick={() => setShowVariationModal(true)}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Tambah Variasi
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {variations.length === 0 ? (
                      <p className="text-muted mb-0">Belum ada variasi produk</p>
                    ) : (
                      variations.map((variation, index) => (
                        <div key={index} className="border rounded p-3 mb-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6>{variation.name} ({variation.type})</h6>
                              <div className="d-flex flex-wrap gap-1">
                                {variation.values.map((value, i) => (
                                  <Badge key={i} bg="secondary">{value}</Badge>
                                ))}
                              </div>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeVariation(index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Gambar Produk</Form.Label>
                  <div className="border rounded p-3 text-center">
                    <div>
                      <img 
                        src={imagePreview || '/default.webp'} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                        className="rounded mb-2"
                      />
                      {imagePreview && (
                        <>
                          <br />
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: null }));
                            }}
                          >
                            Hapus Gambar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-2"
                  />
                  <Form.Text className="text-muted">
                    Format: JPG, PNG, GIF. Maksimal 2MB.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                type="button"
                className="px-3 py-2 fw-semibold"
                onClick={() => navigate('/admin/products')}
                disabled={loading}
              >
                Batal
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                type="submit"
                className="px-4 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {mode === 'add' ? 'Menambah...' : 'Memperbarui...'}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    {mode === 'add' ? 'Tambah Produk' : 'Perbarui Produk'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Variation Modal */}
      <Modal show={showVariationModal} onHide={() => setShowVariationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tambah Variasi Produk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Variasi</Form.Label>
                  <Form.Control
                    type="text"
                    value={newVariation.name}
                    onChange={(e) => handleVariationChange('name', e.target.value)}
                    placeholder="contoh: Ukuran, Warna"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipe Variasi</Form.Label>
                  <Form.Select
                    value={newVariation.type}
                    onChange={(e) => handleVariationChange('type', e.target.value)}
                  >
                    <option value="size">Ukuran</option>
                    <option value="color">Warna</option>
                    <option value="material">Material</option>
                    <option value="other">Lainnya</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Nilai Variasi</Form.Label>
              {newVariation.values.map((value, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={value}
                    onChange={(e) => handleVariationValueChange(index, e.target.value)}
                    placeholder="contoh: S, M, L atau Merah, Biru, Hijau"
                  />
                  {newVariation.values.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="ms-2 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => removeVariationValue(index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="outline-primary" 
                size="sm"
                className="px-3 py-2 fw-semibold"
                onClick={addVariationValue}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Tambah Nilai
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => setShowVariationModal(false)}>
            Batal
          </Button>
          <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" onClick={addVariation}>
            Tambah Variasi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
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