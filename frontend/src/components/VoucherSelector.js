import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, InputGroup, Badge, Card, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPercent, faTag, faCheck, faTimes, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const VoucherSelector = ({ subtotal, onVoucherApplied, onVoucherRemoved, disabled = false }) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  // Fetch available vouchers
  const fetchAvailableVouchers = async () => {
    try {
      setVouchersLoading(true);
      const response = await axios.get('/api/vouchers/active');
      if (response.data.success) {
        setAvailableVouchers(response.data.data.vouchers || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setVouchersLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableVouchers();
  }, []);

  const validateVoucher = async (code) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/vouchers/validate', {
        code: code,
        subtotal: subtotal
      });

      if (response.data.success) {
        const { voucher, discount, final_total } = response.data.data;
        
        setAppliedVoucher(voucher);
        setDiscountAmount(discount);
        setSuccess(`Voucher berhasil diterapkan! Diskon: Rp ${discount.toLocaleString('id-ID')}`);
        
        // Notify parent component
        if (onVoucherApplied) {
          onVoucherApplied({
            voucher_code: code,
            voucher_id: voucher.id,
            discount_amount: discount,
            final_total: final_total
          });
        }
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      setError(error.response?.data?.message || 'Gagal memvalidasi voucher');
      setAppliedVoucher(null);
      setDiscountAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (voucherCode.trim()) {
      validateVoucher(voucherCode.trim().toUpperCase());
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setError('');
    setSuccess('');
    
    // Notify parent component
    if (onVoucherRemoved) {
      onVoucherRemoved();
    }
  };

  const handleSelectVoucher = (voucher) => {
    setVoucherCode(voucher.code);
    setShowVoucherList(false);
    validateVoucher(voucher.code);
  };

  const formatVoucherDisplay = (voucher) => {
    if (voucher.discount_type === 'percentage') {
      return `${voucher.discount_value}%${voucher.max_discount ? ` (Max Rp ${voucher.max_discount.toLocaleString('id-ID')})` : ''}`;
    } else {
      return `Rp ${voucher.discount_value.toLocaleString('id-ID')}`;
    }
  };

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = voucher.end_date ? new Date(voucher.end_date) : null;
    
    if (now < startDate) return 'upcoming';
    if (endDate && now > endDate) return 'expired';
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return 'used_up';
    if (voucher.min_purchase > subtotal) return 'min_not_met';
    return 'available';
  };

  const getStatusBadge = (status, voucher) => {
    switch (status) {
      case 'upcoming':
        return <Badge bg="secondary" size="sm">Akan Datang</Badge>;
      case 'expired':
        return <Badge bg="danger" size="sm">Kadaluarsa</Badge>;
      case 'used_up':
        return <Badge bg="warning" size="sm">Habis</Badge>;
      case 'min_not_met':
        return <Badge bg="info" size="sm">Min. Rp {voucher.min_purchase.toLocaleString('id-ID')}</Badge>;
      default:
        return <Badge bg="success" size="sm">Tersedia</Badge>;
    }
  };

  return (
    <div className="voucher-selector">
      {appliedVoucher ? (
        <div className="applied-voucher-card">
          <div className="applied-voucher-content">
            <div className="row align-items-center">
              <div className="col-auto">
                <div className="applied-voucher-icon">
                  <FontAwesomeIcon icon={faTicketAlt} className="text-white" />
                </div>
              </div>
              <div className="col">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="applied-voucher-code">{appliedVoucher.code}</div>
                    <div className="applied-voucher-desc">
                      {appliedVoucher.description}
                    </div>
                    <div className="applied-voucher-discount">
                      Hemat {formatVoucherDisplay(appliedVoucher)}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="applied-voucher-amount">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </div>
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={handleRemoveVoucher}
                      disabled={disabled}
                      className="applied-voucher-remove"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="applied-voucher-glow"></div>
          </div>
        </div>
      ) : (
        <div>
          <Form onSubmit={handleApplyVoucher}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Masukkan kode voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                disabled={disabled || loading}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={disabled || loading || !voucherCode.trim()}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="me-1" />
                    Terapkan
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setShowVoucherList(true)}
                disabled={disabled}
              >
                <FontAwesomeIcon icon={faTag} />
              </Button>
            </InputGroup>
          </Form>

          {error && (
            <Alert variant="danger" className="mt-2 mb-0">
              <small>{error}</small>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mt-2 mb-0">
              <small>{success}</small>
            </Alert>
          )}
        </div>
      )}

      {/* Available Vouchers Modal */}
      <Modal show={showVoucherList} onHide={() => setShowVoucherList(false)} size="md" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title className="w-100 text-center">
            <div className="d-flex align-items-center justify-content-center">
              <FontAwesomeIcon icon={faTicketAlt} className="me-2 text-primary" size="sm" />
              <span style={{ fontSize: '1.1rem' }}>Pilih Voucher</span>
            </div>
            <small className="text-muted d-block mt-1" style={{ fontSize: '0.8rem' }}>Hemat lebih banyak dengan voucher kami</small>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-3 py-2">
          {vouchersLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
              <p className="text-muted small">Memuat voucher...</p>
            </div>
          ) : availableVouchers.length === 0 ? (
            <div className="text-center py-4">
              <div className="mb-3">
                <FontAwesomeIcon icon={faTicketAlt} size="2x" className="text-muted opacity-50" />
              </div>
              <h6 className="text-muted mb-2">Belum Ada Voucher</h6>
              <p className="text-muted small">Tidak ada voucher tersedia saat ini</p>
            </div>
          ) : (
            <div className="voucher-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {availableVouchers.map((voucher) => {
                const status = getVoucherStatus(voucher);
                const isUsable = status === 'available';
                
                return (
                  <div key={voucher.id} className="mb-2">
                    <div 
                      className={`voucher-card-compact ${isUsable ? 'voucher-available' : 'voucher-disabled'}`}
                      onClick={() => isUsable && handleSelectVoucher(voucher)}
                      style={{ cursor: isUsable ? 'pointer' : 'not-allowed' }}
                    >
                      <div className="voucher-border-compact">
                        <div className="voucher-content-compact">
                          <div className="d-flex align-items-center">
                            <div className={`voucher-icon-compact ${isUsable ? 'bg-primary' : 'bg-secondary'}`}>
                              <FontAwesomeIcon 
                                icon={voucher.discount_type === 'percentage' ? faPercent : faTag}
                                className="text-white"
                                size="sm"
                              />
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <div className="voucher-code-compact">{voucher.code}</div>
                                  <div className="voucher-desc-compact">{voucher.description}</div>
                                  <div className="voucher-discount-compact">
                                    Hemat {formatVoucherDisplay(voucher)}
                                  </div>
                                </div>
                                <div className="text-end">
                                  {getStatusBadge(status, voucher)}
                                  <div className={`voucher-action-compact ${isUsable ? 'text-primary' : 'text-muted'} mt-1`}>
                                    {isUsable ? (
                                      <small className="fw-bold">PILIH</small>
                                    ) : (
                                      <small>TIDAK TERSEDIA</small>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="voucher-details-compact mt-2">
                                {voucher.min_purchase > 0 && (
                                  <small className="text-muted me-3">
                                    Min. Rp {voucher.min_purchase.toLocaleString('id-ID')}
                                  </small>
                                )}
                                
                                {voucher.end_date && (
                                  <small className="text-muted">
                                    s/d {new Date(voucher.end_date).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit'
                                    })}
                                  </small>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <div className="w-100 text-center">
            <Button variant="outline-secondary" onClick={() => setShowVoucherList(false)} className="px-4">
              Tutup
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Custom CSS for voucher cards */}
      <style jsx>{`
        /* Applied Voucher Styles */
        .applied-voucher-card {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 12px;
          padding: 3px;
          position: relative;
          overflow: hidden;
          animation: slideInSuccess 0.5s ease-out;
        }
        
        .applied-voucher-content {
          background: white;
          border-radius: 9px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }
        
        .applied-voucher-icon {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        .applied-voucher-code {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #28a745;
          font-size: 1rem;
          letter-spacing: 1px;
        }
        
        .applied-voucher-desc {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        
        .applied-voucher-discount {
          color: #28a745;
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .applied-voucher-amount {
          color: #28a745;
          font-weight: bold;
          font-size: 1.1rem;
          margin-bottom: 8px;
        }
        
        .applied-voucher-remove {
          border: 1px solid #28a745 !important;
          color: #28a745 !important;
          width: 32px;
          height: 32px;
          border-radius: 50% !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .applied-voucher-remove:hover {
          background: #28a745 !important;
          color: white !important;
        }
        
        .applied-voucher-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 12px;
          z-index: -1;
          opacity: 0.3;
          animation: pulse 2s infinite;
        }
        
        @keyframes slideInSuccess {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.02);
          }
        }

        /* Compact Modal Voucher Card Styles */
        .voucher-card-compact {
          transition: all 0.2s ease;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 0;
        }
        
        .voucher-available:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.1);
        }
        
        .voucher-border-compact {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          padding: 1px;
          border-radius: 8px;
        }
        
        .voucher-disabled .voucher-border-compact {
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        }
        
        .voucher-content-compact {
          background: white;
          border-radius: 7px;
          padding: 12px;
          position: relative;
        }
        
        .voucher-icon-compact {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        
        .voucher-code-compact {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #333;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        
        .voucher-desc-compact {
          color: #666;
          font-size: 0.75rem;
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .voucher-discount-compact {
          color: #28a745;
          font-weight: bold;
          font-size: 0.8rem;
        }
        
        .voucher-details-compact {
          border-top: 1px solid #f0f0f0;
          padding-top: 6px;
        }
        
        .voucher-action-compact {
          font-size: 0.7rem;
          letter-spacing: 0.5px;
        }
        
        .voucher-disabled {
          opacity: 0.6;
        }
        
        .voucher-disabled .voucher-content-compact {
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default VoucherSelector;