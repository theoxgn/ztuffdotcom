import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faPercent } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    min_purchase: '',
    max_discount: '',
    start_date: '',
    end_date: '',
    target_type: 'all',
    target_ids: [],
    is_active: true,
    priority: 0
  });

  // Fetch discounts
  useEffect(() => {
    fetchDiscounts();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/discounts');
      setDiscounts(Array.isArray(response.data.data.discounts) ? response.data.data.discounts : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError('Gagal memuat data diskon. Silakan coba lagi nanti.');
      setDiscounts([]);
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(Array.isArray(response.data.data.products) ? response.data.data.products : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Handle target IDs change
  const handleTargetIdsChange = (e) => {
    const { value } = e.target;
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, target_ids: selectedOptions });
  };

  // Handle add discount button
  const handleAddDiscount = () => {
    setModalMode('add');
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      start_date: formatDateForInput(new Date()),
      end_date: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
      target_type: 'all',
      target_ids: [],
      is_active: true,
      priority: 0
    });
    setShowModal(true);
  };

  // Handle edit discount button
  const handleEditDiscount = (discount) => {
    setModalMode('edit');
    setSelectedDiscount(discount);
    
    let targetIds = [];
    if (discount.target_ids) {
      try {
        targetIds = JSON.parse(discount.target_ids);
      } catch (e) {
        targetIds = [];
      }
    }
    
    setFormData({
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      min_purchase: discount.min_purchase || '',
      max_discount: discount.max_discount || '',
      start_date: formatDateForInput(new Date(discount.start_date)),
      end_date: discount.end_date ? formatDateForInput(new Date(discount.end_date)) : '',
      target_type: discount.target_type,
      target_ids: targetIds,
      is_active: discount.is_active,
      priority: discount.priority || 0
    });
    setShowModal(true);
  };

  // Format date for input field
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        target_ids: formData.target_type === 'all' ? null : formData.target_ids
      };
      
      if (modalMode === 'add') {
        await axios.post('/api/discounts', submitData);
      } else {
        await axios.put(`/api/discounts/${selectedDiscount.id}`, submitData);
      }
      
      setShowModal(false);
      fetchDiscounts();
    } catch (err) {
      setError(`Gagal ${modalMode === 'add' ? 'menambahkan' : 'mengubah'} diskon. Silakan coba lagi.`);
    }
  };

  // Handle delete discount
  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus diskon ini?')) {
      try {
        await axios.delete(`/api/discounts/${discountId}`);
        fetchDiscounts();
      } catch (err) {
        setError('Gagal menghapus diskon. Silakan coba lagi.');
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get discount status badge
  const getStatusBadge = (discount) => {
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = discount.end_date ? new Date(discount.end_date) : null;
    
    if (!discount.is_active) {
      return <Badge bg="secondary">Tidak Aktif</Badge>;
    } else if (now < startDate) {
      return <Badge bg="info">Akan Datang</Badge>;
    } else if (endDate && now > endDate) {
      return <Badge bg="danger">Kadaluarsa</Badge>;
    } else {
      return <Badge bg="success">Aktif</Badge>;
    }
  };

  // Get target display name
  const getTargetDisplay = (discount) => {
    if (discount.target_type === 'all') {
      return 'Semua Produk';
    }
    
    let targetIds = [];
    try {
      targetIds = JSON.parse(discount.target_ids || '[]');
    } catch (e) {
      return 'Invalid';
    }
    
    if (discount.target_type === 'category') {
      const targetNames = targetIds.map(id => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : id;
      });
      return `Kategori: ${targetNames.join(', ')}`;
    }
    
    if (discount.target_type === 'product') {
      const targetNames = targetIds.map(id => {
        const product = products.find(p => p.id === id);
        return product ? product.name : id;
      });
      return `Produk: ${targetNames.join(', ')}`;
    }
    
    return discount.target_type;
  };

  if (loading && discounts.length === 0) {
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
        <h2>Pengelolaan Diskon</h2>
        <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" onClick={handleAddDiscount}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Tambah Diskon
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Nilai</th>
                <th>Target</th>
                <th>Periode</th>
                <th>Status</th>
                <th>Prioritas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td>
                    <strong>{discount.name}</strong>
                    {discount.description && (
                      <small className="d-block text-muted">
                        {discount.description}
                      </small>
                    )}
                  </td>
                  <td>
                    {discount.type === 'percentage' 
                      ? `${discount.value}%` 
                      : formatCurrency(discount.value)}
                    {discount.max_discount && discount.type === 'percentage' && (
                      <small className="d-block text-muted">
                        Maks. {formatCurrency(discount.max_discount)}
                      </small>
                    )}
                    {discount.min_purchase > 0 && (
                      <small className="d-block text-muted">
                        Min. {formatCurrency(discount.min_purchase)}
                      </small>
                    )}
                  </td>
                  <td>
                    <small>{getTargetDisplay(discount)}</small>
                  </td>
                  <td>
                    <small>
                      {formatDate(discount.start_date)} - 
                      {discount.end_date ? formatDate(discount.end_date) : ' Tidak terbatas'}
                    </small>
                  </td>
                  <td>{getStatusBadge(discount)}</td>
                  <td>
                    <Badge bg="info">{discount.priority}</Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleEditDiscount(discount)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleDeleteDiscount(discount.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Tidak ada diskon yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Discount Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faPercent} className="me-2" />
            {modalMode === 'add' ? 'Tambah Diskon' : 'Edit Diskon'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Diskon *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Flash Sale 50%"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prioritas</Form.Label>
                  <Form.Control
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Angka lebih tinggi = prioritas lebih tinggi
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Deskripsi diskon (opsional)"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipe Diskon *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nilai Diskon *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      required
                      min="0"
                      step={formData.type === 'percentage' ? '0.1' : '1000'}
                      max={formData.type === 'percentage' ? '100' : undefined}
                    />
                    <InputGroup.Text>
                      {formData.type === 'percentage' ? '%' : 'Rp'}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimal Pembelian</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>Rp</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="min_purchase"
                      value={formData.min_purchase}
                      onChange={handleChange}
                      min="0"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maksimal Diskon</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>Rp</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="max_discount"
                      value={formData.max_discount}
                      onChange={handleChange}
                      min="0"
                      disabled={formData.type !== 'percentage'}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Hanya untuk diskon persentase
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Mulai *</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Berakhir</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Kosongkan untuk tidak terbatas
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Target Diskon *</Form.Label>
              <Form.Select
                name="target_type"
                value={formData.target_type}
                onChange={handleChange}
              >
                <option value="all">Semua Produk</option>
                <option value="category">Kategori Tertentu</option>
                <option value="product">Produk Tertentu</option>
              </Form.Select>
            </Form.Group>

            {formData.target_type === 'category' && (
              <Form.Group className="mb-3">
                <Form.Label>Pilih Kategori</Form.Label>
                <Form.Select
                  multiple
                  name="target_ids"
                  value={formData.target_ids}
                  onChange={handleTargetIdsChange}
                  size={5}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Tahan Ctrl untuk memilih multiple kategori
                </Form.Text>
              </Form.Group>
            )}

            {formData.target_type === 'product' && (
              <Form.Group className="mb-3">
                <Form.Label>Pilih Produk</Form.Label>
                <Form.Select
                  multiple
                  name="target_ids"
                  value={formData.target_ids}
                  onChange={handleTargetIdsChange}
                  size={5}
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Tahan Ctrl untuk memilih multiple produk
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                label="Aktif"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" type="submit">
              {modalMode === 'add' ? 'Tambah' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Discounts;