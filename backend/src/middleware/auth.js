const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { ROLES, VENDOR_STATUS } = require('../constants');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_multi_vendor_marketplace_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return sendError(res, 'Invalid or expired token.', 401);
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    if (user.isSuspended) {
      return sendError(res, 'Your account has been suspended by administration.', 403);
    }

    // Attach user (without password hash)
    const userObj = user.toObject();
    delete userObj.password;
    req.user = userObj;

    // If user is a vendor, attach their vendor profile
    if (req.user.role === ROLES.VENDOR) {
      const vendor = await Vendor.findOne({ userId: req.user._id });
      req.vendor = vendor;
    }

    next();
  } catch (error) {
    return sendError(res, `Authentication failure: ${error.message}`, 500);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized access', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        403
      );
    }

    next();
  };
};

const requireVendorApproved = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) {
    return next(); // Admins bypass vendor status check
  }

  if (req.user.role !== ROLES.VENDOR || !req.vendor) {
    return sendError(res, 'Vendor profile not found.', 403);
  }

  if (req.vendor.status !== VENDOR_STATUS.APPROVED) {
    return sendError(
      res,
      `Vendor account is not approved. Current status: ${req.vendor.status}. Only approved vendors can manage products and orders.`,
      403
    );
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireVendorApproved,
};
