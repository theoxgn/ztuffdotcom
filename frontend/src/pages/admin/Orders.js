import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
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
                  <td>{formatDate(order.created_at)}</td>
                  <td>{formatCurrency(order.total_amount)}</td>
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
  // Implementation will be added later
  return <div>Detail Pesanan</div>;
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