import mongoose from 'mongoose';

// 1. Define real Mongoose Schema and Model
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  platformMappings: {
    hungerstation: { productId: String, categoryId: String, priceOverride: Number, isSyncEnabled: { type: Boolean, default: true } },
    jahez: { itemId: String, menuId: String, priceOverride: Number, isSyncEnabled: { type: Boolean, default: true } },
    toyou: { itemId: String, priceOverride: Number, isSyncEnabled: { type: Boolean, default: true } }
  }
}, { timestamps: true });

const MongooseProduct = mongoose.model('MongooseProduct', ProductSchema);

// 2. In-Memory database store
let memoryProducts = [];

class ProductInstance {
  constructor(data) {
    this._id = data._id || new mongoose.Types.ObjectId().toString();
    this.name = data.name;
    this.description = data.description || '';
    this.price = Number(data.price);
    this.category = data.category;
    this.imageUrl = data.imageUrl || '';
    this.isAvailable = data.isAvailable !== false;
    this.platformMappings = {
      hungerstation: {
        productId: data.platformMappings?.hungerstation?.productId || '',
        categoryId: data.platformMappings?.hungerstation?.categoryId || '',
        priceOverride: data.platformMappings?.hungerstation?.priceOverride ?? null,
        isSyncEnabled: data.platformMappings?.hungerstation?.isSyncEnabled !== false
      },
      jahez: {
        itemId: data.platformMappings?.jahez?.itemId || '',
        menuId: data.platformMappings?.jahez?.menuId || '',
        priceOverride: data.platformMappings?.jahez?.priceOverride ?? null,
        isSyncEnabled: data.platformMappings?.jahez?.isSyncEnabled !== false
      },
      toyou: {
        itemId: data.platformMappings?.toyou?.itemId || '',
        priceOverride: data.platformMappings?.toyou?.priceOverride ?? null,
        isSyncEnabled: data.platformMappings?.toyou?.isSyncEnabled !== false
      }
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const index = memoryProducts.findIndex(p => p._id.toString() === this._id.toString());
    if (index >= 0) {
      memoryProducts[index] = this;
    } else {
      memoryProducts.push(this);
    }
    return this;
  }
}

// 3. Proxy Class exporting same interface as Mongoose model
class ProductProxy {
  static get modelName() {
    return 'Product';
  }

  static find(query = {}) {
    if (global.useMemoryDb) {
      const chain = {
        sort: (sortObj) => {
          const sorted = [...memoryProducts].sort((a, b) => b.updatedAt - a.updatedAt);
          return Promise.resolve(sorted);
        },
        then: (resolve) => resolve(memoryProducts),
        catch: (reject) => {}
      };
      return chain;
    }
    return MongooseProduct.find(query);
  }

  static async findById(id) {
    if (global.useMemoryDb) {
      const found = memoryProducts.find(p => p._id.toString() === id.toString());
      return found ? new ProductInstance(found) : null;
    }
    return MongooseProduct.findById(id);
  }

  static async findOne(query = {}) {
    if (global.useMemoryDb) {
      // Simple name regex match helper for webhook linking
      if (query.$or) {
        const regexVal = query.$or[0].name;
        const namePattern = regexVal.source || regexVal;
        const regex = new RegExp(namePattern, 'i');
        const found = memoryProducts.find(p => regex.test(p.name));
        return found ? new ProductInstance(found) : null;
      }
      return memoryProducts[0] ? new ProductInstance(memoryProducts[0]) : null;
    }
    return MongooseProduct.findOne(query);
  }

  static async deleteOne(query = {}) {
    if (global.useMemoryDb) {
      const id = query._id;
      memoryProducts = memoryProducts.filter(p => p._id.toString() !== id.toString());
      return { deletedCount: 1 };
    }
    return MongooseProduct.deleteOne(query);
  }

  static async countDocuments(query = {}) {
    if (global.useMemoryDb) {
      return memoryProducts.length;
    }
    // Set command timeout so it fails fast
    return MongooseProduct.countDocuments(query).maxTimeMS(2000);
  }

  static async insertMany(productsArray) {
    if (global.useMemoryDb) {
      const saved = productsArray.map(p => {
        const inst = new ProductInstance(p);
        memoryProducts.push(inst);
        return inst;
      });
      return saved;
    }
    return MongooseProduct.insertMany(productsArray);
  }

  // Allow instantiation using "new Product(data)"
  constructor(data) {
    if (global.useMemoryDb) {
      return new ProductInstance(data);
    }
    return new MongooseProduct(data);
  }
}

export default ProductProxy;
export { MongooseProduct };
