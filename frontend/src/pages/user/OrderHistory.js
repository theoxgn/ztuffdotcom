import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileUpload, faCheck } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';

const OrderHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
    if (activeTab === 'pending' && order.payment_status === 'pending') return true;
    if (activeTab === 'paid' && order.payment_status === 'paid') return true;
    if (activeTab === 'processing' && order.order_status === 'processing') return true;
    if (activeTab === 'shipped' && order.order_status === 'shipped') return true;
    if (activeTab === 'delivered' && order.order_status === 'delivered') return true;
    if (activeTab === 'cancelled' && order.order_status === 'cancelled') return true;
    return false;
  });

  // Handle payment upload
  const handleUploadPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentFile) {
      setUploadError('Silakan pilih file bukti pembayaran.');
      return;
    }
    
    try {
      setUploadLoading(true);
      setUploadError(null);
      setUploadSuccess(false);
      
      const formData = new FormData();
      formData.append('payment_proof', paymentFile);
      
      await axios.post(`/api/orders/${selectedOrder.id}/payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadSuccess(true);
      
      // Update orders list
      const response = await axios.get('/api/orders');
      setOrders(response.data.data.orders || []);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentFile(null);
      }, 2000);
    } catch (error) {
      console.error('Error uploading payment:', error);
      setUploadError('Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
    } finally {
      setUploadLoading(false);
    }
  };

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

  // Get badge variant based on status
  const getPaymentBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getOrderBadgeVariant = (status) => {
    switch (status) {
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
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
                  <th>Status Pembayaran</th>
                  <th>Status Pesanan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</td>
                    <td>
                      <Badge bg={getPaymentBadgeVariant(order.payment_status)}>
                        {order.payment_status === 'pending' ? 'Menunggu Pembayaran' : 
                         order.payment_status === 'paid' ? 'Sudah Dibayar' : 'Gagal'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getOrderBadgeVariant(order.order_status)}>
                        {order.order_status === 'pending' ? 'Menunggu Pembayaran' : 
                         order.order_status === 'processing' ? 'Diproses' : 
                         order.order_status === 'shipped' ? 'Dikirim' : 
                         order.order_status === 'delivered' ? 'Selesai' : 'Dibatalkan'}
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
                      
                      {order.payment_status === 'pending' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPaymentModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faFileUpload} /> Upload Bukti
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {/* Payment Upload Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Bukti Pembayaran</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadSuccess ? (
            <Alert variant="success">
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              Bukti pembayaran berhasil diunggah. Pesanan Anda sedang diproses.
            </Alert>
          ) : (
            <Form onSubmit={handleUploadPayment}>
              {uploadError && (
                <Alert variant="danger" className="mb-3">
                  {uploadError}
                </Alert>
              )}
              
              <div className="mb-3">
                <p>
                  <strong>ID Pesanan:</strong> {selectedOrder?.order_number}
                </p>
                <p>
                  <strong>Total Pembayaran:</strong> Rp {selectedOrder?.total_amount ? parseFloat(selectedOrder.total_amount).toLocaleString('id-ID') : '0'}
                </p>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Bukti Pembayaran</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentFile(e.target.files[0])}
                  required
                />
                <Form.Text className="text-muted">
                  Format yang diperbolehkan: JPG, JPEG, PNG. Maksimal 5MB.
                </Form.Text>
              </Form.Group>
              
              <div className="d-grid">
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={uploadLoading || !paymentFile}
                >
                  {uploadLoading ? 'Mengunggah...' : 'Upload Bukti Pembayaran'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
      
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
                  <strong>Status Pembayaran:</strong>{' '}
                  <Badge bg={getPaymentBadgeVariant(orderDetails.payment_status)}>
                    {orderDetails.payment_status === 'pending' ? 'Menunggu Pembayaran' : 
                     orderDetails.payment_status === 'paid' ? 'Sudah Dibayar' : 'Gagal'}
                  </Badge>
                </p>
                <p>
                  <strong>Status Pesanan:</strong>{' '}
                  <Badge bg={getOrderBadgeVariant(orderDetails.order_status)}>
                    {orderDetails.order_status === 'pending' ? 'Menunggu Pembayaran' : 
                     orderDetails.order_status === 'processing' ? 'Diproses' : 
                     orderDetails.order_status === 'shipped' ? 'Dikirim' : 
                     orderDetails.order_status === 'delivered' ? 'Selesai' : 'Dibatalkan'}
                  </Badge>
                </p>
                {orderDetails.tracking_number && (
                  <p><strong>Nomor Resi:</strong> {orderDetails.tracking_number}</p>
                )}
              </div>
              
              <div className="mb-4">
                <h5>Informasi Pengiriman</h5>
                <hr />
                <p><strong>Nama:</strong> {orderDetails.shipping_name}</p>
                <p><strong>Alamat:</strong> {orderDetails.shipping_address}</p>
                <p><strong>Kota:</strong> {orderDetails.shipping_city}</p>
                <p><strong>Provinsi:</strong> {orderDetails.shipping_province}</p>
                <p><strong>Kode Pos:</strong> {orderDetails.shipping_postal_code}</p>
                <p><strong>Telepon:</strong> {orderDetails.shipping_phone}</p>
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
                          {item.size && item.color && (
                            <small className="d-block text-muted">
                              {item.size} - {item.color}
                            </small>
                          )}
                        </td>
                        <td>Rp {parseFloat(item.price).toLocaleString('id-ID')}</td>
                        <td>{item.quantity}</td>
                        <td>Rp {(parseFloat(item.price) * item.quantity).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                      <td>Rp {(parseFloat(orderDetails.total_amount) - parseFloat(orderDetails.shipping_cost)).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Biaya Pengiriman:</strong></td>
                      <td>Rp {parseFloat(orderDetails.shipping_cost).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td><strong>Rp {parseFloat(orderDetails.total_amount).toLocaleString('id-ID')}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              
              {orderDetails.payment_proof && (
                <div className="mb-4">
                  <h5>Bukti Pembayaran</h5>
                  <hr />
                  <div className="text-center">
                    <img 
                      src={`/${orderDetails.payment_proof}`} 
                      alt="Bukti Pembayaran" 
                      className="img-fluid" 
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              )}
              
              {orderDetails.notes && (
                <div className="mb-4">
                  <h5>Catatan</h5>
                  <hr />
                  <p>{orderDetails.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="danger">
              Gagal memuat detail pesanan. Silakan coba lagi.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderHistory;