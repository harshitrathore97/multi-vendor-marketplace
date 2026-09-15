const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const { ROLES, VENDOR_STATUS } = require('../src/constants');
const jwt = require('jsonwebtoken');

describe('Role-Based Access Control (RBAC) Suite', () => {
  let customerToken, vendorToken1, vendorToken2, pendingVendorToken, adminToken;
  let vendor1, vendor2;
  let product1;

  beforeEach(async () => {
    // 1. Customer
    const customer = await User.create({
      name: 'Customer',
      email: 'cust@test.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });
    customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);

    // 2. Approved Vendor 1
    const vendorUser1 = await User.create({
      name: 'Vendor One',
      email: 'vendor1@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    vendorToken1 = jwt.sign({ id: vendorUser1._id }, process.env.JWT_SECRET);
    vendor1 = await Vendor.create({
      userId: vendorUser1._id,
      businessName: 'Vendor Store 1',
      ownerName: 'Vendor One',
      email: 'vendor1@test.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    // 3. Approved Vendor 2
    const vendorUser2 = await User.create({
      name: 'Vendor Two',
      email: 'vendor2@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    vendorToken2 = jwt.sign({ id: vendorUser2._id }, process.env.JWT_SECRET);
    vendor2 = await Vendor.create({
      userId: vendorUser2._id,
      businessName: 'Vendor Store 2',
      ownerName: 'Vendor Two',
      email: 'vendor2@test.com',
      phone: '456',
      status: VENDOR_STATUS.APPROVED,
    });

    // 4. Pending Vendor
    const pendingVendorUser = await User.create({
      name: 'Pending Vendor',
      email: 'pending@test.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    pendingVendorToken = jwt.sign({ id: pendingVendorUser._id }, process.env.JWT_SECRET);
    await Vendor.create({
      userId: pendingVendorUser._id,
      businessName: 'Pending Store',
      ownerName: 'Pending Vendor',
      email: 'pending@test.com',
      phone: '789',
      status: VENDOR_STATUS.PENDING,
    });

    // 5. Admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
    });
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    // Create a product owned by Vendor 1
    product1 = await Product.create({
      vendorId: vendor1._id,
      name: 'Product by Vendor 1',
      description: 'Test description',
      price: 100,
      category: 'Electronics',
      stock: 10,
    });
  });

  it('should prevent customers from accessing vendor management APIs', async () => {
    const res = await request(app)
      .get('/api/vendor/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('should prevent customers and vendors from accessing admin APIs', async () => {
    const resCustomer = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(resCustomer.statusCode).toBe(403);

    const resVendor = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${vendorToken1}`);
    expect(resVendor.statusCode).toBe(403);
  });

  it('should allow admin to access admin statistics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeDefined();
  });

  it('should prevent pending/unapproved vendors from creating products', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${pendingVendorToken}`)
      .send({
        name: 'Forbidden Product',
        description: 'Should fail',
        price: 50,
        category: 'Electronics',
        stock: 5,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not approved/i);
  });

  it('should prevent a vendor from updating or deleting another vendor product', async () => {
    // Vendor 2 attempts to update Vendor 1's product
    const updateRes = await request(app)
      .put(`/api/products/${product1._id}`)
      .set('Authorization', `Bearer ${vendorToken2}`)
      .send({ name: 'Hacked Title' });

    expect(updateRes.statusCode).toBe(403);
    expect(updateRes.body.message).toMatch(/do not own/i);

    // Vendor 2 attempts to delete Vendor 1's product
    const deleteRes = await request(app)
      .delete(`/api/products/${product1._id}`)
      .set('Authorization', `Bearer ${vendorToken2}`);

    expect(deleteRes.statusCode).toBe(403);

    // Verify product still intact
    const unchanged = await Product.findById(product1._id);
    expect(unchanged.name).toBe('Product by Vendor 1');
  });
});
