import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [settings, setSettings] = useState({
    shipping_origin_id: '',
    shipping_origin_label: '',
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: ''
  });

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Search destinations for shipping origin
  const searchDestinations = async (query) => {
    if (!query || query.length < 3) return;
    
    try {
      setSearchLoading(true);
      const response = await axios.get(`/api/shipping/search?search=${query}&limit=10`);
      if (response.data.success) {
        setDestinations(response.data.data.data);
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
      setError('Failed to search destinations');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search query change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchDestinations(searchQuery);
      } else {
        setDestinations([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle origin selection
  const handleOriginSelect = (destination) => {
    setSettings(prev => ({
      ...prev,
      shipping_origin_id: destination.id,
      shipping_origin_label: destination.label
    }));
    setDestinations([]);
    setSearchQuery('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.put('/api/settings', {
        settings: settings
      });

      if (response.data.success) {
        setSuccess('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Website Settings</h1>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <h5 className="mb-3">Store Information</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Store Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="store_name"
                        value={settings.store_name}
                        onChange={handleInputChange}
                        placeholder="Enter store name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Store Phone</Form.Label>
                      <Form.Control
                        type="text"
                        name="store_phone"
                        value={settings.store_phone}
                        onChange={handleInputChange}
                        placeholder="Enter store phone"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Store Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="store_email"
                    value={settings.store_email}
                    onChange={handleInputChange}
                    placeholder="Enter store email"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Store Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="store_address"
                    value={settings.store_address}
                    onChange={handleInputChange}
                    placeholder="Enter store address"
                  />
                </Form.Group>

                <h5 className="mb-3">Shipping Configuration</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Search Shipping Origin</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Type city/district name to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchLoading && (
                    <div className="text-center mt-2">
                      <Spinner animation="border" size="sm" />
                    </div>
                  )}
                </Form.Group>

                {destinations.length > 0 && (
                  <Card className="mb-3">
                    <Card.Body className="p-2">
                      <div className="small text-muted mb-2">Select origin address:</div>
                      {destinations.map(dest => (
                        <div 
                          key={dest.id}
                          className="p-2 border-bottom cursor-pointer hover-bg-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOriginSelect(dest)}
                        >
                          <small>{dest.label}</small>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Current Shipping Origin</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.shipping_origin_label}
                    readOnly
                    placeholder="No origin selected"
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    This address will be used as the origin for shipping cost calculations.
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h6>Settings Help</h6>
              <ul className="small">
                <li>Store information will be displayed on your website</li>
                <li>Shipping origin is used to calculate shipping costs for customers</li>
                <li>Make sure to set accurate store location for precise shipping calculations</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;