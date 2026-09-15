const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/track', orderController.trackOrder);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
