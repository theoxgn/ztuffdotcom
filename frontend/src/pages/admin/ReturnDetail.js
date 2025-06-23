import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faTimes, faEdit, faUser, faBox, faCalendar, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { getAdminReturnById, processReturnRequest, getReturnStatusText } from '../../services/returnService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from '../../components/Toast';

const ReturnDetail = () => {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchReturnDetail();
  }, [returnId]);

  const fetchReturnDetail = async () => {
    try {
      setLoading(true);
      const response = await getAdminReturnById(returnId);
      if (response.success) {
        setReturnData(response.data);
        setApprovedAmount(response.data.requested_amount);
      } else {
        setError('Data pengembalian tidak ditemukan');
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail pengembalian');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = (action) => {
    console.log('Handle process return called with action:', action);
    console.log('Return data status:', returnData?.status);
    console.log('Can process:', canProcess(returnData?.status));
    setProcessAction(action);
    setAdminNotes('');
    setShowProcessDialog(true);
  };

  const confirmProcessReturn = async () => {
    if (!returnData || !processAction) return;

    const processData = {
      action: processAction,
      admin_notes: adminNotes
    };

    if (processAction === 'approve' && approvedAmount) {
      processData.approved_amount = parseFloat(approvedAmount);
    }

    try {
      console.log('Processing return with data:', processData);
      const response = await processReturnRequest(returnData.id, processData);
      console.log('Response:', response);
      
      if (response.success) {
        setToast({
          show: true,
          message: `Permintaan pengembalian berhasil ${processAction === 'approve' ? 'disetujui' : 'ditolak'}`,
          type: 'success'
        });
        fetchReturnDetail(); // Refresh the data
      } else {
        setToast({
          show: true,
          message: response.message || 'Gagal memproses permintaan pengembalian',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error processing return:', error);
      setToast({
        show: true,
        message: error.message || 'Gagal memproses permintaan pengembalian',
        type: 'error'
      });
    } finally {
      setShowProcessDialog(false);
      setProcessAction('');
      setAdminNotes('');
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

  const canProcess = (status) => {
    return status === 'pending';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="admin-content">
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/admin/returns')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali ke Daftar Pengembalian
        </Button>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="admin-content">
        <Alert variant="warning" className="mb-4">
          Data pengembalian tidak ditemukan
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/admin/returns')}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali ke Daftar Pengembalian
        </Button>
      </div>
    );
  }

  const statusInfo = getReturnStatusText(returnData.status);
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
    <div className="admin-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Detail Pengembalian</h1>
          <p className="text-muted mb-0">#{returnData.return_number}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/returns')}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Kembali
          </Button>
          {canProcess(returnData.status) ? (
            <>
              <Button
                variant="success"
                onClick={() => handleProcessReturn('approve')}
              >
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                Setujui
              </Button>
              <Button
                variant="danger"
                onClick={() => handleProcessReturn('reject')}
              >
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                Tolak
              </Button>
            </>
          ) : (
            <div>
              <small className="text-muted">Status: {returnData.status} - {canProcess(returnData.status) ? 'Can process' : 'Cannot process'}</small>
            </div>
          )}
        </div>
      </div>

      <Row>
        <Col lg={8}>
          {/* Return Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="card-title mb-0">
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Informasi Pengembalian
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Nomor Return</label>
                    <p className="mb-0">{returnData.return_number}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Status</label>
                    <div>
                      <Badge bg={getVariant(statusInfo.color)}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Alasan</label>
                    <p className="mb-0">{getReasonText(returnData.reason_code)}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Jenis Return</label>
                    <p className="mb-0">{returnData.return_type === 'refund' ? 'Pengembalian Uang' : 'Penggantian'}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Jumlah Diminta</label>
                    <p className="mb-0 fw-semibold">{formatCurrency(returnData.requested_amount)}</p>
                  </div>
                  {returnData.approved_amount && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Jumlah Disetujui</label>
                      <p className="mb-0 fw-semibold text-success">{formatCurrency(returnData.approved_amount)}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Tanggal Dibuat</label>
                    <p className="mb-0">{formatDate(returnData.createdAt)}</p>
                  </div>
                  {returnData.return_deadline && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Batas Pengembalian</label>
                      <p className="mb-0">{formatDate(returnData.return_deadline)}</p>
                    </div>
                  )}
                </Col>
              </Row>

              <div className="mb-3">
                <label className="form-label fw-medium">Deskripsi Detail</label>
                <p className="mb-0">{returnData.reason_description}</p>
              </div>

              {returnData.customer_notes && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Catatan Pelanggan</label>
                  <p className="mb-0">{returnData.customer_notes}</p>
                </div>
              )}

              {returnData.admin_notes && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Catatan Admin</label>
                  <p className="mb-0">{returnData.admin_notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Product Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="card-title mb-0">
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Informasi Produk
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-start">
                <img
                  src={returnData.orderItem.product.image || '/default.webp'}
                  alt={returnData.orderItem.product.name}
                  className="me-3 rounded"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <div className="flex-grow-1">
                  <h5 className="fw-medium">{returnData.orderItem.product.name}</h5>
                  {returnData.orderItem.variation && (
                    <p className="text-muted mb-1">
                      Variasi: {returnData.orderItem.variation.size} - {returnData.orderItem.variation.color}
                    </p>
                  )}
                  <p className="text-muted mb-1">
                    Kuantitas: {returnData.orderItem.quantity}
                  </p>
                  <p className="fw-semibold mb-0">
                    Harga: {formatCurrency(returnData.orderItem.price)}
                  </p>
                  <p className="fw-semibold">
                    Total: {formatCurrency(returnData.orderItem.total)}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Customer Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="card-title mb-0">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Informasi Pelanggan
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label fw-medium">Nama</label>
                <p className="mb-0">{returnData.user.name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium">Email</label>
                <p className="mb-0">{returnData.user.email}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium">Nomor Pesanan</label>
                <p className="mb-0">#{returnData.order.order_number}</p>
              </div>
            </Card.Body>
          </Card>

          {/* Timeline */}
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">
                <FontAwesomeIcon icon={faCalendar} className="me-2" />
                Timeline
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary rounded-circle me-3" style={{ width: '12px', height: '12px' }}></div>
                <div>
                  <h6 className="mb-1 fw-semibold">Return Dibuat</h6>
                  <small className="text-muted">{formatDate(returnData.createdAt)}</small>
                </div>
              </div>
              
              {returnData.status !== 'pending' && (
                <div className="d-flex align-items-center">
                  <div className={`bg-${returnData.status === 'approved' ? 'success' : 'danger'} rounded-circle me-3`} style={{ width: '12px', height: '12px' }}></div>
                  <div>
                    <h6 className="mb-1 fw-semibold">
                      {returnData.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </h6>
                    <small className="text-muted">{formatDate(returnData.updatedAt)}</small>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Process Return Dialog */}
      <Modal show={showProcessDialog} onHide={() => {
        setShowProcessDialog(false);
        setProcessAction('');
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={processAction === 'approve' ? faCheck : faTimes} className="me-2" />
            {`${processAction === 'approve' ? 'Setujui' : 'Tolak'} Pengembalian`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            {processAction === 'approve' 
              ? 'Menyetujui permintaan pengembalian ini akan memulai proses pengembalian.'
              : 'Menolak permintaan pengembalian ini akan mengakhiri proses pengembalian.'
            }
          </p>
          
          {processAction === 'approve' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Jumlah yang Disetujui
              </Form.Label>
              <Form.Control
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Masukkan jumlah yang disetujui"
              />
            </Form.Group>
          )}
          
          <Form.Group>
            <Form.Label className="fw-medium">
              Catatan Admin
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Berikan catatan atau alasan untuk keputusan ini..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowProcessDialog(false);
            setProcessAction('');
          }}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Batal
          </Button>
          <Button variant={processAction === 'approve' ? 'success' : 'danger'} onClick={confirmProcessReturn}>
            <FontAwesomeIcon icon={processAction === 'approve' ? faCheck : faTimes} className="me-2" />
            {processAction === 'approve' ? 'Setujui' : 'Tolak'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />

    </div>
  );
};

export default ReturnDetail;