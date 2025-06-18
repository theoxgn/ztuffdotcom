import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const Tutorial = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const response = await axios.get('/api/tutorials');
        setTutorials(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Gagal memuat tutorial. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Tutorial</h2>
      
      {tutorials.length === 0 ? (
        <Alert variant="info">Belum ada tutorial yang tersedia.</Alert>
      ) : (
        <Row>
          {tutorials.map((tutorial) => (
            <Col key={tutorial.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                {tutorial.image && (
                  <Card.Img 
                    variant="top" 
                    src={tutorial.image} 
                    alt={tutorial.title} 
                    style={{ height: '200px', objectFit: 'cover' }} 
                  />
                )}
                <Card.Body>
                  <Card.Title>{tutorial.title}</Card.Title>
                  <Card.Text className="text-muted small">
                    {new Date(tutorial.created_at).toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Card.Text>
                  <Card.Text>
                    {tutorial.description.length > 100 
                      ? `${tutorial.description.substring(0, 100)}...` 
                      : tutorial.description}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <a 
                    href={`/tutorials/${tutorial.id}`} 
                    className="btn btn-outline-primary btn-sm"
                  >
                    Baca Selengkapnya
                  </a>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Tutorial; 