import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../../contexts/AuthContext';

const PointHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPointHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user/points/history');
        setPoints(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Gagal memuat riwayat poin. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchPointHistory();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get point type badge
  const getPointBadge = (type) => {
    switch (type) {
      case 'earned':
        return <Badge bg="success">Diperoleh</Badge>;
      case 'redeemed':
        return <Badge bg="warning">Ditukarkan</Badge>;
      case 'expired':
        return <Badge bg="danger">Kadaluarsa</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Riwayat Poin</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Total Poin Saat Ini</Card.Title>
          <h3>{currentUser?.points || 0} Poin</h3>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {points.length === 0 ? (
        <Alert variant="info">Anda belum memiliki riwayat poin.</Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Tipe</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.id}>
                    <td>{formatDate(point.created_at)}</td>
                    <td>{point.description}</td>
                    <td>{getPointBadge(point.type)}</td>
                    <td className={point.type === 'earned' ? 'text-success' : 'text-danger'}>
                      {point.type === 'earned' ? '+' : '-'}{point.amount} Poin
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PointHistory; 