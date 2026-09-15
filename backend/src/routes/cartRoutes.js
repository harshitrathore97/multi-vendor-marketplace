const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItemToCart);
router.patch('/items/:productId', cartController.updateCartItemQuantity);
router.delete('/items/:productId', cartController.removeCartItem);
router.post('/coupon', cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
