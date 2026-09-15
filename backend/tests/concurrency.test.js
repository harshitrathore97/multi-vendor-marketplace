const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const { ROLES, VENDOR_STATUS } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Critical Concurrency & Inventory Oversell Suite', () => {
  let customer1Token, customer2Token, limitedProduct;

  beforeEach(async () => {
    // 1. Customer 1
    const cust1 = await User.create({
      name: 'Customer One',
      email: 'race1@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customer1Token = jwt.sign({ id: cust1._id }, process.env.JWT_SECRET);

    // 2. Customer 2
    const cust2 = await User.create({
      name: 'Customer Two',
      email: 'race2@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customer2Token = jwt.sign({ id: cust2._id }, process.env.JWT_SECRET);

    // 3. Vendor
    const vendorUser = await User.create({
      name: 'Vendor Race',
      email: 'vendor_race@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    const vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Flash Sale Store',
      ownerName: 'Vendor Race',
      email: 'vendor_race@test.com',
      phone: '1234567890',
      status: VENDOR_STATUS.APPROVED,
    });

    // 4. Product with strictly stock = 1 !
    limitedProduct = await Product.create({
      vendorId: vendor._id,
      name: 'Rare Collector Watch',
      description: 'Only 1 unit in existence',
      price: 999,
      category: 'Luxury',
      stock: 1, // CRITICAL: STOCK = 1
      isActive: true,
    });

    // Both customers add this 1 item to their cart
    await Cart.create({
      customerId: cust1._id,
      items: [{ productId: limitedProduct._id, quantity: 1, priceSnapshot: 999 }],
    });

    await Cart.create({
      customerId: cust2._id,
      items: [{ productId: limitedProduct._id, quantity: 1, priceSnapshot: 999 }],
    });
  });

  it('should allow only ONE customer to checkout when stock=1 under concurrent attempts', async () => {
    const address = {
      street: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '10001',
      phone: '555-0100',
    };

    // Fire both checkout requests concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ shippingAddress: address }),
      request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ shippingAddress: address }),
    ]);

    const statuses = [res1.statusCode, res2.statusCode];
    const successes = statuses.filter((s) => s === 201);
    const failures = statuses.filter((s) => s === 409 || s === 400);

    // Exactly 1 request MUST succeed (201) and exactly 1 MUST fail (409 Conflict / 400)
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Final product stock MUST be exactly 0 (Never negative!)
    const productAfterRace = await Product.findById(limitedProduct._id);
    expect(productAfterRace.stock).toBe(0);
  });
});
