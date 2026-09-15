const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const { ROLES, VENDOR_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Reviews & Ratings Verification Suite', () => {
  let customerToken, otherCustomerToken, product, vendor, deliveredOrder;

  beforeEach(async () => {
    const customer = await User.create({
      name: 'Verified Buyer',
      email: 'buyer@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);

    const otherCustomer = await User.create({
      name: 'Non Buyer',
      email: 'nonbuyer@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    otherCustomerToken = jwt.sign({ id: otherCustomer._id }, process.env.JWT_SECRET);

    const vendorUser = await User.create({
      name: 'Vendor Review',
      email: 'v_rev@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Review Tech',
      ownerName: 'Vendor Review',
      email: 'v_rev@test.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    product = await Product.create({
      vendorId: vendor._id,
      name: 'High-End Headphones',
      description: 'Studio quality headphones',
      price: 250,
      category: 'Audio',
      stock: 10,
      rating: 0,
      numReviews: 0,
    });

    // Delivered order for verified buyer
    deliveredOrder = await Order.create({
      orderNumber: 'ORD-DELIVERED-REV',
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      shippingAddress: { street: '789 Pine Rd', city: 'City', state: 'ST', zipCode: '12345', phone: '123' },
      items: [
        {
          productId: product._id,
          productName: product.name,
          vendorId: vendor._id,
          quantity: 1,
          priceAtPurchase: 250,
          subtotal: 250,
          vendorStatus: ORDER_STATUS.DELIVERED,
        },
      ],
      subtotal: 250,
      totalAmount: 250,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      orderStatus: ORDER_STATUS.DELIVERED, // DELIVERED !
    });
  });

  it('should prevent non-buyers from submitting reviews', async () => {
    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${otherCustomerToken}`)
      .send({
        rating: 5,
        comment: 'Great product even though I never bought it!',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/only customers who have purchased and received/i);
  });

  it('should allow verified purchasers of DELIVERED products to submit reviews and recalculate average', async () => {
    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Exceptional sound clarity and rich bass! Highly recommended.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.productRating).toBe(5);
    expect(res.body.data.numReviews).toBe(1);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.rating).toBe(5);
    expect(updatedProduct.numReviews).toBe(1);
  });

  it('should prevent duplicate reviews for the same order purchase', async () => {
    // First review
    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comment: 'First review!' });

    // Second review
    const duplicateRes = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 4, comment: 'Trying to review again!' });

    expect(duplicateRes.statusCode).toBe(409);
    expect(duplicateRes.body.message).toMatch(/already submitted a review/i);
  });
});
