import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="bg-light min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <div className="text-center mb-4">
              <Link to="/">
                <img 
                  src="/logo.png" 
                  alt="Dropshipedia" 
                  height="42" 
                  className="mb-3"
                />
              </Link>
              <h4 className="text-dark-50">Selamat Datang di Dropshipedia</h4>
              <p className="text-muted">Platform dropship terbaik untuk memulai bisnis online Anda.</p>
            </div>
            
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                {children}
              </Card.Body>
            </Card>
            
            <div className="text-center mt-4">
              <p className="text-muted">
                &copy; {new Date().getFullYear()} Dropshipedia. All rights reserved.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuthLayout; 