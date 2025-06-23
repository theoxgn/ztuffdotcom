import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Badge, Table, Pagination, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck, faTimes, faSearch, faRedo, faClipboardList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { getAllReturns, processReturnRequest, getReturnStatusText } from '../../services/returnService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import ReturnDetail from './ReturnDetail';

const ReturnsList = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [processAction, setProcessAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchReturns();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await getAllReturns(params);
      if (response.success) {
        setReturns(response.data.returns);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      setToast({
        show: true,
        message: 'Gagal memuat data pengembalian',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = (returnItem, action) => {
    setSelectedReturn(returnItem);
    setProcessAction(action);
    setAdminNotes('');
    setApprovedAmount(returnItem.requested_amount);
    setShowProcessDialog(true);
  };

  const confirmProcessReturn = async () => {
    if (!selectedReturn || !processAction) return;

    const processData = {
      action: processAction,
      admin_notes: adminNotes
    };

    if (processAction === 'approve' && approvedAmount) {
      processData.approved_amount = parseFloat(approvedAmount);
    }

    try {
      const response = await processReturnRequest(selectedReturn.id, processData);
      if (response.success) {
        setToast({
          show: true,
          message: `Permintaan pengembalian berhasil ${processAction === 'approve' ? 'disetujui' : 'ditolak'}`,
          type: 'success'
        });
        fetchReturns(); // Refresh the list
      }
    } catch (error) {
      setToast({
        show: true,
        message: error.message || 'Gagal memproses permintaan pengembalian',
        type: 'error'
      });
    } finally {
      setShowProcessDialog(false);
      setSelectedReturn(null);
      setProcessAction('');
      setAdminNotes('');
      setApprovedAmount('');
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

  const canProcess = (status) => {
    return status === 'pending';
  };

  const getReturnStats = () => {
    const stats = {
      pending: returns.filter(r => r.status === 'pending').length,
      approved: returns.filter(r => r.status === 'approved').length,
      rejected: returns.filter(r => r.status === 'rejected').length,
      completed: returns.filter(r => r.status === 'completed').length
    };
    return stats;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = getReturnStats();

  return (
    <div className="admin-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Manajemen Pengembalian</h1>
          <p className="text-muted mb-0">Kelola permintaan pengembalian dari pelanggan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-warning mb-2" />
              <h5 className="card-title">{stats.pending}</h5>
              <p className="card-text text-muted">Menunggu Review</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faCheck} size="2x" className="text-success mb-2" />
              <h5 className="card-title">{stats.approved}</h5>
              <p className="card-text text-muted">Disetujui</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faTimes} size="2x" className="text-danger mb-2" />
              <h5 className="card-title">{stats.rejected}</h5>
              <p className="card-text text-muted">Ditolak</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faClipboardList} size="2x" className="text-primary mb-2" />
              <h5 className="card-title">{stats.completed}</h5>
              <p className="card-text text-muted">Selesai</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Cari</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={faSearch} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Cari nomor return, pesanan, atau nama pelanggan..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Filter Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu Review</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                  <option value="processing">Diproses</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end mb-3">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              >
                <FontAwesomeIcon icon={faRedo} className="me-1" />
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Returns Table */}
      <Card>
        <Card.Body className="p-0">
          {returns.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <FontAwesomeIcon icon={faClipboardList} size="3x" />
              </div>
              <h5 className="fw-medium text-dark mb-2">Tidak Ada Data</h5>
              <p className="text-muted">Belum ada permintaan pengembalian yang ditemukan.</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Produk</th>
                  <th>Return #</th>
                  <th>Pelanggan</th>
                  <th>Alasan</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={returnItem.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={returnItem.orderItem.product.image || '/default.webp'}
                            alt={returnItem.orderItem.product.name}
                            className="me-3 rounded"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-medium">{returnItem.orderItem.product.name}</div>
                            <small className="text-muted">Order: #{returnItem.order.order_number}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-medium">#{returnItem.return_number}</span>
                      </td>
                      <td>{returnItem.user.name}</td>
                      <td>
                        <small>{getReasonText(returnItem.reason_code)}</small>
                      </td>
                      <td>
                        <span className="fw-semibold">{formatCurrency(returnItem.requested_amount)}</span>
                      </td>
                      <td>
                        <Badge bg={getVariant(statusInfo.color)}>
                          {statusInfo.text}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">{formatDate(returnItem.createdAt)}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            as={Link}
                            to={`/admin/returns/${returnItem.id}`}
                            variant="outline-primary"
                            size="sm"
                            className="btn-sm px-2 py-1"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          
                          {canProcess(returnItem.status) && (
                            <>
                              <Button
                                onClick={() => handleProcessReturn(returnItem, 'approve')}
                                variant="success"
                                size="sm"
                                className="btn-sm px-2 py-1"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </Button>
                              <Button
                                onClick={() => handleProcessReturn(returnItem, 'reject')}
                                variant="danger"
                                size="sm"
                                className="btn-sm px-2 py-1"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
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

      {/* Process Return Dialog */}
      <ConfirmDialog
        isOpen={showProcessDialog}
        title={`${processAction === 'approve' ? 'Setujui' : 'Tolak'} Pengembalian`}
        onConfirm={confirmProcessReturn}
        onCancel={() => {
          setShowProcessDialog(false);
          setSelectedReturn(null);
          setProcessAction('');
        }}
        confirmText={processAction === 'approve' ? 'Setujui' : 'Tolak'}
        cancelText="Batal"
        type={processAction === 'approve' ? 'success' : 'danger'}
      >
        <div>
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
        </div>
      </ConfirmDialog>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

const Returns = () => {
  return (
    <Routes>
      <Route path="/" element={<ReturnsList />} />
      <Route path="/:returnId" element={<ReturnDetail />} />
    </Routes>
  );
};

export default Returns;