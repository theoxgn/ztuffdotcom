import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ReviewForm = ({ show, onHide, productId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/products/${productId}/reviews`, {
        rating,
        comment: comment.trim() || null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Reset form
        setRating(0);
        setComment('');
        setError(null);
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.data.review);
        }
        
        // Close modal
        onHide();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Write a Review</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Rating *</Form.Label>
            <div className="d-flex align-items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                  key={star}
                  icon={faStar}
                  size="lg"
                  className={`me-1 cursor-pointer ${
                    star <= (hoverRating || rating) ? 'text-warning' : 'text-muted'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
              <span className="ms-2 text-muted">
                {rating > 0 && (
                  <>
                    {rating} star{rating > 1 ? 's' : ''}
                    {rating === 1 && ' - Poor'}
                    {rating === 2 && ' - Fair'}
                    {rating === 3 && ' - Good'}
                    {rating === 4 && ' - Very Good'}
                    {rating === 5 && ' - Excellent'}
                  </>
                )}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Review (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product..."
              maxLength={1000}
            />
            <Form.Text className="text-muted">
              {comment.length}/1000 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || rating === 0}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReviewForm;