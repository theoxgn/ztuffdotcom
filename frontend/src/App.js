import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/user/Profile';
import OrderHistory from './pages/user/OrderHistory';
import PointHistory from './pages/user/PointHistory';
import Tutorial from './pages/Tutorial';
import Wishlist from './pages/Wishlist';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';

// Context Provider
import { AuthProvider } from './contexts/AuthContext';
import AuthContext from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './components';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, loading } = React.useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
            
            {/* Main Routes */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/products/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
            <Route path="/checkout" element={
              <MainLayout>
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </MainLayout>
            } />
            
            {/* User Routes */}
            <Route path="/user/profile" element={
              <MainLayout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/user/orders" element={
              <MainLayout>
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              </MainLayout>
            } />
            <Route path="/wishlist" element={
              <MainLayout>
                <Wishlist />
              </MainLayout>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <MainLayout>
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              </MainLayout>
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<MainLayout><Navigate to="/" /></MainLayout>} />
          </Routes>
            </Router>
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
