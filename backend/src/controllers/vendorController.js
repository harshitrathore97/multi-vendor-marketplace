const Order = require('../models/Order');
const Product = require('../models/Product');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../constants');
const { emitToUser, sendNotification } = require('../services/socketService');
const { sendSuccess, sendError } = require('../utils/response');

const getVendorOrders = async (req, res, next) => {
  try {
    const vendorId = req.vendor._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { 'items.vendorId': vendorId };
    if (req.query.status) {
      query['items.vendorStatus'] = req.query.status;
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const rawOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map orders to only expose this vendor's items
    const vendorOrders = rawOrders.map((order) => {
      const myItems = order.items.filter(
        (item) => item.vendorId.toString() === vendorId.toString()
      );
      const mySubtotal = myItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        items: myItems,
        vendorSubtotal: mySubtotal,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });

    return sendSuccess(res, {
      orders: vendorOrders,
      page,
      limit,
      totalOrders,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { status: nextStatus, note } = req.body;
    const vendorId = req.vendor._id;

    if (!Object.values(ORDER_STATUS).includes(nextStatus)) {
      return sendError(res, `Invalid order status: ${nextStatus}`, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Identify this vendor's items in the order
    const vendorItems = order.items.filter(
      (item) => item.vendorId.toString() === vendorId.toString()
    );

    if (!vendorItems.length) {
      return sendError(res, 'Forbidden. This order contains no items from your store.', 403);
    }

    // Verify state machine transitions for each vendor item
    for (const item of vendorItems) {
      const allowedNext = ORDER_TRANSITIONS[item.vendorStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        return sendError(
          res,
          `Invalid status transition from "${item.vendorStatus}" to "${nextStatus}". Allowed transitions: ${allowedNext.join(', ') || 'None'}`,
          400
        );
      }
      item.vendorStatus = nextStatus;
    }

    // Determine overall parent order status
    // If all items across all vendors are in the same terminal/advanced status, update overall order
    const allStatuses = order.items.map((i) => i.vendorStatus);
    const allDelivered = allStatuses.every((s) => s === ORDER_STATUS.DELIVERED);
    const allShipped = allStatuses.every((s) => [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED].includes(s));
    const allOutForDelivery = allStatuses.every((s) => [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED].includes(s));

    if (allDelivered) {
      order.orderStatus = ORDER_STATUS.DELIVERED;
    } else if (allOutForDelivery) {
      order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;
    } else if (allShipped) {
      order.orderStatus = ORDER_STATUS.SHIPPED;
    } else {
      order.orderStatus = nextStatus;
    }

    order.statusHistory.push({
      status: order.orderStatus,
      note: note || `Vendor (${req.vendor.businessName}) updated status to ${nextStatus}`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Real-time alerts
    emitToUser(order.customerId, 'order:status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      vendorStatus: nextStatus,
    });

    await sendNotification({
      userId: order.customerId,
      title: `Order Status: ${nextStatus.replace(/_/g, ' ')}`,
      message: `Your items in order #${order.orderNumber} have been marked as ${nextStatus.replace(/_/g, ' ')}.`,
      type: 'ORDER_STATUS',
      link: `/orders/${order._id}`,
    });

    return sendSuccess(res, {
      message: `Order status updated to ${nextStatus}`,
      order,
    });
  } catch (err) {
    next(err);
  }
};

const getVendorAnalytics = async (req, res, next) => {
  try {
    const vendorId = req.vendor._id;
    const { startDate, endDate } = req.query;

    const dateQuery = { 'items.vendorId': vendorId };
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(dateQuery).lean();

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const productSalesMap = {};
    const dailySalesMap = {};

    for (const order of orders) {
      // Exclude cancelled orders from revenue
      if (order.orderStatus === ORDER_STATUS.CANCELLED) continue;

      const dateKey = order.createdAt.toISOString().slice(0, 10);
      dailySalesMap[dateKey] = dailySalesMap[dateKey] || { date: dateKey, revenue: 0, orders: 0 };
      dailySalesMap[dateKey].orders += 1;

      for (const item of order.items) {
        if (item.vendorId.toString() === vendorId.toString()) {
          totalRevenue += item.subtotal;
          totalItemsSold += item.quantity;
          dailySalesMap[dateKey].revenue += item.subtotal;

          const pId = item.productId.toString();
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = {
              productId: pId,
              name: item.productName,
              unitsSold: 0,
              revenue: 0,
            };
          }
          productSalesMap[pId].unitsSold += item.quantity;
          productSalesMap[pId].revenue += item.subtotal;
        }
      }
    }

    const orderCount = orders.filter((o) => o.orderStatus !== ORDER_STATUS.CANCELLED).length;
    const aov = orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const dailySales = Object.values(dailySalesMap).sort((a, b) => a.date.localeCompare(b.date));

    // Active product count
    const totalProducts = await Product.countDocuments({ vendorId, isActive: true });

    return sendSuccess(res, {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orderCount,
      totalItemsSold,
      averageOrderValue: aov,
      totalActiveProducts: totalProducts,
      topSellingProducts,
      dailySales,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVendorOrders,
  updateOrderStatus,
  getVendorAnalytics,
};
