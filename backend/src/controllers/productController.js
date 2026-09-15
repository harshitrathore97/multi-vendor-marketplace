const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const cache = require('../config/cache');
const { ROLES } = require('../constants');
const { sendSuccess, sendError } = require('../utils/response');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      vendorId,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Cache key for common browsing
    const cacheKey = `products_${JSON.stringify(req.query)}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return sendSuccess(res, cachedData);
    }

    const query = { isActive: true };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    if (rating && Number(rating) > 0) {
      query.rating = { $gte: Number(rating) };
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    const products = await Product.find(query)
      .populate('vendorId', 'businessName logoUrl status rating')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const responseData = {
      products,
      page: pageNum,
      limit: limitNum,
      totalProducts,
      totalPages,
    };

    // Cache catalog listing for 60 seconds
    await cache.set(cacheKey, responseData, 60);

    return sendSuccess(res, responseData);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `product_${id}`;

    const cachedProduct = await cache.get(cacheKey);
    if (cachedProduct) {
      return sendSuccess(res, { product: cachedProduct });
    }

    const product = await Product.findById(id)
      .populate('vendorId', 'businessName ownerName email phone description logoUrl rating status')
      .lean();

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    await cache.set(cacheKey, product, 120);

    return sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, images } = req.body;

    if (!name || !description || price === undefined || !category || stock === undefined) {
      return sendError(res, 'Name, description, price, category, and stock are required.', 400);
    }

    if (!req.vendor && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 'Only approved vendors can create products.', 403);
    }

    const vendorId = req.vendor ? req.vendor._id : req.body.vendorId;

    let productImages = [];
    if (Array.isArray(images)) {
      productImages = images;
    } else if (req.files && req.files.length) {
      productImages = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const product = await Product.create({
      vendorId,
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      images: productImages,
      isActive: true,
    });

    await cache.flush();

    return sendSuccess(res, { product }, 201);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Ownership check: only product's vendor or admin can update
    const isOwner = req.vendor && product.vendorId.toString() === req.vendor._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Forbidden. You do not own this product.', 403);
    }

    const { name, description, price, category, stock, isActive, images } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    if (Array.isArray(images)) {
      product.images = images;
    } else if (req.files && req.files.length) {
      const uploaded = req.files.map((file) => `/uploads/${file.filename}`);
      product.images = [...product.images, ...uploaded];
    }

    await product.save();
    await cache.del(`product_${id}`);
    await cache.flush();

    return sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const isOwner = req.vendor && product.vendorId.toString() === req.vendor._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Forbidden. You do not own this product.', 403);
    }

    await Product.findByIdAndDelete(id);
    await cache.del(`product_${id}`);
    await cache.flush();

    return sendSuccess(res, { message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const cachedCategories = await cache.get('categories_list');
    if (cachedCategories) {
      return sendSuccess(res, { categories: cachedCategories });
    }

    const categories = await Product.distinct('category', { isActive: true });
    await cache.set('categories_list', categories, 600);

    return sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};
