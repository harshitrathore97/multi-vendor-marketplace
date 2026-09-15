const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const inventoryService = require('../services/inventoryService');
const { calculateCartSummary } = require('./cartController');
const { emitToVendor, sendNotification } = require('../services/socketService');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const checkout = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'CARD' } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.phone) {
      return sendError(res, 'Complete shipping address (street, city, zipCode, phone) is required.', 400);
    }

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart || !cart.items.length) {
      return sendError(res, 'Cannot checkout an empty cart.', 400);
    }

    // Step 1: Re-fetch current products and build up-to-date cart summary
    const summary = await calculateCartSummary(cart);

    if (!summary.items.length) {
      return sendError(res, 'No available products in your cart.', 400);
    }

    // Step 2: Check for any out of stock items
    const outOfStockItems = summary.items.filter((item) => item.isOutOfStock);
    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((i) => i.name).join(', ');
      return sendError(
        res,
        `Some items in your cart exceed available stock: ${names}. Please adjust quantities.`,
        400
      );
    }

    // Step 3: Atomic stock reservation
    const reservationItems = summary.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      name: item.name,
    }));

    const stockReservation = await inventoryService.reserveStock(reservationItems);
    if (!stockReservation.success) {
      return sendError(res, stockReservation.error, 409); // 409 Conflict for race condition
    }

    // Step 4: Handle coupon usage count increment if coupon applied
    let couponCode = null;
    let discount = summary.discount;

    if (cart.appliedCoupon) {
      const coupon = await Coupon.findOne({ code: cart.appliedCoupon.toUpperCase() });
      if (coupon && coupon.isValid(summary.subtotal).valid) {
        couponCode = coupon.code;
        coupon.usedCount += 1;
        await coupon.save();
      } else {
        discount = 0; // Coupon became invalid in the interim
      }
    }

    // Step 5: Construct Order Items with snapshots
    const orderItems = [];
    const vendorIdsEncountered = new Set();

    for (const item of summary.items) {
      const product = await Product.findById(item.productId);
      orderItems.push({
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        vendorId: product.vendorId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        subtotal: item.subtotal,
        vendorStatus: ORDER_STATUS.PLACED,
      });
      vendorIdsEncountered.add(product.vendorId.toString());
    }

    // Step 6: Create the Order
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${uuidv4().substring(0, 4).toUpperCase()}`;

    const order = await Order.create({
      orderNumber,
      customerId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      shippingAddress,
      items: orderItems,
      subtotal: summary.subtotal,
      discount,
      couponCode,
      deliveryFee: summary.deliveryFee,
      tax: summary.tax,
      totalAmount: summary.finalAmount,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod,
      orderStatus: ORDER_STATUS.PLACED,
      statusHistory: [
        {
          status: ORDER_STATUS.PLACED,
          note: 'Order successfully placed by customer. Awaiting payment.',
          updatedBy: req.user._id,
        },
      ],
    });

    // Step 7: Clear the Customer's cart
    cart.items = [];
    cart.appliedCoupon = null;
    await cart.save();

    // Step 8: Notify each vendor involved in the order
    for (const vId of vendorIdsEncountered) {
      emitToVendor(vId, 'order:new', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      });
    }

    // Notify customer
    await sendNotification({
      userId: req.user._id,
      title: 'Order Placed Successfully!',
      message: `Your order #${order.orderNumber} for $${order.totalAmount} has been placed.`,
      type: 'ORDER_PLACED',
      link: `/orders/${order._id}`,
    });

    return sendSuccess(res, { order }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout,
};
