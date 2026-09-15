require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { ROLES, VENDOR_STATUS, DISCOUNT_TYPE } = require('../constants');

const seedData = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('[Seed] Database already contains records. Skipping initial seeding.');
      return;
    }

    console.log('[Seed] Starting database seeding...');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Platform Administrator',
      email: 'admin@marketplace.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      phone: '+1 800-555-0100',
    });

    // 2. Create Approved Vendor 1: TechHub
    const vendorUser1 = await User.create({
      name: 'Alex Rivera',
      email: 'vendor1@techhub.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
      phone: '+1 555-0199',
    });

    const vendor1 = await Vendor.create({
      userId: vendorUser1._id,
      businessName: 'TechHub Innovations',
      ownerName: 'Alex Rivera',
      email: 'vendor1@techhub.com',
      phone: '+1 555-0199',
      description: 'Cutting-edge electronics, audio accessories, and developer peripherals.',
      logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=150&auto=format&fit=crop&q=80',
      status: VENDOR_STATUS.APPROVED,
      rating: 4.8,
      totalSales: 142,
      totalRevenue: 12450,
    });

    // 3. Create Approved Vendor 2: StyleCraft
    const vendorUser2 = await User.create({
      name: 'Elena Rostova',
      email: 'vendor2@stylecraft.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
      phone: '+1 555-0188',
    });

    const vendor2 = await Vendor.create({
      userId: vendorUser2._id,
      businessName: 'StyleCraft Apparel',
      ownerName: 'Elena Rostova',
      email: 'vendor2@stylecraft.com',
      phone: '+1 555-0188',
      description: 'Modern, sustainable apparel and lifestyle commuter accessories.',
      logoUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=150&auto=format&fit=crop&q=80',
      status: VENDOR_STATUS.APPROVED,
      rating: 4.6,
      totalSales: 98,
      totalRevenue: 7890,
    });

    // 4. Create Pending Vendor: Artisan Crafts
    const pendingVendorUser = await User.create({
      name: 'Marcus Vance',
      email: 'vendor.pending@artisan.com',
      password: 'Password123!',
      role: ROLES.VENDOR,
      phone: '+1 555-0177',
    });

    await Vendor.create({
      userId: pendingVendorUser._id,
      businessName: 'Artisan Handmade Studio',
      ownerName: 'Marcus Vance',
      email: 'vendor.pending@artisan.com',
      phone: '+1 555-0177',
      description: 'Bespoke ceramics, woodwork, and artisanal home goods.',
      status: VENDOR_STATUS.PENDING,
    });

    // 5. Create Customer
    await User.create({
      name: 'Sarah Connor',
      email: 'customer@example.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
      phone: '+1 555-0123',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'Oregon',
        zipCode: '97477',
        country: 'United States',
      },
    });

    // 6. Create Products
    const products = [
      {
        vendorId: vendor1._id,
        name: 'Acoustic Pro Wireless ANC Headphones',
        description: 'Engineered for audio purists. Active noise cancellation with 40mm neodymium drivers and 35-hour battery life.',
        price: 199.99,
        category: 'Electronics',
        stock: 25,
        rating: 4.9,
        numReviews: 48,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        name: 'Apex Mechanical RGB Gaming Keyboard',
        description: 'Hot-swappable linear mechanical switches with customizable per-key RGB backlighting and aircraft-grade aluminum top plate.',
        price: 89.99,
        category: 'Electronics',
        stock: 18,
        rating: 4.7,
        numReviews: 32,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        name: 'UltraVision 4K HDR Streaming Webcam',
        description: 'Crystal clear 4K resolution at 60fps with dual stereo noise-canceling microphones and automatic light correction.',
        price: 79.99,
        category: 'Electronics',
        stock: 20,
        rating: 4.6,
        numReviews: 19,
        images: [
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        name: 'ErgoMotion Vertical Ergonomic Wireless Mouse',
        description: 'Scientifically tested 57-degree vertical handshake angle to reduce wrist strain and muscle fatigue during long work sessions.',
        price: 49.99,
        category: 'Electronics',
        stock: 30,
        rating: 4.5,
        numReviews: 24,
        images: [
          'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        name: 'Commuter Water-Resistant Leather Backpack',
        description: 'Handcrafted full-grain leather backpack with dedicated padded sleeve for up to 16-inch laptops and quick-access magnetic closures.',
        price: 129.99,
        category: 'Fashion',
        stock: 15,
        rating: 4.8,
        numReviews: 28,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        name: 'Organic Heavyweight Minimalist Hoodie',
        description: 'Tailored from 450gsm combed organic cotton fleece. Features clean raglan sleeves and ribbed cuffs for an elevated casual aesthetic.',
        price: 59.99,
        category: 'Fashion',
        stock: 45,
        rating: 4.6,
        numReviews: 39,
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        name: 'Modernist Classic Aviator Polarized Sunglasses',
        description: 'Ultralight titanium frame with UV400 polarized anti-reflective lenses for glare-free optical clarity and effortless timeless style.',
        price: 39.99,
        category: 'Fashion',
        stock: 35,
        rating: 4.4,
        numReviews: 17,
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        name: 'Nordic Minimalist Ceramic Coffee Dripper & Carafe',
        description: 'Matte ceramic pour-over dripper with heat-resistant borosilicate glass server. Perfect extraction for coffee connoisseurs.',
        price: 34.99,
        category: 'Home',
        stock: 14,
        rating: 4.9,
        numReviews: 22,
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
        ],
        isActive: true,
      },
    ];

    await Product.insertMany(products);

    // 7. Create Coupons
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: DISCOUNT_TYPE.PERCENTAGE,
        discountValue: 10,
        minOrderValue: 30,
        maxDiscount: 50,
        expiryDate: oneYearLater,
        usageLimit: 500,
      },
      {
        code: 'FLAT25',
        discountType: DISCOUNT_TYPE.FIXED,
        discountValue: 25,
        minOrderValue: 80,
        expiryDate: oneYearLater,
        usageLimit: 200,
      },
      {
        code: 'SUPER50',
        discountType: DISCOUNT_TYPE.FIXED,
        discountValue: 50,
        minOrderValue: 200,
        expiryDate: oneYearLater,
        usageLimit: 100,
      },
    ]);

    console.log('[Seed] Database seeded successfully with demo users, vendors, products, and coupons!');
  } catch (error) {
    console.error('[Seed] Seeding error:', error.message);
  }
};

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  connectDB()
    .then(() => seedData())
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedData;
