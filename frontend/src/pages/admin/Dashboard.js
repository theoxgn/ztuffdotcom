import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUsers, faBoxes, faShoppingCart, 
  faTag, faPercent, faBook, faCog
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
import AdminSettings from './Settings';

const Dashboard = () => {
  const location = useLocation();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard');
        if (response.data && response.data.data) {
          setAdminData(response.data.data);
        } else {
          console.error('Invalid response format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

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
    if (path.includes('/admin/settings')) return 'settings';
    return 'home';
  };

  const menuItems = [
    { key: 'home', path: '/admin', icon: faHome, label: 'Dashboard' },
    { key: 'users', path: '/admin/users', icon: faUsers, label: 'Pengguna' },
    { key: 'products', path: '/admin/products', icon: faBoxes, label: 'Produk' },
    { key: 'orders', path: '/admin/orders', icon: faShoppingCart, label: 'Pesanan' },
    { key: 'categories', path: '/admin/categories', icon: faTag, label: 'Kategori' },
    { key: 'vouchers', path: '/admin/vouchers', icon: faPercent, label: 'Voucher' },
    { key: 'tutorials', path: '/admin/tutorials', icon: faBook, label: 'Tutorial' },
    { key: 'settings', path: '/admin/settings', icon: faCog, label: 'Settings' }
  ];

  return (
    <Container fluid className="px-0">
      <Row className="g-0">
        {/* Admin Sidebar */}
        <Col lg={3} xl={2} className="d-none d-lg-block">
          <Card className="admin-nav h-100 rounded-0 border-0" style={{ minHeight: 'calc(100vh - 200px)' }}>
            
            <Card.Body className="p-0">
              <Nav className="flex-column">
                {menuItems.map((item) => (
                  <Nav.Link
                    key={item.key}
                    as={Link}
                    to={item.path}
                    className={`px-4 py-3 border-0 rounded-0 ${
                      getActivePath() === item.key ? 'active' : ''
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-3" />
                    {item.label}
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Mobile Admin Navigation */}
        <Col xs={12} className="d-lg-none mb-3">
          <Card className="admin-mobile-nav border-0">
            <Card.Body>
              <Nav className="justify-content-center">
                {menuItems.slice(0, 4).map((item) => (
                  <Nav.Link
                    key={item.key}
                    as={Link}
                    to={item.path}
                    className={`text-center px-2 ${
                      getActivePath() === item.key ? 'active' : ''
                    }`}
                  >
                    <div>
                      <FontAwesomeIcon icon={item.icon} size="lg" className="d-block mb-1" />
                      <small>{item.label}</small>
                    </div>
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9} xl={10}>
          <div className="admin-content">
            <Routes>
              <Route path="/" element={<AdminHome data={adminData} loading={loading} />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/products/*" element={<AdminProducts />} />
              <Route path="/orders/*" element={<AdminOrders />} />
              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/vouchers/*" element={<AdminVouchers />} />
              <Route path="/tutorials/*" element={<AdminTutorials />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

// Export the Dashboard component
export default Dashboard; 