import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Tabs, Tab, Modal, Form, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCreditCard, faShoppingBag, faCalendarAlt, faMapMarkerAlt, faTruck, faCheckCircle, faTimesCircle, faClock, faBox, faSync, faPercent, faUndo } from '@fortawesome/free-solid-svg-icons';
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
  const [refreshingStatus, setRefreshingStatus] = useState(null);

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

  // Handle refresh payment status
  const handleRefreshStatus = async (order) => {
    setRefreshingStatus(order.id);
    
    try {
      const response = await axios.get(`/api/payment/check-status/${order.order_number}`);
      
      if (response.data.success && response.data.data.updated) {
        // Refresh orders list
        const ordersResponse = await axios.get('/api/orders');
        setOrders(ordersResponse.data.data.orders || []);
        
        alert(`Status pembayaran diperbarui menjadi: ${response.data.data.current_status}`);
      } else {
        alert('Status pembayaran masih sama');
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      alert('Gagal memperbarui status pembayaran');
    } finally {
      setRefreshingStatus(null);
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

  // Check if order can be returned
  const canOrderBeReturned = (order) => {
    if (order.status !== 'delivered') return false;
    if (order.has_active_returns) return false;
    
    // Check if within return window (assume 30 days for now)
    if (order.delivered_date) {
      const deliveredDate = new Date(order.delivered_date);
      const now = new Date();
      const daysDiff = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30;
    }
    
    return order.is_returnable !== false;
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
    <Container fluid className="px-4">
      <h2 className="mb-4">Riwayat Pesanan</h2>
      
      {/* Summary Stats */}
      {orders.length > 0 && (
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' }}>
              <Card.Body className="text-white text-center">
                <FontAwesomeIcon icon={faShoppingBag} size="2x" className="mb-2" />
                <h4 className="mb-0">{orders.length}</h4>
                <small>Total Pesanan</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}>
              <Card.Body className="text-white text-center">
                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="mb-2" />
                <h4 className="mb-0">{orders.filter(o => o.status === 'delivered').length}</h4>
                <small>Selesai</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)' }}>
              <Card.Body className="text-white text-center">
                <FontAwesomeIcon icon={faClock} size="2x" className="mb-2" />
                <h4 className="mb-0">{orders.filter(o => o.status === 'pending').length}</h4>
                <small>Menunggu</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="border-0 h-100" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)' }}>
              <Card.Body className="text-white text-center">
                <FontAwesomeIcon icon={faTruck} size="2x" className="mb-2" />
                <h4 className="mb-0">{orders.filter(o => ['processing', 'shipped'].includes(o.status)).length}</h4>
                <small>Dalam Proses</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Compact Tabs */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-2">
          <div className="d-flex overflow-auto">
            {[
              { key: 'all', label: 'Semua', icon: faShoppingBag, count: orders.length },
              { key: 'pending', label: 'Menunggu Pembayaran', icon: faClock, count: orders.filter(o => o.status === 'pending').length },
              { key: 'paid', label: 'Sudah Dibayar', icon: faCreditCard, count: orders.filter(o => o.status === 'paid').length },
              { key: 'processing', label: 'Diproses', icon: faBox, count: orders.filter(o => o.status === 'processing').length },
              { key: 'shipped', label: 'Dikirim', icon: faTruck, count: orders.filter(o => o.status === 'shipped').length },
              { key: 'delivered', label: 'Selesai', icon: faCheckCircle, count: orders.filter(o => o.status === 'delivered').length },
              { key: 'cancelled', label: 'Dibatalkan', icon: faTimesCircle, count: orders.filter(o => o.status === 'cancelled').length }
            ].map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <div
                  key={tab.key}
                  className={`text-center py-2 px-3 position-relative tab-item ${
                    isActive ? 'bg-primary text-white rounded' : 'text-muted'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ 
                    cursor: 'pointer',
                    minWidth: 'auto',
                    transition: 'all 0.3s ease',
                    marginRight: index < 6 ? '8px' : '0',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon 
                      icon={tab.icon} 
                      className={`me-2 ${isActive ? 'text-white' : 'text-primary'}`}
                      size="sm"
                    />
                    <div className="fw-semibold d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                      <span className="me-1">{tab.label}</span>
                      {tab.count > 0 && (
                        <Badge 
                          bg={isActive ? 'light' : 'primary'} 
                          text={isActive ? 'dark' : 'white'}
                          className="rounded-pill"
                          style={{ fontSize: '0.7rem', minWidth: '20px', height: '20px', lineHeight: '1.2' }}
                        >
                          {tab.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      <style jsx>{`
        .tab-item:not(.bg-primary):hover {
          background-color: #f8f9fa !important;
          border-radius: 4px !important;
        }
        .d-flex.overflow-auto::-webkit-scrollbar {
          height: 4px;
        }
        .d-flex.overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }
        .d-flex.overflow-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }
        .d-flex.overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
      
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
        <div className="row g-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="col-12">
              <Card className="border-0 shadow-sm h-100 order-card">
                <Card.Body className="p-4">
                  <Row className="align-items-center">
                    <Col lg={3} md={4} className="mb-3 mb-md-0">
                      <div>
                        <h6 className="mb-1 text-primary fw-bold">{order.order_number}</h6>
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-muted me-1" size="sm" />
                          <small className="text-muted">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </small>
                        </div>
                      </div>
                    </Col>
                    
                    <Col lg={2} md={2} sm={6} className="mb-3 mb-lg-0">
                      <div className="text-center text-lg-start">
                        <small className="text-muted d-block">Total</small>
                        <h5 className="mb-0 text-success fw-bold">
                          Rp {parseFloat(order.total).toLocaleString('id-ID')}
                        </h5>
                      </div>
                    </Col>
                    
                    <Col lg={2} md={2} sm={6} className="mb-3 mb-lg-0">
                      <div className="text-center">
                        <Badge 
                          bg={getStatusBadgeVariant(order.status)} 
                          className="px-3 py-2 rounded-pill"
                          style={{ fontSize: '0.8rem' }}
                        >
                          {getStatusDisplayText(order.status)}
                        </Badge>
                      </div>
                    </Col>
                    
                    <Col lg={3} md={4} className="mb-3 mb-lg-0">
                      <div>
                        {order.shipping_address && (
                          <div className="d-flex align-items-start mb-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-2 mt-1" size="sm" />
                            <small className="text-muted" style={{ lineHeight: 1.4 }}>
                              {order.shipping_address.length > 50 
                                ? `${order.shipping_address.substring(0, 50)}...` 
                                : order.shipping_address}
                            </small>
                          </div>
                        )}
                        {order.tracking_number && (
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faTruck} className="text-info me-2" size="sm" />
                            <small className="text-info fw-semibold">
                              Resi: {order.tracking_number}
                            </small>
                          </div>
                        )}
                      </div>
                    </Col>
                    
                    <Col lg={2} md={12} className="text-lg-end text-center">
                      <div className="d-flex gap-1 justify-content-lg-end justify-content-center flex-wrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="px-3 rounded-pill"
                        >
                          <FontAwesomeIcon icon={faEye} className="me-1" />
                          Detail
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewPaymentInfo(order)}
                          className="px-3 rounded-pill"
                        >
                          <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                          Bayar
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleRefreshStatus(order)}
                            disabled={refreshingStatus === order.id}
                            className="px-3 rounded-pill"
                            title="Refresh status pembayaran"
                          >
                            {refreshingStatus === order.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FontAwesomeIcon icon={faSync} className="me-1" />
                            )}
                            {refreshingStatus === order.id ? 'Checking...' : 'Refresh'}
                          </Button>
                        )}
                        {canOrderBeReturned(order) && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="px-3 rounded-pill"
                            title="Lihat detail untuk return item"
                          >
                            <FontAwesomeIcon icon={faUndo} className="me-1" />
                            Retur
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
      
      {/* Order Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
            Detail Pesanan
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {detailsLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat detail pesanan...</p>
            </div>
          ) : orderDetails ? (
            <Row>
              {/* Left Column - Order & Shipping Info */}
              <Col lg={4} className="mb-4">
                <Card className="border-0 bg-light h-100">
                  <Card.Body>
                    <h6 className="fw-bold text-primary mb-3">
                      <FontAwesomeIcon icon={faShoppingBag} className="me-2" />
                      Informasi Pesanan
                    </h6>
                    <div className="mb-3">
                      <small className="text-muted">ID Pesanan</small>
                      <div className="fw-bold">{orderDetails.order_number}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Tanggal</small>
                      <div>{new Date(orderDetails.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Status</small>
                      <div>
                        <Badge bg={getStatusBadgeVariant(orderDetails.status)} className="px-3 py-2">
                          {getStatusDisplayText(orderDetails.status)}
                        </Badge>
                      </div>
                    </div>
                    {orderDetails.tracking_number && (
                      <div className="mb-3">
                        <small className="text-muted">Nomor Resi</small>
                        <div className="fw-bold text-info">{orderDetails.tracking_number}</div>
                      </div>
                    )}
                    
                    <hr className="my-3" />
                    
                    <h6 className="fw-bold text-primary mb-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      Alamat Pengiriman
                    </h6>
                    <div className="small">
                      <div className="mb-2">{orderDetails.shipping_address}</div>
                      <div className="text-muted">
                        {orderDetails.shipping_city}, {orderDetails.shipping_province} {orderDetails.shipping_postal_code}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              {/* Right Column - Products & Pricing */}
              <Col lg={8}>
                <Card className="border-0">
                  <Card.Body className="p-0">
                    <h6 className="fw-bold text-primary mb-3">
                      <FontAwesomeIcon icon={faBox} className="me-2" />
                      Detail Produk
                    </h6>
                    
                    {/* Products List */}
                    <div className="mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {orderDetails.items?.map(item => (
                        <Card key={item.id} className="border mb-2">
                          <Card.Body className="p-3">
                            <Row className="align-items-center">
                              <Col xs={6}>
                                <div className="fw-semibold">{item.product?.name || 'Produk'}</div>
                                {item.variation && (
                                  <small className="text-muted">
                                    {item.variation.size && item.variation.color ? 
                                      `${item.variation.size} - ${item.variation.color}` : ''}
                                  </small>
                                )}
                              </Col>
                              <Col xs={2} className="text-center">
                                <small className="text-muted">Qty</small>
                                <div className="fw-bold">{item.quantity}</div>
                              </Col>
                              <Col xs={2} className="text-end">
                                <small className="text-muted">Harga</small>
                                <div className="fw-semibold">Rp {parseFloat(item.price).toLocaleString('id-ID')}</div>
                              </Col>
                              <Col xs={2} className="text-end">
                                <small className="text-muted">Subtotal</small>
                                <div className="fw-bold text-primary">Rp {parseFloat(item.total).toLocaleString('id-ID')}</div>
                              </Col>
                            </Row>
                            {canOrderBeReturned(orderDetails) && (
                              <Row className="mt-2">
                                <Col className="text-end">
                                  <Link
                                    to={`/return/request/${orderDetails.id}/${item.id}`}
                                    className="btn btn-outline-warning btn-sm"
                                  >
                                    <FontAwesomeIcon icon={faUndo} className="me-1" />
                                    Return Item Ini
                                  </Link>
                                </Col>
                              </Row>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pricing Summary */}
                    <Card className="border-primary">
                      <Card.Body className="bg-light">
                        <h6 className="fw-bold text-primary mb-3">Ringkasan Pembayaran</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <span className="fw-semibold">Rp {parseFloat(orderDetails.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Biaya Pengiriman:</span>
                          <span className="fw-semibold">Rp {parseFloat(orderDetails.shipping_cost).toLocaleString('id-ID')}</span>
                        </div>
                        {orderDetails.product_discount_amount > 0 && (
                          <div className="d-flex justify-content-between mb-2 text-success">
                            <span>
                              <FontAwesomeIcon icon={faPercent} className="me-1" />
                              Diskon Produk:
                            </span>
                            <span className="fw-bold">-Rp {parseFloat(orderDetails.product_discount_amount).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {orderDetails.discount_amount > 0 && (
                          <div className="d-flex justify-content-between mb-2 text-success">
                            <div>
                              <span>Diskon Voucher:</span>
                              {orderDetails.voucher && (
                                <div className="small text-muted">
                                  {orderDetails.voucher.code} - {orderDetails.voucher.description}
                                </div>
                              )}
                            </div>
                            <span className="fw-bold">-Rp {parseFloat(orderDetails.discount_amount).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold fs-5">Total:</span>
                          <span className="fw-bold fs-5 text-success">Rp {parseFloat(orderDetails.total).toLocaleString('id-ID')}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
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
    </Container>
  );
};

export default OrderHistory;