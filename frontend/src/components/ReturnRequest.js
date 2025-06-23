import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUpload, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { 
  checkReturnEligibility, 
  createReturnRequest, 
  getReturnReasons, 
  getReturnTypes, 
  getRefundMethods 
} from '../services/returnService';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const ReturnRequest = () => {
  const { orderId, orderItemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    reason_code: '',
    reason_description: '',
    return_type: 'refund',
    refund_method: 'original_payment',
    customer_notes: '',
    photos: []
  });

  const returnReasons = getReturnReasons();
  const returnTypes = getReturnTypes();
  const refundMethods = getRefundMethods();

  useEffect(() => {
    checkEligibility();
  }, [orderId, orderItemId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await checkReturnEligibility(orderId, orderItemId);
      
      if (response.success && response.data.eligible) {
        setEligibility(response.data);
      } else {
        setError('Item ini tidak dapat dikembalikan');
      }
    } catch (err) {
      setError(err.message || 'Gagal memeriksa kelayakan pengembalian');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real implementation, you'd upload these to a server
    // For now, we'll just store the file names
    setFormData(prev => ({
      ...prev,
      photos: files.map(file => file.name)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason_code) {
      setError('Pilih alasan pengembalian');
      return;
    }

    if (!formData.reason_description?.trim()) {
      setError('Berikan deskripsi detail tentang alasan pengembalian');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createReturnRequest(orderId, orderItemId, formData);
      
      if (response.success) {
        setToast({
          show: true,
          message: 'Permintaan pengembalian berhasil dibuat',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/user/orders');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Gagal membuat permintaan pengembalian');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !eligibility) {
    return (
      <div className="py-4">
        <div className="text-center">
          <Alert variant="danger" className="mb-4">
            <strong>Error!</strong> {error}
          </Alert>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="d-flex align-items-center mx-auto"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <h1 className="h2 fw-bold text-dark mb-2">Permintaan Pengembalian</h1>
        <p className="text-muted">Ajukan pengembalian untuk item pesanan Anda</p>
      </div>

      {/* Product Information */}
      {eligibility && (
        <Card className="mb-4">
          <Card.Body>
            <h2 className="h5 fw-semibold mb-3">Informasi Produk</h2>
            <div className="d-flex align-items-start">
              <img
                src={eligibility.order_item.product.image || '/default.webp'}
                alt={eligibility.order_item.product.name}
                className="me-3 rounded"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
              <div className="flex-grow-1">
                <h3 className="fw-medium text-dark mb-1">
                  {eligibility.order_item.product.name}
                </h3>
                {eligibility.order_item.variation && (
                  <p className="small text-muted mb-1">
                    Variasi: {eligibility.order_item.variation.size} - {eligibility.order_item.variation.color}
                  </p>
                )}
                <p className="small text-muted mb-1">
                  Kuantitas: {eligibility.order_item.quantity}
                </p>
                <p className="h6 fw-semibold text-dark mb-0">
                  {formatCurrency(eligibility.order_item.total)}
                </p>
              </div>
            </div>
            
            {eligibility.return_window_expires && (
              <Alert variant="warning" className="mt-3 mb-0">
                <strong>Batas Waktu Pengembalian:</strong> {formatDate(eligibility.return_window_expires)}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Return Request Form */}
      <Card>
        <Card.Body>
              <h2 className="h5 fw-semibold mb-3">Detail Pengembalian</h2>
              
              {error && (
                <Alert variant="danger" className="mb-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Return Reason */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">
                    Alasan Pengembalian *
                  </Form.Label>
                  <Form.Select
                    name="reason_code"
                    value={formData.reason_code}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Pilih alasan pengembalian</option>
                    {returnReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Return Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">
                    Jenis Pengembalian
                  </Form.Label>
                  <Form.Select
                    name="return_type"
                    value={formData.return_type}
                    onChange={handleInputChange}
                  >
                    {returnTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Refund Method (only show if return_type is refund) */}
                {formData.return_type === 'refund' && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      Metode Pengembalian Uang
                    </Form.Label>
                    <Form.Select
                      name="refund_method"
                      value={formData.refund_method}
                      onChange={handleInputChange}
                    >
                      {refundMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                {/* Detailed Description */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">
                    Deskripsi Detail *
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="reason_description"
                    value={formData.reason_description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Jelaskan secara detail kondisi produk dan alasan pengembalian..."
                    required
                  />
                </Form.Group>

                {/* Additional Notes */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">
                    Catatan Tambahan
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="customer_notes"
                    value={formData.customer_notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Catatan atau permintaan khusus..."
                  />
                </Form.Group>

                {/* Photo Upload */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">
                    <FontAwesomeIcon icon={faUpload} className="me-2" />
                    Foto Bukti (Opsional)
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <Form.Text className="text-muted">
                    Upload foto produk untuk memperkuat permintaan pengembalian Anda
                  </Form.Text>
                </Form.Group>

                {/* Action Buttons */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center me-md-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Mengirim...' : 'Ajukan Pengembalian'}
                  </Button>
                </div>
              </Form>
        </Card.Body>
      </Card>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default ReturnRequest;