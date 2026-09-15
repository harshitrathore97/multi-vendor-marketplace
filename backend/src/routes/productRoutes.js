const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize, requireVendorApproved } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ROLES } = require('../constants');

// Public endpoints
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Review endpoints (PRD Requirement 27: /api/products/:id/reviews)
router.get('/:id/reviews', reviewController.getProductReviews);
router.post('/:id/reviews', authenticate, authorize(ROLES.CUSTOMER, ROLES.ADMIN), reviewController.createReview);

// Vendor product operations
router.post(
  '/',
  authenticate,
  authorize(ROLES.VENDOR, ROLES.ADMIN),
  requireVendorApproved,
  upload.array('images', 5),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.VENDOR, ROLES.ADMIN),
  requireVendorApproved,
  upload.array('images', 5),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.VENDOR, ROLES.ADMIN),
  requireVendorApproved,
  productController.deleteProduct
);

module.exports = router;
