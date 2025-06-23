import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Form, Alert, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTimes, faFilter, faUndo, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { getUserReturns, cancelReturnRequest, getReturnStatusText } from '../services/returnService';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const ReturnHistory = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchReturns();
  }, [currentPage, statusFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await getUserReturns(params);
      if (response.success) {
        setReturns(response.data.returns);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      setToast({
        show: true,
        message: 'Gagal memuat riwayat pengembalian',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!selectedReturn) return;

    try {
      const response = await cancelReturnRequest(selectedReturn.id);
      if (response.success) {
        setToast({
          show: true,
          message: 'Permintaan pengembalian berhasil dibatalkan',
          type: 'success'
        });
        fetchReturns(); // Refresh the list
      }
    } catch (error) {
      setToast({
        show: true,
        message: error.message || 'Gagal membatalkan permintaan pengembalian',
        type: 'error'
      });
    } finally {
      setShowConfirm(false);
      setSelectedReturn(null);
    }
  };

  const confirmCancelReturn = (returnItem) => {
    setSelectedReturn(returnItem);
    setShowConfirm(true);
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
      month: 'short',
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

  const canCancelReturn = (status) => {
    return ['pending', 'approved'].includes(status);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-2">Riwayat Pengembalian</h2>
          <p className="text-muted mb-0">Kelola permintaan pengembalian barang Anda</p>
        </div>
        <div className="text-end">
          <Badge bg="primary" className="px-3 py-2">
            <FontAwesomeIcon icon={faUndo} className="me-2" />
            {returns.length} Permintaan
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-4">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-medium">
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  Filter Status
                </Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu Persetujuan</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                  <option value="processing">Sedang Diproses</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Returns List */}
      {returns.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body className="p-5">
            <div className="text-muted mb-3">
              <FontAwesomeIcon icon={faFileAlt} size="3x" />
            </div>
            <h5 className="fw-medium text-dark mb-2">Belum Ada Pengembalian</h5>
            <p className="text-muted">Anda belum pernah mengajukan permintaan pengembalian.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {returns.map((returnItem) => {
            const statusInfo = getReturnStatusText(returnItem.status);
            const getVariant = (color) => {
              switch(color) {
                case 'yellow': return 'warning';
                case 'green': return 'success';
                case 'red': return 'danger';
                case 'blue': return 'primary';
                default: return 'secondary';
              }
            };
            
            return (
              <Col lg={6} className="mb-4" key={returnItem.id}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-semibold text-dark mb-1">
                          #{returnItem.return_number}
                        </h5>
                        <p className="text-muted small mb-1">
                          Pesanan: #{returnItem.order.order_number}
                        </p>
                        <p className="text-muted small">
                          {formatDate(returnItem.createdAt)}
                        </p>
                      </div>
                      <Badge bg={getVariant(statusInfo.color)}>
                        {statusInfo.text}
                      </Badge>
                    </div>

                    {/* Product Info */}
                    <div className="d-flex align-items-start mb-3 p-3 bg-light rounded">
                      <img
                        src={returnItem.orderItem.product.image || '/default.webp'}
                        alt={returnItem.orderItem.product.name}
                        className="me-3 rounded border"
                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1">
                        <h6 className="fw-semibold text-dark mb-1">
                          {returnItem.orderItem.product.name}
                        </h6>
                        {returnItem.orderItem.variation && (
                          <p className="text-muted small mb-1">
                            <FontAwesomeIcon icon={faFileAlt} className="me-1" />
                            {returnItem.orderItem.variation.size} - {returnItem.orderItem.variation.color}
                          </p>
                        )}
                        <p className="text-muted small mb-2">
                          <strong>Qty:</strong> {returnItem.orderItem.quantity}
                        </p>
                        <p className="fw-bold text-primary h6 mb-0">
                          {formatCurrency(returnItem.requested_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Return Details */}
                    <div className="mb-3 border-start border-3 border-primary ps-3">
                      <div className="row mb-2">
                        <div className="col-4">
                          <span className="small fw-semibold text-dark">Alasan:</span>
                        </div>
                        <div className="col-8">
                          <span className="small text-muted">
                            {getReasonText(returnItem.reason_code)}
                          </span>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4">
                          <span className="small fw-semibold text-dark">Jenis:</span>
                        </div>
                        <div className="col-8">
                          <span className="small text-muted">
                            {returnItem.return_type === 'refund' ? 'Pengembalian Uang' :
                             returnItem.return_type === 'exchange' ? 'Tukar Barang' : 'Kredit Toko'}
                          </span>
                        </div>
                      </div>
                      {returnItem.reason_description && (
                        <div className="row">
                          <div className="col-4">
                            <span className="small fw-semibold text-dark">Deskripsi:</span>
                          </div>
                          <div className="col-8">
                            <p className="small text-muted mb-0">
                              {returnItem.reason_description.length > 100 
                                ? returnItem.reason_description.substring(0, 100) + '...'
                                : returnItem.reason_description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {returnItem.admin_notes && (
                      <Alert variant="info" className="mb-3 border-0 bg-light">
                        <h6 className="small fw-semibold mb-2 text-primary">
                          <FontAwesomeIcon icon={faFileAlt} className="me-1" />
                          Catatan Admin:
                        </h6>
                        <p className="small mb-0 text-dark">{returnItem.admin_notes}</p>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="d-flex gap-2 mt-3">
                      <Button
                        as={Link}
                        to={`/user/returns/${returnItem.id}`}
                        variant="primary"
                        size="sm"
                        className="px-3"
                      >
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        Detail
                      </Button>
                      
                      {canCancelReturn(returnItem.status) && (
                        <Button
                          onClick={() => confirmCancelReturn(returnItem)}
                          variant="outline-danger"
                          size="sm"
                          className="px-3"
                        >
                          <FontAwesomeIcon icon={faTimes} className="me-1" />
                          Batalkan
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
        )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <Pagination className="shadow-sm">
            <Pagination.Prev 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Pagination.Item
                key={page}
                active={currentPage === page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Pagination.Item>
            ))}
            
            <Pagination.Next
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
      {/* Confirm Dialog */}
      <ConfirmDialog
        show={showConfirm}
        title="Batalkan Pengembalian"
        message={`Apakah Anda yakin ingin membatalkan permintaan pengembalian #${selectedReturn?.return_number}?`}
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        onConfirm={handleCancelReturn}
        onHide={() => {
          setShowConfirm(false);
          setSelectedReturn(null);
        }}
        variant="danger"
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default ReturnHistory;