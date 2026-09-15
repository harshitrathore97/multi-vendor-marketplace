const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/response');

const calculateCartSummary = async (cart) => {
  let subtotal = 0;
  const detailedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.productId).populate('vendorId', 'businessName');
    if (product && product.isActive) {
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      detailedItems.push({
        _id: item._id,
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        vendor: product.vendorId,
        quantity: item.quantity,
        availableStock: product.stock,
        subtotal: itemSubtotal,
        isOutOfStock: product.stock < item.quantity,
      });
    }
  }

  let discount = 0;
  let couponDetails = null;

  if (cart.appliedCoupon) {
    const coupon = await Coupon.findOne({ code: cart.appliedCoupon.toUpperCase() });
    if (coupon) {
      const validity = coupon.isValid(subtotal);
      if (validity.valid) {
        discount = coupon.calculateDiscount(subtotal);
        couponDetails = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: discount,
        };
      }
    }
  }

  // Delivery: Flat $10, or Free Delivery for orders >= $100
  const deliveryFee = subtotal >= 100 || subtotal === 0 ? 0 : 10;
  // Tax: 5% on discounted amount
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
  const finalAmount = Math.max(0, Math.round((taxableAmount + deliveryFee + tax) * 100) / 100);

  return {
    items: detailedItems,
    itemCount: detailedItems.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    deliveryFee,
    tax,
    finalAmount,
    coupon: couponDetails,
  };
};

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customerId: req.user._id, items: [] });
    }

    const summary = await calculateCartSummary(cart);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 'Product ID is required', 400);
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return sendError(res, 'Quantity must be a positive number', 400);
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return sendError(res, 'Product not found or is currently inactive', 404);
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = new Cart({ customerId: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    const currentQtyInCart = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    const requestedTotalQty = currentQtyInCart + qty;

    if (requestedTotalQty > product.stock) {
      return sendError(
        res,
        `Cannot add ${qty} item(s). Exceeds available stock of ${product.stock} (already ${currentQtyInCart} in cart).`,
        400
      );
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = requestedTotalQty;
      cart.items[itemIndex].priceSnapshot = product.price;
    } else {
      cart.items.push({
        productId,
        quantity: qty,
        priceSnapshot: product.price,
      });
    }

    await cart.save();
    const summary = await calculateCartSummary(cart);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return sendError(res, 'Quantity must be 0 or a positive integer', 400);
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return sendError(res, 'Product is no longer available', 404);
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return sendError(res, 'Item not found in cart', 404);
    }

    if (qty === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      if (qty > product.stock) {
        return sendError(
          res,
          `Cannot update quantity to ${qty}. Only ${product.stock} units available in stock.`,
          400
        );
      }
      cart.items[itemIndex].quantity = qty;
      cart.items[itemIndex].priceSnapshot = product.price;
    }

    await cart.save();
    const summary = await calculateCartSummary(cart);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ customerId: req.user._id });

    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    const summary = await calculateCartSummary(cart);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return sendError(res, 'Please provide a coupon code', 400);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return sendError(res, 'Invalid coupon code', 404);
    }

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart || !cart.items.length) {
      return sendError(res, 'Your cart is empty', 400);
    }

    const summary = await calculateCartSummary(cart);
    const validity = coupon.isValid(summary.subtotal);

    if (!validity.valid) {
      return sendError(res, validity.message, 400);
    }

    cart.appliedCoupon = coupon.code;
    await cart.save();

    const updatedSummary = await calculateCartSummary(cart);
    return sendSuccess(res, {
      message: `Coupon "${coupon.code}" applied successfully!`,
      ...updatedSummary,
    });
  } catch (err) {
    next(err);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user._id });
    if (cart) {
      cart.appliedCoupon = null;
      await cart.save();
    }
    const summary = await calculateCartSummary(cart);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  calculateCartSummary,
};
