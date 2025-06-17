import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUsers, faBoxes, faShoppingCart, 
  faTag, faPercent, faBook, faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Admin Components
import AdminHome from './Home';
import AdminUsers from './Users';
import AdminProducts from './Products';
import AdminOrders from './Orders';
import AdminCategories from './Categories';
import AdminVouchers from './Vouchers';
import AdminTutorials from './Tutorials';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard');
        setAdminData(response.data.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get current active path
  const getActivePath = () => {
    const path = location.pathname;
    if (path === '/admin') return 'home';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/vouchers')) return 'vouchers';
    if (path.includes('/admin/tutorials')) return 'tutorials';
    return 'home';
  };

  return (
    <Container fluid>
      <Row>
        {/* Sidebar */}
        <Col 
          md={collapsed ? 1 : 2} 
          lg={collapsed ? 1 : 2} 
          className="bg-dark text-white p-0"
          style={{ 
            height: 'calc(100vh - 56px)', 
            position: 'sticky', 
            top: '56px',
            transition: 'all 0.3s'
          }}
        >
          <div className="d-flex flex-column h-100">
            <Button 
              variant="link" 
              className="text-white text-decoration-none border-0 text-end p-2"
              onClick={() => setCollapsed(!collapsed)}
            >
              <FontAwesomeIcon icon={collapsed ? 'chevron-right' : 'chevron-left'} />
            </Button>
            
            <Nav className="flex-column">
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={`py-3 ${getActivePath() === 'home' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faHome} className="me-2" />
                {!collapsed && 'Dashboard'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/users" 
                className={`py-3 ${getActivePath() === 'users' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                {!collapsed && 'Pengguna'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/products" 
                className={`py-3 ${getActivePath() === 'products' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faBoxes} className="me-2" />
                {!collapsed && 'Produk'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/orders" 
                className={`py-3 ${getActivePath() === 'orders' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                {!collapsed && 'Pesanan'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/categories" 
                className={`py-3 ${getActivePath() === 'categories' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faTag} className="me-2" />
                {!collapsed && 'Kategori'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/vouchers" 
                className={`py-3 ${getActivePath() === 'vouchers' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faPercent} className="me-2" />
                {!collapsed && 'Voucher'}
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/tutorials" 
                className={`py-3 ${getActivePath() === 'tutorials' ? 'bg-primary' : ''}`}
              >
                <FontAwesomeIcon icon={faBook} className="me-2" />
                {!collapsed && 'Tutorial'}
              </Nav.Link>
            </Nav>
            
            <div className="mt-auto">
              <Button 
                variant="danger" 
                className="w-100 rounded-0"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                {!collapsed && 'Keluar'}
              </Button>
            </div>
          </div>
        </Col>
        
        {/* Main Content */}
        <Col md={collapsed ? 11 : 10} lg={collapsed ? 11 : 10} className="p-4">
          <Routes>
            <Route path="/" element={<AdminHome data={adminData} loading={loading} />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/products/*" element={<AdminProducts />} />
            <Route path="/orders/*" element={<AdminOrders />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/vouchers/*" element={<AdminVouchers />} />
            <Route path="/tutorials/*" element={<AdminTutorials />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
};

// Default Admin Home Component (will be replaced by actual component)
const DefaultAdminHome = ({ data, loading }) => {
  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Dashboard Admin</h2>
      
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
                  <h2 className="mt-2 mb-0">Rp {data?.totalRevenue?.toLocaleString('id-ID') || 0}</h2>
                </div>
                <FontAwesomeIcon icon="money-bill-wave" size="2x" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={8} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Pesanan Terbaru</h5>
            </Card.Header>
            <Card.Body>
              {data?.recentOrders?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pelanggan</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.user?.name}</td>
                        <td>Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</td>
                        <td>
                          <span className={`badge bg-${
                            order.order_status === 'delivered' ? 'success' :
                            order.order_status === 'shipped' ? 'primary' :
                            order.order_status === 'processing' ? 'info' :
                            order.order_status === 'pending' ? 'warning' : 'danger'
                          }`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted mb-0">Tidak ada pesanan terbaru</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Produk Terlaris</h5>
            </Card.Header>
            <Card.Body>
              {data?.topProducts?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {data.topProducts.map(product => (
                    <li key={product.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">{product.name}</h6>
                        <small className="text-muted">Rp {parseFloat(product.price).toLocaleString('id-ID')}</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">{product.sold}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0">Tidak ada data produk terlaris</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Export the Dashboard component
export default Dashboard; 