import mongoose from 'mongoose';

// 1. Define real Mongoose Schema
const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
});

const OrderSchema = new mongoose.Schema({
  platform: { type: String, enum: ['hungerstation', 'jahez', 'toyou'], required: true },
  externalOrderId: { type: String, required: true, unique: true },
  customerName: { type: String, default: 'Guest Customer' },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'dispatched', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

const MongooseOrder = mongoose.model('MongooseOrder', OrderSchema);

// 2. In-Memory database store
let memoryOrders = [];

class OrderInstance {
  constructor(data) {
    this._id = data._id || new mongoose.Types.ObjectId().toString();
    this.platform = data.platform;
    this.externalOrderId = data.externalOrderId;
    this.customerName = data.customerName || 'Guest Customer';
    this.items = data.items || [];
    this.totalPrice = Number(data.totalPrice);
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const index = memoryOrders.findIndex(o => o._id.toString() === this._id.toString());
    if (index >= 0) {
      memoryOrders[index] = this;
    } else {
      // Check uniqueness of externalOrderId in memory
      const exists = memoryOrders.some(o => o.externalOrderId === this.externalOrderId);
      if (exists && !this._id) {
        throw new Error(`Order validation failed: externalOrderId: Key must be unique`);
      }
      memoryOrders.push(this);
    }
    return this;
  }
}

// 3. Proxy Class
class OrderProxy {
  static get modelName() {
    return 'Order';
  }

  static find(query = {}) {
    if (global.useMemoryDb) {
      const chain = {
        sort: (sortObj) => {
          // Sort by createdAt descending
          const sorted = [...memoryOrders].sort((a, b) => b.createdAt - a.createdAt);
          return Promise.resolve(sorted);
        },
        then: (resolve) => resolve(memoryOrders),
        catch: (reject) => {}
      };
      return chain;
    }
    return MongooseOrder.find(query);
  }

  static async findById(id) {
    if (global.useMemoryDb) {
      const found = memoryOrders.find(o => o._id.toString() === id.toString());
      return found ? new OrderInstance(found) : null;
    }
    return MongooseOrder.findById(id);
  }

  constructor(data) {
    if (global.useMemoryDb) {
      return new OrderInstance(data);
    }
    return new MongooseOrder(data);
  }
}

export default OrderProxy;
export { MongooseOrder };
