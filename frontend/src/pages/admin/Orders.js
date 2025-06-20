import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Row, Col, Modal, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch, faFilter, faArrowLeft, faEdit, faCheck, faTimes, faShippingFast, faFileInvoice, faPrint, faComments, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { PaymentInfo } from '../../components';

// Order List Component
const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);

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
    // Handle invalid values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rp0';
    }
    
    // Convert string to number if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if conversion resulted in valid number
    if (isNaN(numAmount)) {
      return 'Rp0';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
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

  // Handle view payment info
  const handleViewPaymentInfo = async (order) => {
    setSelectedOrder(order);
    setShowPaymentInfoModal(true);
    setPaymentInfo(null);
    setPaymentInfoLoading(true);
    
    try {
      const response = await axios.get(`/api/payment/info/${order.id}`);
      setPaymentInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching payment info:', error);
      setPaymentInfo(null);
    } finally {
      setPaymentInfoLoading(false);
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
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="px-2 py-1"
                        onClick={() => navigate(`/admin/orders/detail/${order.id}`)}
                      >
                        <FontAwesomeIcon icon={faEye} className="me-1" /> Detail
                      </Button>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        className="px-2 py-1"
                        onClick={() => handleViewPaymentInfo(order)}
                      >
                        <FontAwesomeIcon icon={faCreditCard} className="me-1" /> Pembayaran
                      </Button>
                    </div>
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

      {/* Payment Info Modal */}
      <Modal show={showPaymentInfoModal} onHide={() => setShowPaymentInfoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Informasi Pembayaran - {selectedOrder?.order_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentInfoLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat informasi pembayaran...</p>
            </div>
          ) : paymentInfo ? (
            <PaymentInfo paymentData={paymentInfo} showTitle={false} />
          ) : (
            <Alert variant="warning">
              Informasi pembayaran tidak tersedia untuk pesanan ini.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentInfoModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
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
    // Handle invalid values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rp0';
    }
    
    // Convert string to number if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if conversion resulted in valid number
    if (isNaN(numAmount)) {
      return 'Rp0';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);
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

  // Handle print invoice
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(order);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle export PDF
  const handleExportPDF = () => {
    // Simple PDF export using browser's print to PDF
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(order);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate invoice HTML
  const generateInvoiceHTML = (order) => {
    const currentDate = new Date().toLocaleDateString('id-ID');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order?.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.5; 
            color: #333;
            background: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
          }
          .header {
            background: #1428a0;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 1rem;
            font-weight: normal;
          }
          .content {
            padding: 30px;
          }
          .invoice-meta {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
          }
          .invoice-details, .customer-info {
            flex: 1;
          }
          .invoice-details {
            background: #f5f5f5;
            padding: 20px;
          }
          .customer-info {
            background: #f5f5f5;
            padding: 20px;
          }
          .section-title {
            color: #1428a0;
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .detail-item {
            margin-bottom: 8px;
          }
          .detail-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
            color: #666;
          }
          .detail-value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
            background: #28a745;
            color: white;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border: 2px solid #1428a0;
          }
          .items-table th {
            background: #1428a0;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          .items-table tbody tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-section {
            background: #f5f5f5;
            padding: 20px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
          }
          .total-row:last-child {
            border-bottom: 2px solid #1428a0;
            font-size: 1.2rem;
            font-weight: bold;
            color: #1428a0;
            margin-top: 10px;
            padding-top: 10px;
          }
          .total-label {
            font-weight: bold;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666;
            margin-top: 30px;
          }
          .footer-message {
            font-size: 1rem;
            color: #1428a0;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .print-date {
            font-size: 0.9rem;
            color: #999;
          }
          @media print {
            .invoice-container { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>INVOICE</h1>
            <h2>Ztuff.com</h2>
          </div>
          
          <div class="content">
            <div class="invoice-meta">
              <div class="invoice-details">
                <div class="section-title">Detail Invoice</div>
                <div class="detail-item">
                  <span class="detail-label">Invoice:</span>
                  <span class="detail-value">${order?.order_number}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tanggal:</span>
                  <span class="detail-value">${formatDate(order?.createdAt)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">
                    <span class="status-badge">${order?.status}</span>
                  </span>
                </div>
              </div>
              
              <div class="customer-info">
                <div class="section-title">Informasi Pelanggan</div>
                <div class="detail-item">
                  <span class="detail-label">Nama:</span>
                  <span class="detail-value">${order?.user?.name}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${order?.user?.email}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Telepon:</span>
                  <span class="detail-value">${order?.user?.phone || 'Tidak tersedia'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Alamat:</span>
                  <span class="detail-value">${order?.shipping_address}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Kota:</span>
                  <span class="detail-value">${order?.shipping_city}, ${order?.shipping_province} ${order?.shipping_postal_code}</span>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th style="text-align: right; width: 120px;">Harga</th>
                  <th style="text-align: center; width: 80px;">Qty</th>
                  <th style="text-align: right; width: 120px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order?.items?.map(item => `
                  <tr>
                    <td>
                      <strong>${item.product?.name}</strong>
                      ${item.variation ? `<br><small style="color: #666;">${item.variation}</small>` : ''}
                    </td>
                    <td style="text-align: right;">${formatCurrency(item.price)}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" style="text-align: center; color: #999;">Tidak ada item</td></tr>'}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span>${formatCurrency(order?.subtotal)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Ongkos Kirim:</span>
                <span>${formatCurrency(order?.shipping_cost)}</span>
              </div>
              ${order?.discount_amount > 0 ? `
              <div class="total-row">
                <span class="total-label">Diskon Voucher${order?.voucher ? ` (${order.voucher.code})` : ''}:</span>
                <span style="color: #dc3545;">-${formatCurrency(order?.discount_amount)}</span>
              </div>
              ` : ''}
              <div class="total-row">
                <span class="total-label">TOTAL PEMBAYARAN:</span>
                <span>${formatCurrency(order?.total)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-message">Terima kasih telah berbelanja di Ztuff.com!</div>
            <div class="print-date">Dicetak pada: ${currentDate}</div>
          </div>
        </div>
      </body>
      </html>
    `;
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
        <Button variant="outline-secondary" size="sm" className="mb-3 px-3 py-2 fw-semibold" onClick={() => navigate('/admin/orders')}>
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
            size="sm"
            className="px-2 py-1 fw-semibold"
            onClick={() => setShowNoteModal(true)}
          >
            <FontAwesomeIcon icon={faComments} className="me-2" />
            Tambah Catatan
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="px-2 py-1 fw-semibold"
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
                        className="px-3 py-2 fw-semibold"
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
                                src={item.product?.image ? `${process.env.REACT_APP_API_URL}${item.product.image}` : '/default.webp'} 
                                alt={item.product?.name || 'Product'} 
                                width="50" 
                                height="50" 
                                className="me-3"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => { e.target.src = '/default.webp'; }}
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
                          <th colSpan="3">
                            Diskon Voucher
                            {order?.voucher && (
                              <div className="small text-muted fw-normal">
                                {order.voucher.code} - {order.voucher.description}
                              </div>
                            )}
                          </th>
                          <th>-{formatCurrency(order?.discount_amount)}</th>
                        </tr>
                      )}
                      <tr className="table-primary">
                        <th colSpan="3">Total</th>
                        <th>{formatCurrency(order?.total)}</th>
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
                    <Col md={12}>
                      <p><strong>Metode Pembayaran:</strong> {order?.payment_type ? order.payment_type.replace('_', ' ').toUpperCase() : (order?.paymentMethod?.name || 'Belum dipilih')}</p>
                      <p><strong>Status Pembayaran:</strong> {getStatusBadge(order?.status || 'pending')}</p>
                      <p><strong>Total Pembayaran:</strong> {formatCurrency(order?.total)}</p>
                      {order?.midtrans_order_id && (
                        <p><strong>Midtrans Order ID:</strong> {order.midtrans_order_id}</p>
                      )}
                      {order?.midtrans_transaction_status && (
                        <p><strong>Status Transaksi:</strong> <Badge bg="info">{order.midtrans_transaction_status}</Badge></p>
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
                        {order?.shipping_address}<br />
                        {order?.shipping_city}, {order?.shipping_province}<br />
                        {order?.shipping_postal_code}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Kurir:</strong> {order?.courier || order?.courier_name || 'Belum dipilih'}</p>
                      <p><strong>Layanan:</strong> {order?.courier_service || 'Belum dipilih'}</p>
                      <p><strong>Estimasi Pengiriman:</strong> {order?.shipping_etd || 'Belum tersedia'}</p>
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
              <p><strong>Total Item:</strong> {order?.items?.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) || 0}</p>
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
                <Button variant="outline-primary" size="sm" className="px-3 py-2 fw-semibold" onClick={handlePrintInvoice}>
                  <FontAwesomeIcon icon={faPrint} className="me-2" />
                  Cetak Invoice
                </Button>
                <Button variant="outline-success" size="sm" className="px-3 py-2 fw-semibold" onClick={handleExportPDF}>
                  <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
                  Ekspor PDF
                </Button>
                {order?.status === 'processing' && (
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    className="px-3 py-2 fw-semibold"
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
          <Button variant="secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => setShowStatusModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            className="px-3 py-2 fw-semibold"
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
          <Button variant="secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => setShowNoteModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            className="px-3 py-2 fw-semibold"
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