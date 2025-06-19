import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Row, Col, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faCheck, 
  faTimes, 
  faStar, 
  faFilter,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReviews = async (page = 1, status = 'all', search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = {
        page,
        limit: 20,
        status
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axios.get('/api/admin/reviews', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews(1, statusFilter, searchTerm);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (reviewId, isApproved) => {
    try {
      setActionLoading(reviewId);
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/admin/reviews/${reviewId}/status`, {
        is_approved: isApproved
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh reviews
      fetchReviews(currentPage, statusFilter, searchTerm);
      
      // Close modal if open
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      setError('Failed to update review status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? 'text-warning' : 'text-muted'}
        size="sm"
      />
    ));
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

  if (loading && reviews.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading reviews...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Review Management</h4>
          </div>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Filters and Search */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="d-flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleStatusFilter('all')}
                >
                  <FontAwesomeIcon icon={faFilter} className="me-1" />
                  All Reviews
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'success' : 'outline-success'}
                  size="sm"
                  onClick={() => handleStatusFilter('approved')}
                >
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'warning' : 'outline-warning'}
                  size="sm"
                  onClick={() => handleStatusFilter('pending')}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Pending
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <Form onSubmit={handleSearch}>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Search by user name, product name, or comment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                  />
                  <Button type="submit" variant="outline-primary" size="sm" className="ms-2">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>

          {/* Reviews Table */}
          <div className="table-responsive">
            <Table hover>
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="text-muted">
                        {loading ? 'Loading...' : 'No reviews found'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{review.user?.name}</div>
                          <small className="text-muted">{review.user?.email}</small>
                          {review.is_verified && (
                            <Badge bg="info" className="ms-1">Verified</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={review.product?.image || '/default.webp'}
                            alt={review.product?.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            className="rounded me-2"
                            onError={(e) => { e.target.src = '/default.webp'; }}
                          />
                          <div>
                            <div className="fw-semibold" style={{ maxWidth: '200px' }}>
                              {review.product?.name?.length > 30 
                                ? `${review.product.name.substring(0, 30)}...` 
                                : review.product?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {renderStars(review.rating)}
                          <span className="ms-2 fw-bold">{review.rating}/5</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {review.comment ? (
                            review.comment.length > 100 
                              ? `${review.comment.substring(0, 100)}...`
                              : review.comment
                          ) : (
                            <span className="text-muted">No comment</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <small>{formatDate(review.createdAt)}</small>
                      </td>
                      <td>
                        <Badge bg={review.is_approved ? 'success' : 'warning'}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewDetail(review)}
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          {!review.is_approved && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleUpdateStatus(review.id, true)}
                              disabled={actionLoading === review.id}
                              title="Approve"
                            >
                              {actionLoading === review.id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FontAwesomeIcon icon={faCheck} />
                              )}
                            </Button>
                          )}
                          {review.is_approved && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleUpdateStatus(review.id, false)}
                              disabled={actionLoading === review.id}
                              title="Reject"
                            >
                              {actionLoading === review.id ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FontAwesomeIcon icon={faTimes} />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = index + 1;
                    } else if (currentPage <= 3) {
                      page = index + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + index;
                    } else {
                      page = currentPage - 2 + index;
                    }

                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <Button
                          variant={currentPage === page ? "primary" : "outline-primary"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="mx-1"
                        >
                          {page}
                        </Button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Review Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Review Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p className="mb-1"><strong>Name:</strong> {selectedReview.user?.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedReview.user?.email}</p>
                  <p className="mb-1">
                    <strong>Status:</strong>{' '}
                    {selectedReview.is_verified && <Badge bg="info" className="me-1">Verified Purchase</Badge>}
                    <Badge bg={selectedReview.is_approved ? 'success' : 'warning'}>
                      {selectedReview.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Product Information</h6>
                  <div className="d-flex align-items-center mb-2">
                    <img
                      src={selectedReview.product?.image || '/default.webp'}
                      alt={selectedReview.product?.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      className="rounded me-3"
                      onError={(e) => { e.target.src = '/default.webp'; }}
                    />
                    <div>
                      <p className="mb-0 fw-semibold">{selectedReview.product?.name}</p>
                    </div>
                  </div>
                </Col>
              </Row>

              <hr />

              <div className="mb-3">
                <h6>Rating</h6>
                <div className="d-flex align-items-center">
                  {renderStars(selectedReview.rating)}
                  <span className="ms-2 fw-bold">{selectedReview.rating}/5</span>
                </div>
              </div>

              {selectedReview.comment && (
                <div className="mb-3">
                  <h6>Comment</h6>
                  <p className="bg-light p-3 rounded">{selectedReview.comment}</p>
                </div>
              )}

              <div className="mb-3">
                <h6>Review Date</h6>
                <p>{formatDate(selectedReview.createdAt)}</p>
              </div>

              {selectedReview.helpful_count > 0 && (
                <div className="mb-3">
                  <h6>Helpful Votes</h6>
                  <p>{selectedReview.helpful_count} people found this review helpful</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          {selectedReview && (
            <div className="d-flex gap-2">
              {!selectedReview.is_approved ? (
                <Button
                  variant="success"
                  onClick={() => handleUpdateStatus(selectedReview.id, true)}
                  disabled={actionLoading === selectedReview.id}
                >
                  {actionLoading === selectedReview.id ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} className="me-1" />
                  )}
                  Approve Review
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => handleUpdateStatus(selectedReview.id, false)}
                  disabled={actionLoading === selectedReview.id}
                >
                  {actionLoading === selectedReview.id ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : (
                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                  )}
                  Reject Review
                </Button>
              )}
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminReviews;