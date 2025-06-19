import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';
import { PaymentInfo } from '../../components';

const OrderHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/orders');
        setOrders(response.data.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Gagal memuat riwayat pesanan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending' && order.status === 'pending') return true;
    if (activeTab === 'paid' && order.status === 'paid') return true;
    if (activeTab === 'processing' && order.status === 'processing') return true;
    if (activeTab === 'shipped' && order.status === 'shipped') return true;
    if (activeTab === 'delivered' && order.status === 'delivered') return true;
    if (activeTab === 'cancelled' && order.status === 'cancelled') return true;
    return false;
  });


  // Handle view order details
  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setOrderDetails(null);
    setDetailsLoading(true);
    
    try {
      const response = await axios.get(`/api/orders/${order.id}`);
      setOrderDetails(response.data.data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setDetailsLoading(false);
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

  // Get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'paid': return 'Sudah Dibayar';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (!currentUser) {
    return (
      <Alert variant="warning">
        Anda harus login untuk mengakses halaman ini.
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Riwayat Pesanan</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="all" title="Semua" />
        <Tab eventKey="pending" title="Menunggu Pembayaran" />
        <Tab eventKey="paid" title="Sudah Dibayar" />
        <Tab eventKey="processing" title="Diproses" />
        <Tab eventKey="shipped" title="Dikirim" />
        <Tab eventKey="delivered" title="Selesai" />
        <Tab eventKey="cancelled" title="Dibatalkan" />
      </Tabs>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Memuat riwayat pesanan...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Alert variant="info">
          Tidak ada pesanan yang ditemukan.
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Tanggal</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>Rp {parseFloat(order.total).toLocaleString('id-ID')}</td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {getStatusDisplayText(order.status)}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewDetails(order)}
                      >
                        <FontAwesomeIcon icon={faEye} /> Detail
                      </Button>
                      
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewPaymentInfo(order)}
                      >
                        <FontAwesomeIcon icon={faCreditCard} /> Pembayaran
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {/* Order Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detail Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" />
              <p>Memuat detail pesanan...</p>
            </div>
          ) : orderDetails ? (
            <div>
              <div className="mb-4">
                <h5>Informasi Pesanan</h5>
                <hr />
                <p><strong>ID Pesanan:</strong> {orderDetails.order_number}</p>
                <p><strong>Tanggal:</strong> {new Date(orderDetails.createdAt).toLocaleString('id-ID')}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <Badge bg={getStatusBadgeVariant(orderDetails.status)}>
                    {getStatusDisplayText(orderDetails.status)}
                  </Badge>
                </p>
                {orderDetails.tracking_number && (
                  <p><strong>Nomor Resi:</strong> {orderDetails.tracking_number}</p>
                )}
              </div>
              
              <div className="mb-4">
                <h5>Informasi Pengiriman</h5>
                <hr />
                <p><strong>Alamat:</strong> {orderDetails.shipping_address}</p>
                <p><strong>Kota:</strong> {orderDetails.shipping_city}</p>
                <p><strong>Provinsi:</strong> {orderDetails.shipping_province}</p>
                <p><strong>Kode Pos:</strong> {orderDetails.shipping_postal_code}</p>
              </div>
              
              <div className="mb-4">
                <h5>Detail Produk</h5>
                <hr />
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
                    {orderDetails.items?.map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.product?.name || 'Produk'}
                          {item.variation && (
                            <small className="d-block text-muted">
                              {item.variation.size && item.variation.color ? 
                                `${item.variation.size} - ${item.variation.color}` : ''}
                            </small>
                          )}
                        </td>
                        <td>Rp {parseFloat(item.price).toLocaleString('id-ID')}</td>
                        <td>{item.quantity}</td>
                        <td>Rp {parseFloat(item.total).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                      <td>Rp {parseFloat(orderDetails.subtotal).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Biaya Pengiriman:</strong></td>
                      <td>Rp {parseFloat(orderDetails.shipping_cost).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td>Rp {parseFloat(orderDetails.total).toLocaleString('id-ID')}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>
          ) : (
            <Alert variant="danger">
              Gagal memuat detail pesanan.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

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

export default OrderHistory;