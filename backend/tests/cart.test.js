const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const Coupon = require('../src/models/Coupon');
const { ROLES, VENDOR_STATUS, DISCOUNT_TYPE } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Shopping Cart & Coupon Suite', () => {
  let customerToken, product, coupon;

  beforeEach(async () => {
    const customer = await User.create({
      name: 'Cart Customer',
      email: 'cart@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);

    const vendorUser = await User.create({
      name: 'Vendor',
      email: 'v@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    const vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Gadget Store',
      ownerName: 'Vendor',
      email: 'v@test.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    product = await Product.create({
      vendorId: vendor._id,
      name: 'Smart Watch',
      description: 'Fitness tracker',
      price: 150,
      category: 'Electronics',
      stock: 5,
      isActive: true,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    coupon = await Coupon.create({
      code: 'SAVE20',
      discountType: DISCOUNT_TYPE.PERCENTAGE,
      discountValue: 20,
      minOrderValue: 50,
      maxDiscount: 40,
      expiryDate: tomorrow,
      usageLimit: 10,
    });
  });

  it('should add item to cart and calculate accurate subtotals', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product._id, quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.itemCount).toBe(2);
    expect(res.body.data.subtotal).toBe(300); // 150 * 2
  });

  it('should reject adding more quantity than available stock', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product._id, quantity: 10 }); // Only 5 in stock

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/exceed/i);
  });

  it('should apply valid coupon and deduct discount accurately', async () => {
    // Add item first (subtotal = 150)
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product._id, quantity: 1 });

    // Apply SAVE20 (20% of 150 = 30)
    const couponRes = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'SAVE20' });

    expect(couponRes.statusCode).toBe(200);
    expect(couponRes.body.data.discount).toBe(30);
    // Subtotal 150 - 30 discount = 120 taxable.
    // 5% tax = 6. Delivery = 0 (subtotal >= 100). Final amount = 126.
    expect(couponRes.body.data.finalAmount).toBe(126);
  });
});
