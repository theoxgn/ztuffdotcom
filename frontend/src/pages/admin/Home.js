import React from 'react';
import { Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faBoxes, faShoppingCart, faMoneyBillWave,
  faChartLine, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const Home = ({ data, loading }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
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

  if (loading) {
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
      <h2 className="mb-4">Dashboard Admin</h2>
      
      {/* Summary Cards */}
      <Row>
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100 bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Pengguna</h6>
                  <h2 className="mt-2 mb-0">{data?.userCount || 0}</h2>
                </div>
                <FontAwesomeIcon icon={faUsers} size="2x" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100 bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Produk</h6>
                  <h2 className="mt-2 mb-0">{data?.productCount || 0}</h2>
                </div>
                <FontAwesomeIcon icon={faBoxes} size="2x" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100 bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Pesanan Baru</h6>
                  <h2 className="mt-2 mb-0">{data?.newOrderCount || 0}</h2>
                </div>
                <FontAwesomeIcon icon={faShoppingCart} size="2x" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100 bg-warning text-white">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Pendapatan</h6>
                  <h2 className="mt-2 mb-0">{formatCurrency(data?.totalRevenue)}</h2>
                </div>
                <FontAwesomeIcon icon={faMoneyBillWave} size="2x" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Orders and Sales Chart */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pesanan Terbaru</h5>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>No. Pesanan</th>
                    <th>Pelanggan</th>
                    <th>Tanggal</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentOrders?.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.user?.name || 'Pelanggan'}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span className={`badge bg-${
                          order.status === 'pending' ? 'warning' :
                          order.status === 'paid' ? 'info' :
                          order.status === 'processing' ? 'primary' :
                          order.status === 'shipped' ? 'success' :
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'danger' : 'secondary'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentOrders || data.recentOrders.length === 0) && (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        Tidak ada pesanan terbaru
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Statistik Penjualan</h5>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-5">
                <h6>Grafik penjualan akan ditampilkan di sini</h6>
                <p className="text-muted">
                  Integrasi dengan Chart.js atau library grafik lainnya
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Top Products */}
      <Row>
        <Col md={12} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Produk Terlaris</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>SKU</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Terjual</th>
                    <th>Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topProducts?.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              width="40" 
                              height="40" 
                              className="me-2"
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                          {product.name}
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category_name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.sold_count}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                  {(!data?.topProducts || data.topProducts.length === 0) && (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        Tidak ada data produk terlaris
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 