const Order = require('../models/Order');
const inventoryService = require('../services/inventoryService');
const paymentService = require('../services/paymentService');
const { sendNotification, emitToUser, emitToVendor } = require('../services/socketService');
const { ORDER_STATUS, PAYMENT_STATUS, CANCELLABLE_STATUSES, ROLES } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ customerId: req.user._id });
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const orders = await Order.find({ customerId: req.user._id })
      .populate('items.vendorId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccess(res, {
      orders,
      page,
      limit,
      totalOrders,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('items.productId', 'name images')
      .populate('items.vendorId', 'businessName ownerName phone email')
      .lean();

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Customer can only view their own order; Admin can view any order
    if (order.customerId.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 'Forbidden. You cannot access this order.', 403);
    }

    return sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).select('orderNumber orderStatus statusHistory createdAt updatedAt customerId');

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.customerId.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 'Forbidden. You cannot track this order.', 403);
    }

    const lifecycleSteps = [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ];

    const isCancelled = order.orderStatus === ORDER_STATUS.CANCELLED;
    const currentStepIndex = isCancelled ? -1 : lifecycleSteps.indexOf(order.orderStatus);

    return sendSuccess(res, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      currentStatus: order.orderStatus,
      isCancelled,
      currentStepIndex,
      lifecycleSteps,
      statusHistory: order.statusHistory,
      lastUpdated: order.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const isCustomerOwner = order.customerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isCustomerOwner && !isAdmin) {
      return sendError(res, 'Forbidden. You do not have permission to cancel this order.', 403);
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      return sendError(res, 'Order has already been cancelled.', 400);
    }

    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      return sendError(
        res,
        `Order cannot be cancelled in its current status: "${order.orderStatus}". Orders can only be cancelled while PLACED or CONFIRMED.`,
        400
      );
    }

    // Restore stock atomically
    await inventoryService.releaseStock(order.items);

    // If order was paid, trigger automated refund
    let refundResult = null;
    if (order.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      refundResult = await paymentService.processRefund(order._id, 'Customer cancellation');
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.items.forEach((item) => {
      item.vendorStatus = ORDER_STATUS.CANCELLED;
    });

    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: `Order cancelled by ${isAdmin ? 'admin' : 'customer'}. Stock restored.${refundResult?.success ? ' Payment refunded.' : ''}`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Emit live events
    emitToUser(order.customerId, 'order:status_updated', {
      orderId: order._id,
      orderStatus: ORDER_STATUS.CANCELLED,
      paymentStatus: order.paymentStatus,
    });

    for (const item of order.items) {
      emitToVendor(item.vendorId, 'order:cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    await sendNotification({
      userId: order.customerId,
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.${refundResult?.success ? ' A full refund has been initiated.' : ''}`,
      type: 'REFUND',
      link: `/orders/${order._id}`,
    });

    return sendSuccess(res, {
      message: 'Order cancelled successfully. Inventory restored.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
};
