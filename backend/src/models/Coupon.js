const mongoose = require('mongoose');
const { DISCOUNT_TYPE } = require('../constants');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      default: DISCOUNT_TYPE.PERCENTAGE,
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // null means no cap
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    usageLimit: {
      type: Number,
      default: 1000,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function (orderAmount = 0) {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (new Date() > new Date(this.expiryDate)) return { valid: false, message: 'Coupon has expired' };
  if (this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderValue) {
    return { valid: false, message: `Minimum order amount of $${this.minOrderValue} required for this coupon` };
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;
  if (this.discountType === DISCOUNT_TYPE.PERCENTAGE) {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  return Math.min(Math.round(discount * 100) / 100, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
