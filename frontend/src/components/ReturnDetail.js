import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBox, faFileText, faUser, faEye, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { getReturnById, getReturnStatusText } from '../services/returnService';
import LoadingSpinner from './LoadingSpinner';

const ReturnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturnDetail();
  }, [id]);

  const fetchReturnDetail = async () => {
    try {
      setLoading(true);
      const response = await getReturnById(id);
      if (response.success) {
        setReturnRequest(response.data.return_request);
      } else {
        setError('Permintaan pengembalian tidak ditemukan');
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail pengembalian');
    } finally {
      setLoading(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonText = (reasonCode) => {
    const reasonMap = {
      'defective': 'Produk Rusak/Cacat',
      'wrong_item': 'Barang Salah',
      'not_as_described': 'Tidak Sesuai Deskripsi',
      'changed_mind': 'Berubah Pikiran',
      'damaged_shipping': 'Rusak Saat Pengiriman',
      'missing_parts': 'Ada Bagian yang Hilang',
      'size_issue': 'Masalah Ukuran',
      'quality_issue': 'Masalah Kualitas'
    };
    return reasonMap[reasonCode] || reasonCode;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !returnRequest) {
    return (
      <div className="py-4">
        <div className="text-center">
          <Alert variant="danger" className="mb-4">
            <strong>Error!</strong> {error}
          </Alert>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getReturnStatusText(returnRequest.status);

  return (
    <div className="py-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="h2 fw-bold text-dark mb-2">
                Detail Pengembalian #{returnRequest.return_number}
              </h1>
              <Button 
                variant="link" 
                className="p-0 text-decoration-none"
                onClick={() => navigate(-1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Kembali
              </Button>
            </div>
            <Badge 
              bg={statusInfo.color === 'yellow' ? 'warning' : 
                  statusInfo.color === 'green' ? 'success' : 
                  statusInfo.color === 'red' ? 'danger' : 'primary'}
              className="fs-6"
            >
              {statusInfo.text}
            </Badge>
          </div>

          <Row>
            {/* Return Information */}
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="card-title mb-0">
                    <FontAwesomeIcon icon={faFileText} className="me-2" />
                    Informasi Pengembalian
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-muted">Nomor Pesanan</label>
                    <p className="mb-0 fw-medium">#{returnRequest.order.order_number}</p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-muted">Tanggal Permintaan</label>
                    <p className="mb-0">{formatDate(returnRequest.createdAt)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-muted">Alasan Pengembalian</label>
                    <p className="mb-0">{getReasonText(returnRequest.reason_code)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-muted">Jenis Pengembalian</label>
                    <p className="mb-0">
                      {returnRequest.return_type === 'refund' ? 'Pengembalian Uang' :
                       returnRequest.return_type === 'exchange' ? 'Tukar Barang' : 'Kredit Toko'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-medium text-muted">Jumlah Diminta</label>
                    <p className="mb-0 fw-semibold h5">
                      {formatCurrency(returnRequest.requested_amount)}
                    </p>
                  </div>
                  
                  {returnRequest.approved_amount && (
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-muted">Jumlah Disetujui</label>
                      <p className="mb-0 fw-semibold h5 text-success">
                        {formatCurrency(returnRequest.approved_amount)}
                      </p>
                    </div>
                  )}
                  
                  {returnRequest.restocking_fee > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-muted">Biaya Restocking</label>
                      <p className="mb-0 fw-medium text-danger">
                        {formatCurrency(returnRequest.restocking_fee)}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Product Information */}
            <Col md={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="card-title mb-0">
                    <FontAwesomeIcon icon={faBox} className="me-2" />
                    Informasi Produk
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex align-items-start">
                    <img
                      src={returnRequest.orderItem.product.image || '/default.webp'}
                      alt={returnRequest.orderItem.product.name}
                      className="me-3 rounded"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="fw-medium text-dark mb-2">
                        {returnRequest.orderItem.product.name}
                      </h6>
                      {returnRequest.orderItem.variation && (
                        <p className="text-muted small mb-2">
                          Variasi: {returnRequest.orderItem.variation.size} - {returnRequest.orderItem.variation.color}
                        </p>
                      )}
                      <p className="text-muted small mb-2">
                        Kuantitas: {returnRequest.orderItem.quantity}
                      </p>
                      <p className="fw-semibold h5 text-dark mb-0">
                        {formatCurrency(returnRequest.orderItem.total)}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Description */}
          {returnRequest.reason_description && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="card-title mb-0">
                  <FontAwesomeIcon icon={faFileText} className="me-2" />
                  Deskripsi Masalah
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0 lh-lg">{returnRequest.reason_description}</p>
              </Card.Body>
            </Card>
          )}

          {/* Customer Notes */}
          {returnRequest.customer_notes && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="card-title mb-0">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Catatan Pelanggan
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-0 lh-lg">{returnRequest.customer_notes}</p>
              </Card.Body>
            </Card>
          )}

          {/* Admin Notes */}
          {returnRequest.admin_notes && (
            <Alert variant="info" className="mb-4">
              <h6 className="fw-medium mb-2">Catatan Admin</h6>
              <p className="mb-0 lh-lg">{returnRequest.admin_notes}</p>
              {returnRequest.processor && (
                <small className="text-muted d-block mt-2">
                  Diproses oleh: {returnRequest.processor.name} pada {formatDate(returnRequest.processed_at)}
                </small>
              )}
            </Alert>
          )}

          {/* Photos */}
          {returnRequest.photos && returnRequest.photos.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="card-title mb-0">
                  <FontAwesomeIcon icon={faEye} className="me-2" />
                  Foto Bukti
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {returnRequest.photos.map((photo, index) => (
                    <Col xs={6} md={3} key={index} className="mb-3">
                      <img
                        src={photo}
                        alt={`Bukti ${index + 1}`}
                        className="img-fluid rounded border"
                        style={{ height: '100px', objectFit: 'cover' }}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Quality Check Info */}
          {returnRequest.qualityCheck && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="card-title mb-0">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Status Quality Check
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label small fw-medium text-muted">Status Pemeriksaan</label>
                      <p className="mb-0 text-capitalize">{returnRequest.qualityCheck.condition_status}</p>
                    </div>
                  </Col>
                  {returnRequest.qualityCheck.overall_condition && (
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="form-label small fw-medium text-muted">Kondisi Keseluruhan</label>
                        <p className="mb-0 text-capitalize">{returnRequest.qualityCheck.overall_condition}</p>
                      </div>
                    </Col>
                  )}
                </Row>
                {returnRequest.qualityCheck.inspector_notes && (
                  <div>
                    <label className="form-label small fw-medium text-muted">Catatan Inspektur</label>
                    <p className="mb-0">{returnRequest.qualityCheck.inspector_notes}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
    </div>
  );
};

export default ReturnDetail;