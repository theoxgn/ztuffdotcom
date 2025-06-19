import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';

const Checkout = () => {
  const { currentUser } = useContext(AuthContext);
  const { cartItems, getSubtotal, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingCity, setShippingCity] = useState(currentUser?.city || '');
  const navigate = useNavigate();

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get('/api/payment-methods');
        setPaymentMethods(response.data.data.paymentMethods || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Update shipping cost when city changes
  useEffect(() => {
    const cost = calculateShippingCost(shippingCity);
    setShippingCost(cost);
  }, [shippingCity]);

  // Validation schema
  const checkoutSchema = Yup.object({
    shipping_address: Yup.string()
      .required('Alamat pengiriman harus diisi'),
    shipping_city: Yup.string()
      .required('Kota harus diisi'),
    shipping_province: Yup.string()
      .required('Provinsi harus diisi'),
    shipping_postal_code: Yup.string()
      .required('Kode pos harus diisi'),
    payment_method_id: Yup.string()
      .required('Metode pembayaran harus dipilih'),
    notes: Yup.string()
  });

  // Calculate shipping cost
  const calculateShippingCost = (city) => {
    // In a real application, this would call an API to get shipping costs
    // For now, we'll use a simple calculation based on the city
    const baseShipping = 20000; // Base shipping cost
    
    // Add additional cost based on city (just for demonstration)
    let additionalCost = 0;
    if (city && city.toLowerCase().includes('jakarta')) {
      additionalCost = 5000;
    } else if (city && city.toLowerCase().includes('bandung')) {
      additionalCost = 10000;
    } else {
      additionalCost = 15000;
    }
    
    return baseShipping + additionalCost;
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    if (cartItems.length === 0) {
      setError('Keranjang belanja Anda kosong.');
      setSubmitting(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        ...values,
        shipping_cost: shippingCost,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id || null,
          quantity: item.quantity
        }))
      };
      
      const response = await axios.post('/api/orders', orderData);
      
      if (response.data.success) {
        setSuccess(true);
        setOrderId(response.data.data.order.id);
        clearCart();
      } else {
        setError(response.data.message || 'Terjadi kesalahan saat membuat pesanan.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // If not logged in, redirect to login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=checkout');
    }
  }, [currentUser, navigate]);

  // If cart is empty, redirect to cart
  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      navigate('/cart');
    }
  }, [cartItems, navigate, success]);

  if (!currentUser) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Mengalihkan ke halaman login...</p>
      </div>
    );
  }

  if (success && orderId) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="text-center p-5">
                <div className="mb-4">
                  <i className="fas fa-check-circle text-success fa-5x"></i>
                </div>
                <h2 className="mb-4">Pesanan Berhasil Dibuat!</h2>
                <p className="mb-3">
                  Terima kasih atas pesanan Anda. Pesanan Anda telah berhasil dibuat dan sedang menunggu pembayaran.
                </p>
                <p className="mb-4">
                  ID Pesanan: <strong>{orderId}</strong>
                </p>
                <p className="mb-4">
                  Silakan lakukan pembayaran sesuai dengan instruksi yang telah diberikan. Setelah pembayaran dikonfirmasi, pesanan Anda akan segera diproses.
                </p>
                <div className="d-grid gap-2">
                  <Button 
                    as={Link} 
                    to={`/user/orders`} 
                    variant="primary" 
                    size="lg"
                    className="px-5 py-3 fw-bold rounded-pill"
                  >
                    Lihat Pesanan Saya
                  </Button>
                  <Button 
                    as={Link} 
                    to="/" 
                    variant="outline-primary"
                    size="sm"
                    className="px-4 py-2 fw-semibold rounded-pill"
                  >
                    Kembali ke Beranda
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Checkout</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4">Informasi Pengiriman</h4>
              
              <Formik
                initialValues={{
                  shipping_address: currentUser?.address || '',
                  shipping_city: currentUser?.city || '',
                  shipping_province: currentUser?.province || '',
                  shipping_postal_code: currentUser?.postal_code || '',
                  payment_method_id: '',
                  notes: ''
                }}
                validationSchema={checkoutSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                  setFieldValue
                }) => {
                  // Sync shipping city with state for shipping cost calculation
                  const handleCityChange = (e) => {
                    handleChange(e);
                    setShippingCity(e.target.value);
                  };
                  
                  return (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Alamat</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="shipping_address"
                          value={values.shipping_address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.shipping_address && errors.shipping_address}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.shipping_address}
                        </Form.Control.Feedback>
                      </Form.Group>
                      
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Kota</Form.Label>
                            <Form.Control
                              type="text"
                              name="shipping_city"
                              value={values.shipping_city}
                              onChange={handleCityChange}
                              onBlur={handleBlur}
                              isInvalid={touched.shipping_city && errors.shipping_city}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.shipping_city}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Provinsi</Form.Label>
                            <Form.Control
                              type="text"
                              name="shipping_province"
                              value={values.shipping_province}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.shipping_province && errors.shipping_province}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.shipping_province}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Kode Pos</Form.Label>
                            <Form.Control
                              type="text"
                              name="shipping_postal_code"
                              value={values.shipping_postal_code}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.shipping_postal_code && errors.shipping_postal_code}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.shipping_postal_code}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Catatan (Opsional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="notes"
                          value={values.notes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Tambahkan catatan untuk pesanan Anda"
                        />
                      </Form.Group>
                      
                      <h4 className="mt-4 mb-3">Metode Pembayaran</h4>
                      
                      {paymentMethods.length === 0 ? (
                        <p className="text-muted">Memuat metode pembayaran...</p>
                      ) : (
                        <div className="mb-3">
                          {paymentMethods.map(method => (
                            <Form.Check
                              key={method.id}
                              type="radio"
                              id={`payment-${method.id}`}
                              name="payment_method_id"
                              value={method.id}
                              label={method.name}
                              onChange={handleChange}
                              isInvalid={touched.payment_method_id && errors.payment_method_id}
                              className="mb-2"
                            />
                          ))}
                          {touched.payment_method_id && errors.payment_method_id && (
                            <div className="text-danger small mt-1">
                              {errors.payment_method_id}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="d-grid mt-4">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          size="lg"
                          className="px-5 py-3 fw-bold rounded-pill"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? 'Memproses...' : 'Buat Pesanan'}
                        </Button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h4 className="mb-3">Ringkasan Pesanan</h4>
              
              <Table responsive className="mb-3">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        {item.product?.name} x {item.quantity}
                        {item.variation && (
                          <small className="d-block text-muted">
                            {item.variation.size && item.variation.color ? 
                              `${item.variation.size} - ${item.variation.color}` : ''}
                          </small>
                        )}
                      </td>
                      <td className="text-end">
                        Rp {((item.variation?.price || item.product?.price) * item.quantity).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>Rp {getSubtotal().toLocaleString('id-ID')}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Biaya Pengiriman</span>
                <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-0">
                <strong>Total</strong>
                <strong>Rp {(getSubtotal() + shippingCost).toLocaleString('id-ID')}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout; 