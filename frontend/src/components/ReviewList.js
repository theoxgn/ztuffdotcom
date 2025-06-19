import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Row, Col, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ReviewList = ({ productId, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');

  const fetchReviews = async (page = 1, sort = 'newest') => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${productId}/reviews`, {
        params: {
          page,
          limit: 10,
          sort
        }
      });

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setStatistics(response.data.data.statistics);
        setPagination(response.data.data.pagination);
        
        // Notify parent component about reviews loaded
        if (onReviewsLoaded) {
          onReviewsLoaded(response.data.data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage, sortBy);
  }, [productId, currentPage, sortBy]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const addNewReview = (newReview) => {
    setReviews(prevReviews => [newReview, ...prevReviews]);
    // Refresh statistics
    fetchReviews(1, sortBy);
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <div className="reviews-section">
      {statistics && (
        <div className="mb-4">
          <Row className="align-items-center mb-3">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <h2 className="mb-0">{statistics.averageRating}</h2>
                  <div className="mb-1">
                    {renderStars(Math.round(statistics.averageRating))}
                  </div>
                  <small className="text-muted">
                    {statistics.totalReviews} review{statistics.totalReviews !== 1 ? 's' : ''}
                  </small>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="rating-breakdown">
                {statistics.ratingDistribution.map(({ rating, count }) => (
                  <div key={rating} className="d-flex align-items-center mb-1">
                    <span className="me-2" style={{ minWidth: '20px' }}>{rating}</span>
                    <FontAwesomeIcon icon={faStar} className="text-warning me-2" size="sm" />
                    <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-warning"
                        style={{
                          width: `${statistics.totalReviews > 0 ? (count / statistics.totalReviews) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <small className="text-muted" style={{ minWidth: '30px' }}>({count})</small>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mb-3">
          <Form.Select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{ maxWidth: '200px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </Form.Select>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">No reviews yet for this product.</p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <Card key={review.id} className="mb-3 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px' }}>
                          <FontAwesomeIcon icon={faUser} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-0">{review.user?.name || 'Anonymous'}</h6>
                        <div className="d-flex align-items-center mb-1">
                          {renderStars(review.rating)}
                          <span className="ms-2 fw-bold">{review.rating}/5</span>
                          {review.is_verified && (
                            <Badge bg="success" className="ms-2">Verified Purchase</Badge>
                          )}
                        </div>
                        <small className="text-muted">{formatDate(review.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <div className="review-comment">
                      <p className="mb-0">{review.comment}</p>
                    </div>
                  )}
                  
                  {review.helpful_count > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        {review.helpful_count} people found this helpful
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                  </li>
                  
                  {Array.from({ length: pagination.totalPages }, (_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <Button
                            variant={currentPage === page ? "primary" : "outline-primary"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="mx-1"
                          >
                            {page}
                          </Button>
                        </li>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
                    }
                    return null;
                  })}
                  
                  <li className={`page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;