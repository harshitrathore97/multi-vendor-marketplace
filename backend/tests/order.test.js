const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const { ROLES, VENDOR_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Order Lifecycle, Cancellation & Refund Suite', () => {
  let customerToken, vendorToken, product, vendor, order;

  beforeEach(async () => {
    const customer = await User.create({
      name: 'Order Customer',
      email: 'order_cust@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);

    const vendorUser = await User.create({
      name: 'Order Vendor',
      email: 'order_vendor@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    vendorToken = jwt.sign({ id: vendorUser._id }, process.env.JWT_SECRET);

    vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Lifecycle Goods',
      ownerName: 'Order Vendor',
      email: 'order_vendor@test.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    product = await Product.create({
      vendorId: vendor._id,
      name: 'Desk Lamp',
      description: 'Modern desk lamp',
      price: 40,
      category: 'Home',
      stock: 10,
    });

    order = await Order.create({
      orderNumber: 'ORD-LIFECYCLE-1',
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingAddress: { street: '456 Elm St', city: 'City', state: 'ST', zipCode: '12345', phone: '123' },
      items: [
        {
          productId: product._id,
          productName: product.name,
          vendorId: vendor._id,
          quantity: 2,
          priceAtPurchase: 40,
          subtotal: 80,
          vendorStatus: ORDER_STATUS.PLACED,
        },
      ],
      subtotal: 80,
      totalAmount: 80,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      orderStatus: ORDER_STATUS.PLACED,
    });

    // Create payment record
    await Payment.create({
      orderId: order._id,
      customerId: customer._id,
      paymentMethod: 'CARD',
      amount: 80,
      status: PAYMENT_STATUS.SUCCESS,
      idempotencyKey: 'idem-order-life-1',
      transactionId: 'TXN-INITIAL-1',
    });
  });

  it('should cancel PLACED order, restore inventory, and initiate refund', async () => {
    // Initial product stock is 10
    const initialStock = (await Product.findById(product._id)).stock;
    expect(initialStock).toBe(10);

    const cancelRes = await request(app)
      .patch(`/api/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.order.orderStatus).toBe(ORDER_STATUS.CANCELLED);
    expect(cancelRes.body.data.order.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);

    // Stock should be restored (+2 = 12)
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(12);

    // Payment should be marked REFUNDED with refund details
    const payment = await Payment.findOne({ orderId: order._id });
    expect(payment.status).toBe(PAYMENT_STATUS.REFUNDED);
    expect(payment.refundDetails.refundId).toBeDefined();
  });

  it('should reject cancellation once order has reached SHIPPED or DELIVERED status', async () => {
    order.orderStatus = ORDER_STATUS.SHIPPED;
    order.items[0].vendorStatus = ORDER_STATUS.SHIPPED;
    await order.save();

    const cancelRes = await request(app)
      .patch(`/api/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(cancelRes.statusCode).toBe(400);
    expect(cancelRes.body.message).toMatch(/cannot be cancelled in its current status/i);
  });

  it('should reject invalid status transitions by vendor', async () => {
    // Attempt illegal transition: PLACED directly to DELIVERED without CONFIRMED/PROCESSING/SHIPPED
    const res = await request(app)
      .patch(`/api/vendor/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: ORDER_STATUS.DELIVERED });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid status transition/i);
  });

  it('should allow valid sequential status transitions by vendor', async () => {
    // PLACED -> CONFIRMED
    const res1 = await request(app)
      .patch(`/api/vendor/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: ORDER_STATUS.CONFIRMED });
    expect(res1.statusCode).toBe(200);

    // CONFIRMED -> PROCESSING
    const res2 = await request(app)
      .patch(`/api/vendor/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: ORDER_STATUS.PROCESSING });
    expect(res2.statusCode).toBe(200);

    // PROCESSING -> SHIPPED
    const res3 = await request(app)
      .patch(`/api/vendor/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: ORDER_STATUS.SHIPPED });
    expect(res3.statusCode).toBe(200);
  });
});
