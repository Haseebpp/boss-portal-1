import express from 'express';
import Product from '../models/Product.js';
import integrationManager from '../services/integrationManager.js';
import socketService from '../services/socketService.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ updatedAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, platformMappings } = req.body;
    
    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      platformMappings
    });

    const savedProduct = await product.save();
    
    // Trigger async sync in the background so API responds quickly
    integrationManager.createProductOnAllPlatforms(savedProduct).then(report => {
      socketService.emitSyncLog({
        type: 'product_create',
        message: `Product "${savedProduct.name}" created and synced to active portals.`,
        details: report
      });
    });

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable, platformMappings } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.category = category ?? product.category;
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.isAvailable = isAvailable ?? product.isAvailable;
    product.platformMappings = platformMappings ?? product.platformMappings;

    const updatedProduct = await product.save();

    // Trigger sync in the background
    integrationManager.updateProductOnAllPlatforms(updatedProduct).then(report => {
      socketService.emitSyncLog({
        type: 'product_update',
        message: `Product "${updatedProduct.name}" updated. Synced changes to platforms.`,
        details: report
      });
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });

    // Sync deletion across delivery platforms in the background
    integrationManager.deleteProductFromAllPlatforms(product).then(report => {
      socketService.emitSyncLog({
        type: 'product_delete',
        message: `Product "${product.name}" deleted locally. Synced remove action to portals.`,
        details: report
      });
    });

    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

export default router;
