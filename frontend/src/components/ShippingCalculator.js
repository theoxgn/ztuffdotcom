import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Spinner, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';

const ShippingCalculator = ({ onShippingChange, weight = 1000 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [error, setError] = useState('');

  // Search destinations
  const searchDestinations = async (query) => {
    if (!query || query.length < 3) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/shipping/search?search=${query}&limit=10`);
      if (response.data.success) {
        setDestinations(response.data.data.data);
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
      setError('Gagal mencari destinasi');
    } finally {
      setLoading(false);
    }
  };

  // Calculate shipping cost
  const calculateShipping = async () => {
    if (!selectedOrigin || !selectedDestination) {
      setError('Pilih origin dan destinasi terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/shipping/cost', {
        origin: selectedOrigin,
        destination: selectedDestination,
        weight: weight,
        courier: 'jne:pos:tiki'
      });

      if (response.data.success) {
        setShippingOptions(response.data.data.data);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setError('Gagal menghitung ongkos kirim');
    } finally {
      setLoading(false);
    }
  };

  // Handle shipping selection
  const handleShippingSelect = (option) => {
    setSelectedShipping(option);
    onShippingChange({
      cost: option.cost,
      courier: option.code,
      service: option.service,
      etd: option.etd,
      description: option.description
    });
  };

  // Search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchDestinations(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Card className="mb-4">
      <Card.Body>
        <h5 className="mb-3">Pilih Alamat Pengiriman</h5>
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Origin (Default: Jakarta)</Form.Label>
              <Form.Select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
              >
                <option value="">Pilih Origin</option>
                <option value="17473">Jakarta Barat (Grogol)</option>
                <option value="17596">Jakarta Pusat (Cempaka Putih)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Cari Destinasi</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ketik nama kota/kabupaten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {loading && searchQuery && (
                <div className="text-center mt-2">
                  <Spinner animation="border" size="sm" />
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>

        {destinations.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label>Pilih Destinasi</Form.Label>
            <Form.Select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
            >
              <option value="">Pilih Destinasi</option>
              {destinations.map(dest => (
                <option key={dest.id} value={dest.id}>
                  {dest.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        <div className="d-grid mb-3">
          <Button 
            variant="outline-primary" 
            onClick={calculateShipping}
            disabled={!selectedOrigin || !selectedDestination || loading}
          >
            {loading ? 'Menghitung...' : 'Hitung Ongkos Kirim'}
          </Button>
        </div>

        {shippingOptions.length > 0 && (
          <div>
            <h6 className="mb-3">Pilih Layanan Pengiriman</h6>
            <div className="d-grid gap-2">
              {shippingOptions.map((option, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer border ${selectedShipping?.service === option.service && selectedShipping?.code === option.code ? 'border-primary bg-light' : ''}`}
                  onClick={() => handleShippingSelect(option)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{option.name}</strong>
                        <div className="small text-muted">{option.description}</div>
                        <Badge bg="info" className="mt-1">ETD: {option.etd}</Badge>
                      </div>
                      <div className="text-end">
                        <strong className="text-primary">
                          Rp {option.cost.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedShipping && (
          <Alert variant="success" className="mt-3">
            <strong>Pengiriman Dipilih:</strong><br />
            {selectedShipping.description} - Rp {selectedShipping.cost.toLocaleString('id-ID')} 
            <br />
            <small>Estimasi: {selectedShipping.etd}</small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default ShippingCalculator;