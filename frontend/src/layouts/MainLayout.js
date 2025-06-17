import React, { useContext } from 'react';
import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSignOutAlt, faShoppingBag, faHistory, faSignInAlt, faUserPlus, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">Dropshipedia</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Beranda</Nav.Link>
              <Nav.Link as={Link} to="/products">Produk</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to="/cart" className="position-relative">
                <FontAwesomeIcon icon={faShoppingCart} />
                {cartItems.length > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </Nav.Link>
              
              {currentUser ? (
                <NavDropdown 
                  title={
                    <span>
                      <FontAwesomeIcon icon={faUser} className="me-1" />
                      {currentUser.name}
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  {currentUser.role === 'admin' && (
                    <NavDropdown.Item as={Link} to="/admin">
                      <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                      Dashboard Admin
                    </NavDropdown.Item>
                  )}
                  
                  <NavDropdown.Item as={Link} to="/user/profile">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Profil Saya
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/user/orders">
                    <FontAwesomeIcon icon={faShoppingBag} className="me-2" />
                    Pesanan Saya
                  </NavDropdown.Item>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                    Keluar
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <NavDropdown 
                  title={
                    <span>
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                  } 
                  id="auth-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/login">
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    Masuk
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/register">
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Daftar
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="py-3">
        {children}
      </Container>
      
      <footer className="bg-light py-4 mt-5">
        <Container>
          <div className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} Dropshipedia. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout; 