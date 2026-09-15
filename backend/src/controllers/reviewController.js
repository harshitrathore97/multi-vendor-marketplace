const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { ORDER_STATUS } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

const createReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment, orderId } = req.body;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 'Rating must be an integer between 1 and 5.', 400);
    }

    if (!comment || !comment.trim()) {
      return sendError(res, 'Review comment is required.', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Check purchase eligibility
    // Find a DELIVERED order by this customer containing this product
    const query = {
      customerId: req.user._id,
      orderStatus: ORDER_STATUS.DELIVERED,
      'items.productId': productId,
    };
    if (orderId) {
      query._id = orderId;
    }

    const eligibleOrder = await Order.findOne(query);

    if (!eligibleOrder) {
      return sendError(
        res,
        'Only customers who have purchased and received this product (DELIVERED status) can submit a review.',
        403
      );
    }

    // Check for existing review for this specific order item
    const existingReview = await Review.findOne({
      productId,
      customerId: req.user._id,
      orderId: eligibleOrder._id,
    });

    if (existingReview) {
      return sendError(res, 'You have already submitted a review for this purchase.', 409);
    }

    const review = await Review.create({
      productId,
      customerId: req.user._id,
      customerName: req.user.name,
      orderId: eligibleOrder._id,
      rating: ratingNum,
      comment: comment.trim(),
    });

    // Recalculate product rating and numReviews
    const allReviews = await Review.find({ productId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    product.rating = avgRating;
    product.numReviews = allReviews.length;
    await product.save();

    return sendSuccess(res, { review, productRating: avgRating, numReviews: product.numReviews }, 201);
  } catch (err) {
    next(err);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments({ productId });
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccess(res, {
      reviews,
      totalReviews,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProductReviews,
};
