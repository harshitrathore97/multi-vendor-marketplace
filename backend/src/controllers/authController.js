const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { ROLES, VENDOR_STATUS } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_multi_vendor_marketplace_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = ROLES.CUSTOMER, businessName, phone, description } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409);
    }

    const assignedRole = Object.values(ROLES).includes(role) ? role : ROLES.CUSTOMER;

    if (assignedRole === ROLES.VENDOR && !businessName) {
      return sendError(res, 'Business name is required for vendor registration.', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      phone,
    });

    let vendor = null;
    if (assignedRole === ROLES.VENDOR) {
      vendor = await Vendor.create({
        userId: user._id,
        businessName,
        ownerName: name,
        email: email.toLowerCase(),
        phone: phone || 'N/A',
        description: description || '',
        status: VENDOR_STATUS.PENDING,
      });
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(
      res,
      {
        user: userObj,
        vendor,
        token,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide both email and password.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (user.isSuspended) {
      return sendError(res, 'Your account has been suspended by an administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    let vendor = null;
    if (user.role === ROLES.VENDOR) {
      vendor = await Vendor.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, {
      user: userObj,
      vendor,
      token,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  return sendSuccess(res, {
    user: req.user,
    vendor: req.vendor || null,
  });
};

const updateMe = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, { user: userObj });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
};
