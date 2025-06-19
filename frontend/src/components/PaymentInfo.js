import React from 'react';
import { Card, Alert, Button, Row, Col, Badge } from 'react-bootstrap';

const PaymentInfo = ({ paymentData, showTitle = true }) => {
  if (!paymentData || !paymentData.payment_type) {
    return null;
  }

  const { payment_type, payment_info, status, midtrans_transaction_status } = paymentData;

  const renderPaymentDetails = () => {
    switch (payment_type) {
      case 'bank_transfer':
      case 'bca':
      case 'bni':
      case 'bri':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Bank:</strong></Col>
              <Col sm={8}>{payment_info?.bank?.toUpperCase() || 'Bank Transfer'}</Col>
            </Row>
            <Row>
              <Col sm={4}><strong>Nomor VA:</strong></Col>
              <Col sm={8}>
                <span className="font-monospace">{payment_info?.va_number || payment_info?.account_number}</span>
                {payment_info?.va_number && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => navigator.clipboard.writeText(payment_info.va_number)}
                  >
                    Copy
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        );

      case 'permata':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Bank:</strong></Col>
              <Col sm={8}>PERMATA</Col>
            </Row>
            <Row>
              <Col sm={4}><strong>Nomor VA:</strong></Col>
              <Col sm={8}>
                <span className="font-monospace">{payment_info?.permata_va_number}</span>
                {payment_info?.permata_va_number && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => navigator.clipboard.writeText(payment_info.permata_va_number)}
                  >
                    Copy
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        );

      case 'echannel':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Mandiri Bill:</strong></Col>
              <Col sm={8}>
                <div>Biller Code: <span className="font-monospace">{payment_info?.biller_code}</span></div>
                <div>Bill Key: <span className="font-monospace">{payment_info?.bill_key}</span></div>
              </Col>
            </Row>
          </div>
        );

      case 'gopay':
        return (
          <div>
            <Row className="mb-2">
              <Col sm={4}><strong>GoPay:</strong></Col>
              <Col sm={8}>Scan QR Code atau buka aplikasi GoPay</Col>
            </Row>
            {payment_info?.qr_code && (
              <Row>
                <Col sm={4}><strong>QR Code:</strong></Col>
                <Col sm={8}>
                  <img 
                    src={`data:image/png;base64,${payment_info.qr_code}`} 
                    alt="GoPay QR Code" 
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                </Col>
              </Row>
            )}
            {payment_info?.deeplink_redirect && (
              <Row className="mt-2">
                <Col sm={4}></Col>
                <Col sm={8}>
                  <Button 
                    variant="success" 
                    href={payment_info.deeplink_redirect}
                    target="_blank"
                  >
                    Buka GoPay App
                  </Button>
                </Col>
              </Row>
            )}
          </div>
        );

      case 'qris':
        return (
          <div>
            <Row className="mb-2">
              <Col sm={4}><strong>QRIS:</strong></Col>
              <Col sm={8}>Scan QR Code dengan aplikasi pembayaran</Col>
            </Row>
            {payment_info?.qr_code && (
              <Row>
                <Col sm={4}><strong>QR Code:</strong></Col>
                <Col sm={8}>
                  <img 
                    src={`data:image/png;base64,${payment_info.qr_code}`} 
                    alt="QRIS QR Code" 
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                </Col>
              </Row>
            )}
          </div>
        );

      case 'shopeepay':
      case 'dana':
      case 'linkaja':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>{payment_type.toUpperCase()}:</strong></Col>
              <Col sm={8}>
                {payment_info?.checkout_redirect_url && (
                  <Button 
                    variant="primary" 
                    href={payment_info.checkout_redirect_url}
                    target="_blank"
                  >
                    Bayar dengan {payment_type.toUpperCase()}
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        );

      case 'credit_card':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Kartu Kredit:</strong></Col>
              <Col sm={8}>{payment_info?.bank?.toUpperCase()}</Col>
            </Row>
            <Row>
              <Col sm={4}><strong>Nomor Kartu:</strong></Col>
              <Col sm={8}>{payment_info?.masked_card}</Col>
            </Row>
            {payment_info?.approval_code && (
              <Row>
                <Col sm={4}><strong>Approval Code:</strong></Col>
                <Col sm={8}>{payment_info.approval_code}</Col>
              </Row>
            )}
          </div>
        );

      case 'cstore':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Convenience Store:</strong></Col>
              <Col sm={8}>{payment_info?.store?.toUpperCase()}</Col>
            </Row>
            <Row>
              <Col sm={4}><strong>Payment Code:</strong></Col>
              <Col sm={8}>
                <span className="font-monospace">{payment_info?.payment_code}</span>
                {payment_info?.payment_code && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => navigator.clipboard.writeText(payment_info.payment_code)}
                  >
                    Copy
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        );

      case 'akulaku':
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Akulaku:</strong></Col>
              <Col sm={8}>
                {payment_info?.checkout_redirect_url && (
                  <Button 
                    variant="primary" 
                    href={payment_info.checkout_redirect_url}
                    target="_blank"
                  >
                    Bayar dengan Akulaku
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        );

      default:
        return (
          <div>
            <Row>
              <Col sm={4}><strong>Payment Type:</strong></Col>
              <Col sm={8}>{payment_type}</Col>
            </Row>
            {payment_info?.raw_response && (
              <Row>
                <Col sm={4}><strong>Details:</strong></Col>
                <Col sm={8}>
                  <pre className="small">{JSON.stringify(payment_info.raw_response, null, 2)}</pre>
                </Col>
              </Row>
            )}
          </div>
        );
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Menunggu Pembayaran';
      case 'cancelled': return 'Dibatalkan';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Diterima';
      default: return status;
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        {showTitle && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Informasi Pembayaran</h6>
            <Badge bg={getStatusVariant()}>{getStatusText()}</Badge>
          </div>
        )}
        
        {renderPaymentDetails()}
        
        {midtrans_transaction_status && (
          <Row className="mt-2">
            <Col sm={4}><strong>Status Transaksi:</strong></Col>
            <Col sm={8}>
              <Badge bg="info">{midtrans_transaction_status}</Badge>
            </Col>
          </Row>
        )}

        {(status === 'pending' && ['bank_transfer', 'bca', 'bni', 'bri', 'permata', 'echannel'].includes(payment_type)) && (
          <Alert variant="info" className="mt-3 mb-0">
            <small>
              <strong>Petunjuk Pembayaran:</strong><br />
              1. Transfer sesuai nominal yang tertera<br />
              2. Gunakan nomor VA/kode pembayaran di atas<br />
              3. Pembayaran akan dikonfirmasi otomatis setelah transfer berhasil
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default PaymentInfo;