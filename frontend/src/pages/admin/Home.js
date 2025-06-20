import React from 'react';
import { Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faBoxes, faShoppingCart, faMoneyBillWave,
  faChartLine, faCalendarAlt, faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

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

  // Generate sales chart data
  const generateSalesChartData = () => {
    const realData = data?.monthlyRevenue || [];
    
    console.log('Monthly Revenue Data:', realData); // Debug log
    
    // Create month labels from the actual data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    let labels = [];
    let salesData = [];
    
    if (realData.length > 0) {
      // Use real data from backend
      labels = realData.map(item => {
        const [year, month] = item.month.split('-');
        const monthIndex = parseInt(month) - 1;
        return months[monthIndex];
      });
      salesData = realData.map(item => item.revenue);
    } else {
      // Fallback to empty data
      labels = months.slice(0, 6);
      salesData = new Array(6).fill(0);
    }
    
    console.log('Chart Labels:', labels); // Debug log
    console.log('Chart Data:', salesData); // Debug log
    
    return {
      labels,
      datasets: [
        {
          label: 'Penjualan (IDR)',
          data: salesData,
          borderColor: '#1428a0',
          backgroundColor: 'rgba(20, 40, 160, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1428a0',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    };
  };

  // Generate order status chart data
  const generateOrderStatusChartData = () => {
    const statusData = data?.ordersByStatus || {};
    
    // Use real data if available
    const defaultData = {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0
    };
    
    const finalData = { ...defaultData, ...statusData };

    return {
      labels: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'],
      datasets: [
        {
          data: Object.values(finalData),
          backgroundColor: [
            '#ffc107',
            '#17a2b8',
            '#007bff',
            '#28a745',
            '#20c997'
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  // Generate category sales chart data
  const generateCategorySalesData = () => {
    const categoryData = data?.salesByCategory || [];
    
    // If no real data, show empty chart
    if (categoryData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Penjualan per Kategori',
            data: [0],
            backgroundColor: ['#e0e0e0'],
            borderColor: ['#e0e0e0'],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: categoryData.map(item => item.name),
      datasets: [
        {
          label: 'Penjualan per Kategori',
          data: categoryData.map(item => parseFloat(item.sales) || 0),
          backgroundColor: [
            '#1428a0',
            '#007bff',
            '#28a745',
            '#ffc107',
            '#dc3545'
          ],
          borderColor: [
            '#1428a0',
            '#007bff',
            '#28a745',
            '#ffc107',
            '#dc3545'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
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
          <Card className="admin-stat-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Pengguna</h6>
                  <h2 className="mt-2 mb-0">{data?.userCount || 0}</h2>
                  <small className="text-light">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    +12% dari bulan lalu
                  </small>
                </div>
                <FontAwesomeIcon icon={faUsers} className="admin-stat-icon" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="admin-stat-card h-100" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Produk</h6>
                  <h2 className="mt-2 mb-0">{data?.productCount || 0}</h2>
                  <small className="text-light">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    +5% dari bulan lalu
                  </small>
                </div>
                <FontAwesomeIcon icon={faBoxes} className="admin-stat-icon" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="admin-stat-card h-100" style={{ background: 'linear-gradient(135deg, #17a2b8, #20c997)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Pesanan Baru</h6>
                  <h2 className="mt-2 mb-0">{data?.newOrderCount || 0}</h2>
                  <small className="text-light">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    +28% dari bulan lalu
                  </small>
                </div>
                <FontAwesomeIcon icon={faShoppingCart} className="admin-stat-icon" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="admin-stat-card h-100" style={{ background: 'linear-gradient(135deg, #ffc107, #fd7e14)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Pendapatan</h6>
                  <h2 className="mt-2 mb-0">{formatCurrency(data?.totalRevenue)}</h2>
                  <small className="text-light">
                    <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                    +18% dari bulan lalu
                  </small>
                </div>
                <FontAwesomeIcon icon={faMoneyBillWave} className="admin-stat-icon" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders and Sales Chart */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="admin-card h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pesanan Terbaru</h5>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="admin-table">
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
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{formatCurrency(order.total)}</td>
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
          <Card className="admin-card h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Status Pesanan</h5>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ height: '300px' }}>
                <Doughnut data={generateOrderStatusChartData()} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Top Products */}
      <Row>
        <Col md={12} className="mb-4">
          <Card className="admin-card">
            <Card.Header>
              <h5 className="mb-0">Produk Terlaris</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="admin-table">
                <thead>
                  <tr>
                    <th>Produk</th>
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
                          <img 
                            src={product.image || '/default.webp'} 
                            alt={product.name} 
                            width="40" 
                            height="40" 
                            className="me-2 rounded"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => { e.target.src = '/default.webp'; }}
                          />
                          {product.name}
                        </div>
                      </td>
                      <td>{product.category_name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.sold_count}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                  {(!data?.topProducts || data.topProducts.length === 0) && (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
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
      
      {/* Analytics Charts */}
      <Row>
        <Col md={8} className="mb-4">
          <Card className="admin-card">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Tren Penjualan Bulanan</h5>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ height: '350px' }}>
                <Line data={generateSalesChartData()} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="admin-card">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Penjualan per Kategori</h5>
                <FontAwesomeIcon icon={faBoxes} />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="chart-container" style={{ height: '350px' }}>
                <Bar data={generateCategorySalesData()} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 