const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/create', paymentLimiter, paymentController.createPayment);
router.get('/:id', paymentController.getPaymentByOrderId);

module.exports = router;
