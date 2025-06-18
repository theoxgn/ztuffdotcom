import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Row, Col, Modal, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch, faFilter, faArrowLeft, faEdit, faCheck, faTimes, faShippingFast, faFileInvoice, faPrint, faComments } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Order List Component
const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/orders');
      // Pastikan orders selalu array
      setOrders(Array.isArray(response.data.data.orders) ? response.data.data.orders : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Gagal memuat data pesanan. Silakan coba lagi nanti.');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Menunggu Pembayaran</Badge>;
      case 'paid':
        return <Badge bg="info">Dibayar</Badge>;
      case 'processing':
        return <Badge bg="primary">Diproses</Badge>;
      case 'shipped':
        return <Badge bg="success">Dikirim</Badge>;
      case 'delivered':
        return <Badge bg="success">Diterima</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Dibatalkan</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading && orders.length === 0) {
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
        <h2>Pengelolaan Pesanan</h2>
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
                  placeholder="Cari pesanan..."
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
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu Pembayaran</option>
                  <option value="paid">Dibayar</option>
                  <option value="processing">Diproses</option>
                  <option value="shipped">Dikirim</option>
                  <option value="delivered">Diterima</option>
                  <option value="cancelled">Dibatalkan</option>
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
                <th>No. Pesanan</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>
                    <div>{order.user?.name || 'Pelanggan'}</div>
                    <small className="text-muted">{order.user?.email}</small>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/admin/orders/detail/${order.id}`)}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-1" /> Detail
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Tidak ada pesanan yang ditemukan
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

// Order Detail Component
const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Fetch order details
  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/orders/${id}`);
      setOrder(response.data.data.order);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Gagal memuat detail pesanan. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      setUpdating(true);
      await axios.put(`/api/admin/orders/${id}/status`, {
        status: newStatus,
        note: statusNote
      });
      
      setSuccess(`Status pesanan berhasil diperbarui menjadi ${getStatusText(newStatus)}`);
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNote('');
      fetchOrderDetail(); // Refresh order data
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Gagal memperbarui status pesanan.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!orderNote.trim()) return;

    try {
      setUpdating(true);
      await axios.post(`/api/admin/orders/${id}/notes`, {
        note: orderNote
      });
      
      setSuccess('Catatan berhasil ditambahkan');
      setShowNoteModal(false);
      setOrderNote('');
      fetchOrderDetail(); // Refresh order data
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Gagal menambahkan catatan.');
    } finally {
      setUpdating(false);
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
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Menunggu Pembayaran</Badge>;
      case 'paid':
        return <Badge bg="info">Dibayar</Badge>;
      case 'processing':
        return <Badge bg="primary">Diproses</Badge>;
      case 'shipped':
        return <Badge bg="success">Dikirim</Badge>;
      case 'delivered':
        return <Badge bg="success">Diterima</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Dibatalkan</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'paid': return 'Dibayar';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Diterima';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  // Get next status options
  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'paid', label: 'Dibayar' },
          { value: 'cancelled', label: 'Dibatalkan' }
        ];
      case 'paid':
        return [
          { value: 'processing', label: 'Diproses' },
          { value: 'cancelled', label: 'Dibatalkan' }
        ];
      case 'processing':
        return [
          { value: 'shipped', label: 'Dikirim' },
          { value: 'cancelled', label: 'Dibatalkan' }
        ];
      case 'shipped':
        return [
          { value: 'delivered', label: 'Diterima' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <Button variant="outline-secondary" onClick={() => navigate('/admin/orders')} className="mb-3">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali
        </Button>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Detail Pesanan #{order?.order_number}</h2>
          <p className="text-muted mb-0">Dibuat pada {formatDate(order?.createdAt)}</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            onClick={() => setShowNoteModal(true)}
          >
            <FontAwesomeIcon icon={faComments} className="me-2" />
            Tambah Catatan
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/orders')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Kembali
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="details" className="mb-4">
            <Tab eventKey="details" title="Detail Pesanan">
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Status Pesanan</h5>
                    {getNextStatusOptions(order?.status).length > 0 && (
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setShowStatusModal(true)}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-1" />
                        Update Status
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex align-items-center">
                    {getStatusBadge(order?.status)}
                    <span className="ms-3 text-muted">
                      Terakhir diperbarui: {formatDate(order?.updatedAt)}
                    </span>
                  </div>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Item Pesanan</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.product?.image || '/default.webp'} 
                                alt={item.product?.name || 'Product'} 
                                width="50" 
                                height="50" 
                                className="me-3"
                                style={{ objectFit: 'cover' }}
                              />
                              <div>
                                <h6 className="mb-0">{item.product?.name}</h6>
                                {item.variation && (
                                  <div><small className="text-muted">Variasi: {item.variation}</small></div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3">Subtotal</th>
                        <th>{formatCurrency(order?.subtotal)}</th>
                      </tr>
                      {order?.shipping_cost > 0 && (
                        <tr>
                          <th colSpan="3">Ongkos Kirim</th>
                          <th>{formatCurrency(order?.shipping_cost)}</th>
                        </tr>
                      )}
                      {order?.discount_amount > 0 && (
                        <tr>
                          <th colSpan="3">Diskon</th>
                          <th>-{formatCurrency(order?.discount_amount)}</th>
                        </tr>
                      )}
                      <tr className="table-primary">
                        <th colSpan="3">Total</th>
                        <th>{formatCurrency(order?.total_amount)}</th>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="payment" title="Pembayaran">
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Informasi Pembayaran</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Metode Pembayaran:</strong> {order?.payment_method || 'Belum dipilih'}</p>
                      <p><strong>Status Pembayaran:</strong> {getStatusBadge(order?.payment_status || 'pending')}</p>
                      <p><strong>Total Pembayaran:</strong> {formatCurrency(order?.total)}</p>
                    </Col>
                    <Col md={6}>
                      {order?.payment_proof && (
                        <div>
                          <p><strong>Bukti Pembayaran:</strong></p>
                          <img 
                            src={order.payment_proof || '/default.webp'} 
                            alt="Bukti Pembayaran" 
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px' }}
                            onError={(e) => { e.target.src = '/default.webp'; }}
                          />
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="shipping" title="Pengiriman">
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Informasi Pengiriman</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>Alamat Pengiriman:</h6>
                      <p>
                        {order?.shipping_address?.recipient_name}<br />
                        {order?.shipping_address?.phone}<br />
                        {order?.shipping_address?.address}<br />
                        {order?.shipping_address?.city}, {order?.shipping_address?.postal_code}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Kurir:</strong> {order?.shipping_courier || 'Belum dipilih'}</p>
                      <p><strong>Layanan:</strong> {order?.shipping_service || 'Belum dipilih'}</p>
                      <p><strong>Ongkos Kirim:</strong> {formatCurrency(order?.shipping_cost)}</p>
                      {order?.tracking_number && (
                        <p><strong>No. Resi:</strong> {order.tracking_number}</p>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="notes" title="Catatan">
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Riwayat Catatan</h5>
                </Card.Header>
                <Card.Body>
                  {order?.notes?.length > 0 ? (
                    order.notes.map((note, index) => (
                      <div key={index} className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <p className="mb-1">{note.content}</p>
                            <small className="text-muted">
                              {note.created_by} - {formatDate(note.created_at)}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">Belum ada catatan untuk pesanan ini.</p>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Informasi Pelanggan</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Nama:</strong> {order?.user?.name}</p>
              <p><strong>Email:</strong> {order?.user?.email}</p>
              <p><strong>Telepon:</strong> {order?.user?.phone || 'Tidak tersedia'}</p>
              <p><strong>Bergabung:</strong> {formatDate(order?.user?.createdAt)}</p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Ringkasan Pesanan</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>No. Pesanan:</strong> {order?.order_number}</p>
              <p><strong>Tanggal:</strong> {formatDate(order?.createdAt)}</p>
              <p><strong>Total Item:</strong> {order?.items?.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p><strong>Total Pembayaran:</strong> {formatCurrency(order?.total)}</p>
              <p><strong>Status:</strong> {getStatusBadge(order?.status)}</p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Aksi Cepat</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  <FontAwesomeIcon icon={faPrint} className="me-2" />
                  Cetak Invoice
                </Button>
                <Button variant="outline-success" size="sm">
                  <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                  Ekspor PDF
                </Button>
                {order?.status === 'processing' && (
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    onClick={() => {
                      setNewStatus('shipped');
                      setShowStatusModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faShippingFast} className="me-2" />
                    Tandai Dikirim
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Status Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status Baru</Form.Label>
              <Form.Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Pilih Status</option>
                {getNextStatusOptions(order?.status).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Catatan (Opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Tambahkan catatan untuk perubahan status..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={!newStatus || updating}
          >
            {updating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Memperbarui...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                Update Status
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Note Modal */}
      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Catatan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Catatan</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Masukkan catatan untuk pesanan ini..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddNote}
            disabled={!orderNote.trim() || updating}
          >
            {updating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Menambahkan...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                Tambah Catatan
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Main Orders Component
const Orders = () => {
  return (
    <Routes>
      <Route path="/" element={<OrderList />} />
      <Route path="/detail/:id" element={<OrderDetail />} />
    </Routes>
  );
};

export default Orders; 