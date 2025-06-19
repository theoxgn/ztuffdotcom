const { Review, User, Product, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

const reviewController = {
  // Get all reviews for a product
  getProductReviews: async (req, res) => {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;
      
      const offset = (page - 1) * limit;
      
      let orderClause = [['createdAt', 'DESC']];
      switch (sort) {
        case 'oldest':
          orderClause = [['createdAt', 'ASC']];
          break;
        case 'highest':
          orderClause = [['rating', 'DESC']];
          break;
        case 'lowest':
          orderClause = [['rating', 'ASC']];
          break;
        case 'helpful':
          orderClause = [['helpful_count', 'DESC']];
          break;
        default:
          orderClause = [['createdAt', 'DESC']];
      }

      const reviews = await Review.findAndCountAll({
        where: {
          product_id: productId,
          is_approved: true
        },
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
            as: 'user'
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate average rating
      const avgRating = await Review.findOne({
        where: {
          product_id: productId,
          is_approved: true
        },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'average']
        ]
      });

      // Get rating distribution
      const ratingDistribution = await Review.findAll({
        where: {
          product_id: productId,
          is_approved: true
        },
        attributes: [
          'rating',
          [require('sequelize').fn('COUNT', require('sequelize').col('rating')), 'count']
        ],
        group: ['rating'],
        order: [['rating', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            total: reviews.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(reviews.count / limit)
          },
          statistics: {
            averageRating: parseFloat(avgRating?.dataValues?.average || 0).toFixed(1),
            totalReviews: reviews.count,
            ratingDistribution: ratingDistribution.map(item => ({
              rating: item.rating,
              count: parseInt(item.dataValues.count)
            }))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product reviews'
      });
    }
  },

  // Create a new review
  createReview: async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, comment, orderId } = req.body;
      const userId = req.user.id;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        where: {
          user_id: userId,
          product_id: productId
        }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // If orderId is provided, verify user has purchased this product
      let isVerified = false;
      if (orderId) {
        const orderItem = await OrderItem.findOne({
          include: [
            {
              model: Order,
              where: {
                id: orderId,
                user_id: userId,
                status: 'delivered'
              }
            }
          ],
          where: {
            product_id: productId
          }
        });

        if (orderItem) {
          isVerified = true;
        }
      }

      // Create review
      const review = await Review.create({
        user_id: userId,
        product_id: productId,
        order_id: orderId || null,
        rating: parseInt(rating),
        comment: comment || null,
        is_verified: isVerified
      });

      // Fetch created review with user data
      const createdReview = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
            as: 'user'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: {
          review: createdReview
        }
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review'
      });
    }
  },

  // Update user's review
  updateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      // Validate rating
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Find review
      const review = await Review.findOne({
        where: {
          id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you do not have permission to edit this review'
        });
      }

      // Update review
      await review.update({
        rating: rating !== undefined ? parseInt(rating) : review.rating,
        comment: comment !== undefined ? comment : review.comment
      });

      // Fetch updated review with user data
      const updatedReview = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
            as: 'user'
          }
        ]
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: {
          review: updatedReview
        }
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review'
      });
    }
  },

  // Delete user's review
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      // Find review
      const review = await Review.findOne({
        where: {
          id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you do not have permission to delete this review'
        });
      }

      // Delete review
      await review.destroy();

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review'
      });
    }
  },

  // Get user's reviews
  getUserReviews: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;

      const reviews = await Review.findAndCountAll({
        where: {
          user_id: userId
        },
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'image'],
            as: 'product'
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            total: reviews.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(reviews.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user reviews'
      });
    }
  },

  // Admin: Get all reviews
  getAllReviews: async (req, res) => {
    try {
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      if (status === 'approved') {
        whereClause.is_approved = true;
      } else if (status === 'pending') {
        whereClause.is_approved = false;
      }

      const reviews = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
            as: 'user'
          },
          {
            model: Product,
            attributes: ['id', 'name', 'image'],
            as: 'product'
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            total: reviews.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(reviews.count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }
  },

  // Admin: Update review status
  updateReviewStatus: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { is_approved } = req.body;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.update({
        is_approved: is_approved
      });

      res.json({
        success: true,
        message: 'Review status updated successfully'
      });
    } catch (error) {
      console.error('Error updating review status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review status'
      });
    }
  }
};

module.exports = reviewController;