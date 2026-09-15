const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const { ROLES, VENDOR_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Payment Processing & Idempotency Suite', () => {
  let customerToken, order, customer;

  beforeEach(async () => {
    customer = await User.create({
      name: 'Payer Customer',
      email: 'payer@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);

    const vendorUser = await User.create({
      name: 'Vendor Pay',
      email: 'vpay@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    const vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Vendor Pay Store',
      ownerName: 'Vendor Pay',
      email: 'vpay@test.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    const product = await Product.create({
      vendorId: vendor._id,
      name: 'Wireless Mouse',
      description: 'Test mouse description',
      price: 50,
      category: 'Electronics',
      stock: 10,
    });

    order = await Order.create({
      orderNumber: 'ORD-PAY-TEST',
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingAddress: { street: '123 Test', city: 'City', state: 'ST', zipCode: '12345', phone: '123' },
      items: [
        {
          productId: product._id,
          productName: product.name,
          vendorId: vendor._id,
          quantity: 1,
          priceAtPurchase: 50,
          subtotal: 50,
        },
      ],
      subtotal: 50,
      totalAmount: 50,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PLACED,
    });
  });

  it('should process simulated payment successfully', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id,
        paymentMethod: 'CARD',
        idempotencyKey: 'idem-key-unique-12345',
        paymentDetails: { cardNumber: '4111111111111111', expiry: '12/28', cvv: '123' },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe(PAYMENT_STATUS.SUCCESS);
    expect(res.body.data.payment.transactionId).toBeDefined();

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe(PAYMENT_STATUS.SUCCESS);
    expect(updatedOrder.orderStatus).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should return identical transaction without duplicate billing on idempotent replay', async () => {
    const payload = {
      orderId: order._id,
      paymentMethod: 'CARD',
      idempotencyKey: 'idem-key-replay-abc',
      paymentDetails: { cardNumber: '4111111111111111' },
    };

    // First request
    const firstRes = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(payload);

    expect(firstRes.statusCode).toBe(200);
    const originalTransactionId = firstRes.body.data.payment.transactionId;

    // Second request with exact same idempotency key (simulating fast double click)
    const secondRes = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(payload);

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.data.isIdempotentReplay).toBe(true);
    expect(secondRes.body.data.payment.transactionId).toBe(originalTransactionId);

    // Verify exactly ONE payment document exists in the database
    const paymentCount = await Payment.countDocuments({ orderId: order._id });
    expect(paymentCount).toBe(1);
  });

  it('should handle simulated payment failure when card ends with 0000', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id,
        paymentMethod: 'CARD',
        idempotencyKey: 'idem-key-failure-test',
        paymentDetails: { cardNumber: '4111111111110000' }, // Ends with 0000
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe(PAYMENT_STATUS.FAILED);
  });
});
