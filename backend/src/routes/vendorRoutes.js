const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize, requireVendorApproved } = require('../middleware/auth');
const { ROLES } = require('../constants');

router.use(authenticate);
router.use(authorize(ROLES.VENDOR, ROLES.ADMIN));
router.use(requireVendorApproved);

router.get('/orders', vendorController.getVendorOrders);
router.patch('/orders/:id/status', vendorController.updateOrderStatus);
router.get('/analytics', vendorController.getVendorAnalytics);

module.exports = router;
