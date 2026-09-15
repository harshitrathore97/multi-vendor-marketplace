const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const { ROLES, VENDOR_STATUS } = require('../src/constants');

describe('Authentication & Authorization Suite', () => {
  it('should register a customer successfully with hashed password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: ROLES.CUSTOMER,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();

    // Verify password is encrypted in database
    const userInDb = await User.findOne({ email: 'john@example.com' }).select('+password');
    expect(userInDb.password).not.toBe('Password123!');
  });

  it('should reject registration with duplicate email address', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User 1',
      email: 'duplicate@example.com',
      password: 'Password123!',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'User 2',
      email: 'duplicate@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should create a PENDING vendor profile upon vendor registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Vendor Bob',
        email: 'bob@store.com',
        password: 'Password123!',
        role: ROLES.VENDOR,
        businessName: 'Bob Goods',
        phone: '1234567890',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.vendor).toBeDefined();
    expect(res.body.data.vendor.status).toBe(VENDOR_STATUS.PENDING);
    expect(res.body.data.vendor.businessName).toBe('Bob Goods');
  });

  it('should authenticate valid login and reject invalid password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'Password123!',
    });

    // Valid login
    const validRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!',
    });
    expect(validRes.statusCode).toBe(200);
    expect(validRes.body.data.token).toBeDefined();

    // Invalid password
    const invalidRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'WrongPassword!',
    });
    expect(invalidRes.statusCode).toBe(401);
    expect(invalidRes.body.success).toBe(false);
  });

  it('should block suspended users from accessing authenticated endpoints', async () => {
    const user = await User.create({
      name: 'Suspended User',
      email: 'suspended@example.com',
      password: 'Password123!',
      isSuspended: true,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'suspended@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});
