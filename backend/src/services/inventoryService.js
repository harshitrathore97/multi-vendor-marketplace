const Product = require('../models/Product');

class InventoryService {
  /**
   * Atomically reserve stock for an array of items.
   * Prevents race conditions using MongoDB atomic condition { stock: { $gte: qty } }.
   * If any item in the order has insufficient stock, rolls back previously reserved items.
   *
   * @param {Array<{ productId: string, quantity: number, name?: string }>} items
   * @returns {Promise<{ success: boolean, reservedItems?: Array, error?: string }>}
   */
  async reserveStock(items) {
    const reservedItems = [];

    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
          isActive: true,
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Atomic reservation failed! Product out of stock or insufficient quantity.
        // Rollback all already reserved items in this transaction
        await this.releaseStock(reservedItems);

        const currentProduct = await Product.findById(item.productId);
        const productName = item.name || currentProduct?.name || 'Product';
        const availableStock = currentProduct ? currentProduct.stock : 0;

        return {
          success: false,
          error: `Insufficient stock for "${productName}". Requested: ${item.quantity}, Available: ${availableStock}`,
          failedProductId: item.productId,
        };
      }

      reservedItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    return {
      success: true,
      reservedItems,
    };
  }

  /**
   * Atomically release (restore) stock when an order is cancelled or rolled back.
   *
   * @param {Array<{ productId: string, quantity: number }>} items
   */
  async releaseStock(items) {
    if (!items || !items.length) return;

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: item.quantity },
        },
        { new: true }
      );
    }
  }

  /**
   * Verify available stock for a list of items without decrementing.
   */
  async checkStockAvailability(items) {
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return {
          available: false,
          error: `Product ${item.name || item.productId} is no longer available.`,
        };
      }
      if (product.stock < item.quantity) {
        return {
          available: false,
          error: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`,
        };
      }
    }
    return { available: true };
  }
}

module.exports = new InventoryService();
