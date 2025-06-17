import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage', // 'percentage' or 'fixed'
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    status: 'active'
  });

  // Fetch vouchers
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/vouchers');
      setVouchers(response.data.data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data voucher. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle add voucher button
  const handleAddVoucher = () => {
    setModalMode('add');
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_discount: '',
      start_date: formatDateForInput(new Date()),
      end_date: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
      usage_limit: '',
      status: 'active'
    });
    setShowModal(true);
  };

  // Handle edit voucher button
  const handleEditVoucher = (voucher) => {
    setModalMode('edit');
    setSelectedVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_purchase: voucher.min_purchase || '',
      max_discount: voucher.max_discount || '',
      start_date: formatDateForInput(new Date(voucher.start_date)),
      end_date: formatDateForInput(new Date(voucher.end_date)),
      usage_limit: voucher.usage_limit || '',
      status: voucher.status
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
      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/admin/vouchers', formData);
      } else {
        await axios.put(`http://localhost:5000/api/admin/vouchers/${selectedVoucher.id}`, formData);
      }
      
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      setError(`Gagal ${modalMode === 'add' ? 'menambahkan' : 'mengubah'} voucher. Silakan coba lagi.`);
    }
  };

  // Handle delete voucher
  const handleDeleteVoucher = async (voucherId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus voucher ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/vouchers/${voucherId}`);
        fetchVouchers();
      } catch (err) {
        setError('Gagal menghapus voucher. Silakan coba lagi.');
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

  // Get voucher status badge
  const getStatusBadge = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    
    if (voucher.status !== 'active') {
      return <Badge bg="secondary">Tidak Aktif</Badge>;
    } else if (now < startDate) {
      return <Badge bg="info">Akan Datang</Badge>;
    } else if (now > endDate) {
      return <Badge bg="danger">Kadaluarsa</Badge>;
    } else {
      return <Badge bg="success">Aktif</Badge>;
    }
  };

  if (loading && vouchers.length === 0) {
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
        <h2>Pengelolaan Voucher</h2>
        <Button variant="primary" onClick={handleAddVoucher}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Tambah Voucher
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Diskon</th>
                <th>Min. Pembelian</th>
                <th>Periode</th>
                <th>Batas Penggunaan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td><strong>{voucher.code}</strong></td>
                  <td>
                    {voucher.discount_type === 'percentage' 
                      ? `${voucher.discount_value}%` 
                      : formatCurrency(voucher.discount_value)}
                    {voucher.max_discount && voucher.discount_type === 'percentage' && (
                      <small className="d-block text-muted">
                        Maks. {formatCurrency(voucher.max_discount)}
                      </small>
                    )}
                  </td>
                  <td>
                    {voucher.min_purchase 
                      ? formatCurrency(voucher.min_purchase) 
                      : '-'}
                  </td>
                  <td>
                    {formatDate(voucher.start_date)} - {formatDate(voucher.end_date)}
                  </td>
                  <td>
                    {voucher.usage_limit 
                      ? `${voucher.usage_count || 0}/${voucher.usage_limit}` 
                      : 'Tidak terbatas'}
                  </td>
                  <td>{getStatusBadge(voucher)}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleEditVoucher(voucher)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteVoucher(voucher.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Tidak ada voucher yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Voucher Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Tambah Voucher' : 'Edit Voucher'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Kode Voucher</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Kode harus unik dan akan digunakan pelanggan saat checkout
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipe Diskon</Form.Label>
                  <Form.Select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nilai Diskon</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleChange}
                      required
                    />
                    <InputGroup.Text>
                      {formData.discount_type === 'percentage' ? '%' : 'Rp'}
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
                      disabled={formData.discount_type !== 'percentage'}
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
                  <Form.Label>Tanggal Mulai</Form.Label>
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
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Batas Penggunaan</Form.Label>
                  <Form.Control
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Kosongkan untuk tidak membatasi
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === 'add' ? 'Tambah' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Vouchers; 