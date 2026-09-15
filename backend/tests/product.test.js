const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Product = require('../src/models/Product');
const { ROLES, VENDOR_STATUS } = require('../src/constants');

describe('Product Discovery, Filtering, Sorting & Pagination Suite', () => {
  let vendor;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Vendor',
      email: 'vendor@catalog.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
    });
    vendor = await Vendor.create({
      userId: user._id,
      businessName: 'Global Tech Store',
      ownerName: 'Vendor',
      email: 'vendor@catalog.com',
      phone: '123',
      status: VENDOR_STATUS.APPROVED,
    });

    await Product.create([
      { vendorId: vendor._id, name: 'Noise Cancelling Headphones', description: 'Over-ear headphones', category: 'Audio', price: 200, rating: 4.8, stock: 10, isActive: true },
      { vendorId: vendor._id, name: 'Bluetooth Earbuds', description: 'Wireless earbuds', category: 'Audio', price: 50, rating: 4.2, stock: 15, isActive: true },
      { vendorId: vendor._id, name: 'Mechanical Keyboard', description: 'Gaming keyboard', category: 'Accessories', price: 120, rating: 4.9, stock: 5, isActive: true },
      { vendorId: vendor._id, name: 'Wireless Mouse', description: 'Ergonomic mouse', category: 'Accessories', price: 30, rating: 4.0, stock: 20, isActive: true },
      { vendorId: vendor._id, name: 'Inactive Item', description: 'Old item', category: 'Audio', price: 99, rating: 5.0, stock: 10, isActive: false },
    ]);
  });

  it('should search products case-insensitively', async () => {
    const res = await request(app).get('/api/products?search=headphone');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.products.length).toBe(1);
    expect(res.body.data.products[0].name).toBe('Noise Cancelling Headphones');
  });

  it('should filter products by category', async () => {
    const res = await request(app).get('/api/products?category=Audio');
    expect(res.statusCode).toBe(200);
    // Active items only: Headphones ($200) and Earbuds ($50)
    expect(res.body.data.products.length).toBe(2);
    expect(res.body.data.products.every((p) => p.category === 'Audio')).toBe(true);
  });

  it('should filter products by price range', async () => {
    const res = await request(app).get('/api/products?minPrice=40&maxPrice=150');
    expect(res.statusCode).toBe(200);
    // Bluetooth Earbuds ($50), Mechanical Keyboard ($120)
    expect(res.body.data.products.length).toBe(2);
  });

  it('should sort products by price ascending', async () => {
    const res = await request(app).get('/api/products?sort=price_asc');
    expect(res.statusCode).toBe(200);
    const prices = res.body.data.products.map((p) => p.price);
    expect(prices).toEqual([30, 50, 120, 200]);
  });

  it('should return pagination metadata correctly', async () => {
    const res = await request(app).get('/api/products?page=1&limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.products.length).toBe(2);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(2);
    expect(res.body.data.totalProducts).toBe(4); // 4 active products
    expect(res.body.data.totalPages).toBe(2);
  });
});
