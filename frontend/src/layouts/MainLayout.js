import React, { useContext, useState, useEffect } from 'react';
import { Container, Navbar, Nav, NavDropdown, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faUser, 
  faSignOutAlt, 
  faShoppingBag, 
  faHistory, 
  faSignInAlt, 
  faUserPlus, 
  faTachometerAlt,
  faSearch,
  faHeart
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';
import WishlistContext from '../contexts/WishlistContext';

const MainLayout = ({ children }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const { getWishlistCount } = useContext(WishlistContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(Array.isArray(response.data.data.categories) ? response.data.data.categories : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="white" expand="lg" sticky="top" className="py-3 border-bottom">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
            <img 
              src="/logo/logo_navbar.png" 
              alt="Ztuff.com" 
              height="60" 
              className="me-2"
            />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <Nav.Link as={Link} to="/" className="mx-2">Home</Nav.Link>
              <Nav.Link as={Link} to="/products" className="mx-2">Products</Nav.Link>
              <NavDropdown title="Categories" id="categories-dropdown" className="mx-2">
                {categories.slice(0, 8).map((category) => (
                  <NavDropdown.Item 
                    key={category.id} 
                    as={Link} 
                    to={`/products?category=${category.id}`}
                  >
                    {category.name}
                  </NavDropdown.Item>
                ))}
                {categories.length > 0 && <NavDropdown.Divider />}
                <NavDropdown.Item as={Link} to="/products">All Categories</NavDropdown.Item>
              </NavDropdown>
              {/* <Nav.Link as={Link} to="/tutorial" className="mx-2">Tutorials</Nav.Link> */}
            </Nav>
            
            <Form className="d-flex mx-auto" onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-pill"
                  style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                />
                <Button 
                  variant="link" 
                  className="position-absolute end-0 bg-transparent border-0 d-flex align-items-center justify-content-center"
                  style={{ zIndex: 10, right: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '2rem', height: '2rem' }}
                  type="submit"
                >
                  <FontAwesomeIcon icon={faSearch} className="text-secondary" />
                </Button>
              </InputGroup>
            </Form>
            
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/wishlist" className="mx-2 position-relative">
                <FontAwesomeIcon icon={faHeart} />
                {currentUser && getWishlistCount() > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {getWishlistCount()}
                  </Badge>
                )}
              </Nav.Link>
              
              <Nav.Link as={Link} to="/cart" className="mx-2 position-relative">
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
                  className="mx-2"
                >
                  {currentUser.role === 'admin' && (
                    <>
                      <NavDropdown.Header>Admin Panel</NavDropdown.Header>
                      <NavDropdown.Item as={Link} to="/admin">
                        <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                        Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/users">
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        Kelola Pengguna
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/products">
                        <FontAwesomeIcon icon={faShoppingBag} className="me-2" />
                        Kelola Produk
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/orders">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                        Kelola Pesanan
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                    </>
                  )}
                  
                  <NavDropdown.Item as={Link} to="/user/profile">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    My Profile
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/user/orders">
                    <FontAwesomeIcon icon={faShoppingBag} className="me-2" />
                    My Orders
                  </NavDropdown.Item>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                    Logout
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
                  className="mx-2"
                >
                  <NavDropdown.Item as={Link} to="/login">
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    Login
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/register">
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Register
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <main className="flex-grow-1">
        <Container className="py-4">
          {children}
        </Container>
      </main>
      
      <footer className="bg-light py-5">
        <Container>
          <div className="row">
            <div className="col-lg-4 mb-4">
              <img 
                src="/logo/logo_navbar.png" 
                alt="Ztuff.com" 
                height="100" 
                className="mb-3"
              />
              <p className="text-muted">
                Trusted online marketplace with quality products and seamless shopping experience.
              </p>
            </div>
            
            <div className="col-lg-2 col-md-3 col-6 mb-4">
              <h6 className="fw-bold mb-3">Shop</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/products" className="text-decoration-none text-secondary">All Products</Link></li>
                <li className="mb-2"><Link to="/products?featured=true" className="text-decoration-none text-secondary">Featured</Link></li>
                <li className="mb-2"><Link to="/products?new=true" className="text-decoration-none text-secondary">New Arrivals</Link></li>
              </ul>
            </div>
            
            <div className="col-lg-2 col-md-3 col-6 mb-4">
              <h6 className="fw-bold mb-3">Support</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/tutorial" className="text-decoration-none text-secondary">Tutorials</Link></li>
                <li className="mb-2"><Link to="/faq" className="text-decoration-none text-secondary">FAQs</Link></li>
                <li className="mb-2"><Link to="/contact" className="text-decoration-none text-secondary">Contact Us</Link></li>
              </ul>
            </div>
            
            <div className="col-lg-2 col-md-3 col-6 mb-4">
              <h6 className="fw-bold mb-3">Account</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/user/profile" className="text-decoration-none text-secondary">My Account</Link></li>
                <li className="mb-2"><Link to="/user/orders" className="text-decoration-none text-secondary">Order History</Link></li>
                <li className="mb-2"><Link to="/wishlist" className="text-decoration-none text-secondary">Wishlist</Link></li>
              </ul>
            </div>
            
            <div className="col-lg-2 col-md-3 col-6 mb-4">
              <h6 className="fw-bold mb-3">Legal</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/terms" className="text-decoration-none text-secondary">Terms of Service</Link></li>
                <li className="mb-2"><Link to="/privacy" className="text-decoration-none text-secondary">Privacy Policy</Link></li>
                <li className="mb-2"><Link to="/returns" className="text-decoration-none text-secondary">Returns Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="mb-3 mb-md-0">&copy; {new Date().getFullYear()} Ztuff.com. All rights reserved.</p>
            <div>
              <a href="#" className="text-decoration-none text-secondary me-3">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-decoration-none text-secondary me-3">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-decoration-none text-secondary me-3">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-decoration-none text-secondary">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout; 