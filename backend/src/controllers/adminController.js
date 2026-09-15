const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { VENDOR_STATUS, ORDER_STATUS, ROLES } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

const getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const approvedVendors = await Vendor.countDocuments({ status: VENDOR_STATUS.APPROVED });
    const pendingVendors = await Vendor.countDocuments({ status: VENDOR_STATUS.PENDING });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ orderStatus: ORDER_STATUS.DELIVERED });
    const cancelledOrders = await Order.countDocuments({ orderStatus: ORDER_STATUS.CANCELLED });

    // Aggregate platform revenue from non-cancelled orders
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: ORDER_STATUS.CANCELLED }, paymentStatus: 'SUCCESS' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const platformRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Recent activity feed
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customerName totalAmount orderStatus createdAt');

    return sendSuccess(res, {
      totalUsers,
      totalVendors,
      approvedVendors,
      pendingVendors,
      totalProducts,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      platformRevenue: Math.round(platformRevenue * 100) / 100,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccess(res, {
      users,
      totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

const toggleUserSuspension = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.role === ROLES.ADMIN) {
      return sendError(res, 'Cannot suspend an administrator account.', 400);
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // If user is a vendor, update vendor status as well
    if (user.role === ROLES.VENDOR) {
      await Vendor.findOneAndUpdate(
        { userId: user._id },
        { status: user.isSuspended ? VENDOR_STATUS.SUSPENDED : VENDOR_STATUS.APPROVED }
      );
    }

    return sendSuccess(res, {
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully.`,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const getVendors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const totalVendors = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query)
      .populate('userId', 'name email isSuspended')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccess(res, {
      vendors,
      totalVendors,
      page,
      limit,
      totalPages: Math.ceil(totalVendors / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

const updateVendorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(VENDOR_STATUS).includes(status)) {
      return sendError(res, `Invalid vendor status: ${status}`, 400);
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { status }, { new: true });
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    return sendSuccess(res, {
      message: `Vendor status updated to ${status}`,
      vendor,
    });
  } catch (err) {
    next(err);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.orderStatus = req.query.status;

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return sendSuccess(res, {
      orders,
      totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, { coupons });
  } catch (err) {
    next(err);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return sendError(res, 'Code, discount value, and expiry date are required.', 400);
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, 'A coupon with this code already exists.', 409);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 1000,
    });

    return sendSuccess(res, { coupon }, 201);
  } catch (err) {
    next(err);
  }
};

const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return sendSuccess(res, { coupon });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlatformStats,
  getUsers,
  toggleUserSuspension,
  getVendors,
  updateVendorStatus,
  getAdminOrders,
  getCoupons,
  createCoupon,
  toggleCouponStatus,
};
