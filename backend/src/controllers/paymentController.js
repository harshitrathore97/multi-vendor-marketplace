const Payment = require('../models/Payment');
const Order = require('../models/Order');
const paymentService = require('../services/paymentService');
const { sendNotification, emitToUser } = require('../services/socketService');
const { sendSuccess, sendError } = require('../utils/response');

const createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'CARD', idempotencyKey, paymentDetails } = req.body;

    if (!orderId) {
      return sendError(res, 'Order ID is required', 400);
    }

    const key = idempotencyKey || req.headers['idempotency-key'];
    if (!key) {
      return sendError(res, 'Idempotency key is required to prevent duplicate transactions.', 400);
    }

    const order = await Order.findOne({ _id: orderId, customerId: req.user._id });
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const result = await paymentService.processPayment({
      orderId,
      customerId: req.user._id,
      paymentMethod,
      amount: order.totalAmount,
      idempotencyKey: key,
      paymentDetails,
    });

    if (!result.success) {
      return sendError(res, result.error, result.statusCode || 400);
    }

    // Real-time notifications
    emitToUser(req.user._id, 'payment:success', {
      orderId: order._id,
      transactionId: result.payment.transactionId,
      amount: result.payment.amount,
    });

    await sendNotification({
      userId: req.user._id,
      title: 'Payment Successful',
      message: `Your payment of $${result.payment.amount} for Order #${order.orderNumber} was successful.`,
      type: 'PAYMENT_SUCCESS',
      link: `/orders/${order._id}`,
    });

    return sendSuccess(res, {
      payment: result.payment,
      order: result.order,
      isIdempotentReplay: result.isIdempotentReplay || false,
    }, 200);
  } catch (err) {
    next(err);
  }
};

const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ orderId: id });
    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }
    return sendSuccess(res, { payment });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment,
  getPaymentByOrderId,
};
