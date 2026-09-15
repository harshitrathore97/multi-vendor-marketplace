const Payment = require('../models/Payment');
const Order = require('../models/Order');
const inventoryService = require('./inventoryService');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../constants');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  /**
   * Process a simulated payment with idempotency guarantee.
   *
   * @param {Object} params
   * @param {string} params.orderId
   * @param {string} params.customerId
   * @param {string} params.paymentMethod - CARD, UPI, COD
   * @param {number} params.amount
   * @param {string} params.idempotencyKey
   * @param {Object} params.paymentDetails
   * @returns {Promise<{ success: boolean, payment: Object, isIdempotentReplay?: boolean, error?: string }>}
   */
  async processPayment({ orderId, customerId, paymentMethod, amount, idempotencyKey, paymentDetails = {} }) {
    if (!idempotencyKey) {
      throw new Error('Idempotency key is required for payment processing');
    }

    // Check for existing payment with this idempotency key
    let existingPayment = await Payment.findOne({ idempotencyKey });

    if (existingPayment) {
      // If already SUCCESS or REFUNDED, return safely (Idempotency guarantee)
      if (existingPayment.status === PAYMENT_STATUS.SUCCESS || existingPayment.status === PAYMENT_STATUS.REFUNDED) {
        return {
          success: true,
          payment: existingPayment,
          isIdempotentReplay: true,
        };
      }

      if (existingPayment.status === PAYMENT_STATUS.PROCESSING) {
        return {
          success: false,
          error: 'A payment with this idempotency key is already being processed.',
          statusCode: 409,
        };
      }
    }

    // Verify order exists and matches customer
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) {
      return {
        success: false,
        error: 'Order not found or does not belong to customer.',
        statusCode: 404,
      };
    }

    if (order.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      return {
        success: true,
        payment: await Payment.findOne({ orderId, status: PAYMENT_STATUS.SUCCESS }),
        isIdempotentReplay: true,
      };
    }

    // Create or update initial payment entry with PROCESSING state
    let payment = existingPayment;
    if (!payment) {
      payment = new Payment({
        orderId,
        customerId,
        paymentMethod,
        amount,
        idempotencyKey,
        status: PAYMENT_STATUS.PROCESSING,
        metadata: {
          cardLast4: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : undefined,
          upiId: paymentDetails.upiId || undefined,
        },
      });
      await payment.save();
    } else {
      payment.status = PAYMENT_STATUS.PROCESSING;
      await payment.save();
    }

    // Simulated Gateway Execution
    const isSimulatedFailure =
      paymentDetails.cardNumber && paymentDetails.cardNumber.endsWith('0000');

    if (isSimulatedFailure) {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();

      order.paymentStatus = PAYMENT_STATUS.FAILED;
      order.statusHistory.push({
        status: order.orderStatus,
        note: 'Payment attempt failed via simulated card test failure.',
      });
      await order.save();

      return {
        success: false,
        payment,
        error: 'Payment failed at issuing bank. (Simulated test failure)',
        statusCode: 400,
      };
    }

    // Payment Succeeded
    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    await payment.save();

    order.paymentStatus = PAYMENT_STATUS.SUCCESS;
    if (order.orderStatus === ORDER_STATUS.PLACED) {
      order.orderStatus = ORDER_STATUS.CONFIRMED;
    }
    order.statusHistory.push({
      status: order.orderStatus,
      note: `Payment of $${amount} confirmed via ${paymentMethod}. Transaction: ${payment.transactionId}`,
    });
    await order.save();

    return {
      success: true,
      payment,
      order,
    };
  }

  /**
   * Process refund for a cancelled eligible order.
   *
   * @param {string} orderId
   * @param {string} reason
   */
  async processRefund(orderId, reason = 'Order cancellation') {
    const payment = await Payment.findOne({ orderId, status: PAYMENT_STATUS.SUCCESS });
    if (!payment) {
      return { success: false, message: 'No successful payment found to refund.' };
    }

    if (payment.status === PAYMENT_STATUS.REFUNDED) {
      return { success: true, payment, alreadyRefunded: true };
    }

    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundDetails = {
      refundId: `REF-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`,
      amount: payment.amount,
      refundedAt: new Date(),
      reason,
    };
    await payment.save();

    return { success: true, payment };
  }
}

module.exports = new PaymentService();
