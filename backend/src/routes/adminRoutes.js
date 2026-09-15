const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES, VENDOR_STATUS } = require('../constants');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/stats', adminController.getPlatformStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', adminController.toggleUserSuspension);

router.get('/vendors', adminController.getVendors);
router.patch('/vendors/:id/approve', (req, res, next) => {
  req.body.status = VENDOR_STATUS.APPROVED;
  adminController.updateVendorStatus(req, res, next);
});
router.patch('/vendors/:id/reject', (req, res, next) => {
  req.body.status = VENDOR_STATUS.REJECTED;
  adminController.updateVendorStatus(req, res, next);
});

router.get('/orders', adminController.getAdminOrders);
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id/status', adminController.toggleCouponStatus);

module.exports = router;
