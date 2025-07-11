import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPercent } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';
import { VoucherSelector } from '../components';

const Checkout = () => {
  const { currentUser } = useContext(AuthContext);
  const { cartItems, getSubtotal, clearCart, calculateItemDiscount, getTotalDiscount, getDiscountedSubtotal } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingCity, setShippingCity] = useState(currentUser?.city || '');
  const [shippingInfo, setShippingInfo] = useState(null);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressDestinations, setAddressDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [originSettings, setOriginSettings] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [productDiscounts, setProductDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch payment methods and origin settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentResponse, originResponse] = await Promise.all([
          axios.get('/api/payment-methods'),
          axios.get('/api/settings/shipping-origin')
        ]);
        
        setPaymentMethods(paymentResponse.data.data.paymentMethods || []);
        
        if (originResponse.data.success) {
          setOriginSettings(originResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch active discounts
  useEffect(() => {
    const fetchActiveDiscounts = async () => {
      try {
        setDiscountsLoading(true);
        const response = await axios.get('/api/discounts/active');
        setProductDiscounts(response.data.data.discounts || []);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setProductDiscounts([]);
      } finally {
        setDiscountsLoading(false);
      }
    };

    fetchActiveDiscounts();
  }, []);

  // Search destinations when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddressDestinations(addressSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  // Handle shipping selection
  const handleShippingChange = (shipping) => {
    setShippingInfo(shipping);
    setShippingCost(shipping.cost);
  };

  // Search destinations for address
  const searchAddressDestinations = async (query) => {
    if (!query || query.length < 3) {
      setAddressDestinations([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/shipping/search?search=${query}&limit=10`);
      if (response.data.success) {
        setAddressDestinations(response.data.data.data);
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
    }
  };

  // Handle destination selection
  const handleDestinationSelect = (destination, setFieldValue) => {
    setSelectedDestination(destination);
    setAddressDestinations([]);
    setAddressSearchQuery('');
    
    // Auto-fill form fields
    const addressParts = destination.label.split(', ');
    if (addressParts.length >= 4) {
      setFieldValue('shipping_city', addressParts[addressParts.length - 3] || '');
      setFieldValue('shipping_province', addressParts[addressParts.length - 2] || '');
      setFieldValue('shipping_postal_code', destination.zip_code || '');
    }
    
    // Auto-calculate shipping if origin is available
    if (originSettings?.origin_id) {
      calculateShippingOptions(originSettings.origin_id, destination.id);
    }
  };

  // Calculate shipping options using API
  const calculateShippingOptions = async (originId, destinationId) => {
    if (!originId || !destinationId) return;
    
    try {
      setLoadingShipping(true);
      const weight = getTotalWeight();
      const response = await axios.post('/api/shipping/cost', {
        origin: originId,
        destination: destinationId,
        weight: weight,
        courier: 'jne:pos:tiki'
      });

      console.log('Shipping API Response:', response.data);

      if (response.data.success && response.data.data?.data?.length > 0) {
        setShippingOptions(response.data.data.data);
        // Reset selected option when new options are loaded
        setSelectedShippingOption(null);
        setShippingInfo(null);
        setShippingCost(0);
      } else {
        setShippingOptions([]);
      }
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      setShippingOptions([]);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Handle shipping option selection
  const handleShippingOptionSelect = (option) => {
    setSelectedShippingOption(option);
    setShippingInfo({
      cost: option.cost,
      courier: option.code,
      service: option.service,
      etd: option.etd,
      description: option.description,
      courier_name: option.name
    });
    setShippingCost(option.cost);
  };

  // Calculate total weight from cart items
  const getTotalWeight = () => {
    return cartItems.reduce((total, item) => {
      const weight = item.product?.weight || 500; // Default 500g if no weight
      return total + (weight * item.quantity);
    }, 0);
  };

  // Handle voucher applied
  const handleVoucherApplied = (voucher) => {
    setVoucherData(voucher);
    setDiscountAmount(voucher.discount_amount);
  };

  // Handle voucher removed
  const handleVoucherRemoved = () => {
    setVoucherData(null);
    setDiscountAmount(0);
  };

  // Calculate final total with discount
  const getFinalTotal = () => {
    const discountedSubtotal = getDiscountedSubtotal(productDiscounts);
    return discountedSubtotal + shippingCost - discountAmount;
  };

  // Validation schema
  const checkoutSchema = Yup.object({
    shipping_address: Yup.string()
      .required('Detail alamat harus diisi'),
    shipping_city: Yup.string()
      .required('Kota harus diisi'),
    shipping_province: Yup.string()
      .required('Provinsi harus diisi'),
    shipping_postal_code: Yup.string()
      .required('Kode pos harus diisi'),
    notes: Yup.string()
  });


  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    if (cartItems.length === 0) {
      setError('Keranjang belanja Anda kosong.');
      setSubmitting(false);
      return;
    }

    if (!selectedDestination) {
      setError('Silakan pilih alamat tujuan terlebih dahulu.');
      setSubmitting(false);
      return;
    }

    if (!shippingInfo) {
      setError('Silakan pilih layanan pengiriman terlebih dahulu.');
      setSubmitting(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const paymentData = {
        ...values,
        shipping_cost: shippingCost,
        courier: shippingInfo?.courier || '',
        courier_service: shippingInfo?.service || '',
        courier_name: shippingInfo?.courier_name || '',
        shipping_etd: shippingInfo?.etd || '',
        total_weight: getTotalWeight(),
        destination_id: selectedDestination?.id || '',
        voucher_code: voucherData?.voucher_code || null,
        product_discount_amount: getTotalDiscount(productDiscounts),
        items: cartItems.map(item => {
          const itemDiscount = calculateItemDiscount(item, productDiscounts);
          return {
            product_id: item.product_id,
            variation_id: item.variation_id || null,
            quantity: item.quantity,
            discount_amount: itemDiscount.discountAmount,
            discount_id: itemDiscount.discount?.id || null
          };
        })
      };
      
      // Create Midtrans snap token
      const response = await axios.post('/api/payment/snap/create-token', paymentData);
      
      if (response.data.success) {
        const { snap_token, order_data } = response.data.data;
        setOrderData(order_data);
        
        // Check if Midtrans Snap is loaded
        if (!window.snap) {
          setError('Payment gateway belum tersedia. Silakan refresh halaman.');
          return;
        }

        // Open Midtrans Snap
        window.snap.pay(snap_token, {
          onSuccess: function(result) {
            handlePaymentSuccess(result, order_data);
          },
          onPending: function(result) {
            // onPending dipanggil ketika user sudah memilih metode pembayaran
            // tapi pembayaran masih dalam proses (seperti bank transfer, dll)
            handlePaymentPending(result, order_data);
          },
          onError: function(result) {
            handlePaymentError(result);
          },
          onClose: function() {
            setShowCancelDialog(true);
          }
        });
      } else {
        setError(response.data.message || 'Terjadi kesalahan saat membuat pembayaran.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Terjadi kesalahan saat membuat pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (result, orderData) => {
    try {
      const response = await axios.post('/api/payment/snap/save-order', {
        order_data: orderData,
        payment_result: result
      });

      if (response.data.success) {
        setSuccess(true);
        setOrderId(response.data.data.order.id);
        clearCart();
      } else {
        setError('Terjadi kesalahan saat menyimpan pesanan.');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Terjadi kesalahan saat menyimpan pesanan.');
    }
  };


  // Handle payment pending
  const handlePaymentPending = async (result, orderData) => {
    try {
      // Update status order menjadi pending jika belum tersimpan
      const response = await axios.post('/api/payment/snap/save-order', {
        order_data: orderData,
        payment_result: { 
          ...result, 
          status_code: '201',
          transaction_status: 'pending'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setOrderId(response.data.data.order.id);
        clearCart();
        setError('Pembayaran sedang diproses. Silakan tunggu konfirmasi.');
      }
    } catch (error) {
      console.error('Error handling pending payment:', error);
      setError('Pembayaran sedang diproses. Silakan tunggu konfirmasi.');
    }
  };

  // Handle payment error
  const handlePaymentError = (result) => {
    setError('Pembayaran gagal. Silakan coba lagi.');
  };

  // Handle cancel confirmation
  const handleCancelOrder = () => {
    setShowCancelDialog(false);
    setOrderData(null);
    setError('Pesanan dibatalkan.');
  };

  // Handle continue payment
  const handleContinuePayment = () => {
    setShowCancelDialog(false);
    // Optionally reopen payment
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
                        <Form.Label>Cari Alamat Tujuan</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Ketik nama kota/kabupaten untuk mencari..."
                          value={addressSearchQuery}
                          onChange={(e) => setAddressSearchQuery(e.target.value)}
                        />
                        {addressDestinations.length > 0 && (
                          <Card className="mt-2 position-absolute w-100" style={{ zIndex: 1000 }}>
                            <Card.Body className="p-2 max-height-200 overflow-auto">
                              <div className="small text-muted mb-2">Pilih alamat tujuan:</div>
                              {addressDestinations.map(dest => (
                                <div 
                                  key={dest.id}
                                  className="p-2 border-bottom cursor-pointer hover-bg-light"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleDestinationSelect(dest, setFieldValue)}
                                >
                                  <small>{dest.label}</small>
                                </div>
                              ))}
                            </Card.Body>
                          </Card>
                        )}
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
                              readOnly
                              className="bg-light"
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
                              readOnly
                              className="bg-light"
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
                              readOnly
                              className="bg-light"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.shipping_postal_code}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      {selectedDestination && (
                        <Alert variant="info" className="mb-3">
                          <strong>Alamat Terpilih:</strong><br />
                          {selectedDestination.label}
                        </Alert>
                      )}

                      {loadingShipping && (
                        <div className="text-center mb-3">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Menghitung ongkos kirim...
                        </div>
                      )}

                      {!loadingShipping && shippingOptions.length > 0 && (
                        <Form.Group className="mb-3">
                          <Form.Label>Pilih Kurir & Layanan</Form.Label>
                          <Form.Select
                            value={selectedShippingOption ? `${selectedShippingOption.code}-${selectedShippingOption.service}` : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [courierCode, service] = e.target.value.split('-');
                                const option = shippingOptions.find(opt => 
                                  opt.code === courierCode && opt.service === service
                                );
                                if (option) {
                                  handleShippingOptionSelect(option);
                                }
                              }
                            }}
                          >
                            <option value="">Pilih layanan pengiriman...</option>
                            {shippingOptions.map((option, index) => (
                              <option 
                                key={index} 
                                value={`${option.code}-${option.service}`}
                              >
                                {option.name} - {option.service} ({option.description}) - Rp {option.cost.toLocaleString('id-ID')} - ETD: {option.etd}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      )}

                      {!loadingShipping && selectedDestination && shippingOptions.length === 0 && (
                        <Alert variant="warning" className="mb-3">
                          Tidak ada layanan pengiriman tersedia untuk alamat ini.
                        </Alert>
                      )}

                      <Form.Group className="mb-3">
                        <Form.Label>Detail Alamat Lengkap</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="shipping_address"
                          value={values.shipping_address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.shipping_address && errors.shipping_address}
                          placeholder="Masukkan detail alamat lengkap (nama jalan, nomor rumah, RT/RW, kelurahan, dll)"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.shipping_address}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Contoh: Jl. Merdeka No. 123, RT 05/RW 02, Kelurahan Merdeka
                        </Form.Text>
                      </Form.Group>

                      {shippingInfo && (
                        <Alert variant="success" className="mb-3">
                          <strong>Kurir Terpilih:</strong><br />
                          {shippingInfo.courier_name} - {shippingInfo.description}
                          <br />
                          <strong>Biaya:</strong> Rp {shippingInfo.cost.toLocaleString('id-ID')}
                          <br />
                          <small>Estimasi: {shippingInfo.etd}</small>
                        </Alert>
                      )}
                      
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
                      
                      
                      <div className="d-grid mt-4">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          size="lg"
                          className="px-5 py-3 fw-bold rounded-pill"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
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
                  {cartItems.map(item => {
                    const itemDiscount = calculateItemDiscount(item, productDiscounts);
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.product?.name} x {item.quantity}
                          {item.variation && (
                            <small className="d-block text-muted">
                              {item.variation.size && item.variation.color ? 
                                `${item.variation.size} - ${item.variation.color}` : ''}
                            </small>
                          )}
                          {itemDiscount.discount && (
                            <div className="mt-1">
                              <Badge bg="danger" size="sm">
                                <FontAwesomeIcon icon={faPercent} className="me-1" />
                                {itemDiscount.discount.name}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="text-end">
                          {itemDiscount.discount ? (
                            <div>
                              <div className="text-primary fw-bold">
                                Rp {(itemDiscount.discountedPrice * item.quantity).toLocaleString('id-ID')}
                              </div>
                              <small className="text-muted text-decoration-line-through">
                                Rp {(itemDiscount.originalPrice * item.quantity).toLocaleString('id-ID')}
                              </small>
                            </div>
                          ) : (
                            <div>
                              Rp {((item.variation?.price || item.product?.price) * item.quantity).toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              {/* Original Subtotal */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span className={getTotalDiscount(productDiscounts) > 0 ? "text-muted text-decoration-line-through" : ""}>
                  Rp {getSubtotal().toLocaleString('id-ID')}
                </span>
              </div>
              
              {/* Product Discount Information */}
              {getTotalDiscount(productDiscounts) > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>
                      <FontAwesomeIcon icon={faPercent} className="me-1" />
                      Diskon Produk:
                    </span>
                    <span>-Rp {getTotalDiscount(productDiscounts).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal Setelah Diskon:</span>
                    <span className="fw-bold text-primary">
                      Rp {getDiscountedSubtotal(productDiscounts).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
              
              <div className="d-flex justify-content-between mb-2">
                <span>
                  Biaya Pengiriman
                  {shippingInfo && (
                    <small className="d-block text-muted">
                      {shippingInfo.courier.toUpperCase()} - {shippingInfo.service}
                    </small>
                  )}
                </span>
                <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Diskon Voucher</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              
              <div className="d-flex justify-content-between mb-3">
                <span>
                  Berat Total
                </span>
                <span>{(getTotalWeight() / 1000).toFixed(1)} kg</span>
              </div>

              {/* Voucher Selector */}
              <div className="mb-3">
                <label className="form-label fw-bold">Voucher Diskon</label>
                <VoucherSelector
                  subtotal={getDiscountedSubtotal(productDiscounts)}
                  onVoucherApplied={handleVoucherApplied}
                  onVoucherRemoved={handleVoucherRemoved}
                  disabled={loading}
                />
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-0">
                <strong>Total</strong>
                <strong>Rp {getFinalTotal().toLocaleString('id-ID')}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cancel Order Confirmation Dialog */}
      {showCancelDialog && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <Card style={{ width: '90%', maxWidth: '400px' }}>
            <Card.Body className="text-center p-4">
              <h5 className="mb-3">Batalkan Pesanan?</h5>
              <p className="mb-4">
                Apakah Anda yakin akan membatalkan pesanan berikut? 
                Data pesanan yang sudah diisi akan hilang.
              </p>
              <div className="d-grid gap-2">
                <Button 
                  variant="danger" 
                  onClick={handleCancelOrder}
                >
                  Ya, Batalkan Pesanan
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={handleContinuePayment}
                >
                  Kembali
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Checkout; 