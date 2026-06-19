import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import socketService from './services/socketService.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhooks.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

// Load env vars
dotenv.config();

// Connect to MongoDB and Start Server
// We wrap this to ensure connectDB finishes and sets global.useMemoryDb before seeding or starting the server.

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketClients: socketService.activeClients
  });
});

// Seed Initial Products Helper
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments({});
    if (count === 0) {
      console.log('[Seeding] No products found. Seeding initial items...');
      const sampleProducts = [
        {
          name: 'Spicy Chicken Burger',
          description: 'Crispy chicken breast with cheese, lettuce, and spicy secret sauce.',
          price: 28.00,
          category: 'Burgers',
          imageUrl: '',
          platformMappings: {
            hungerstation: { productId: 'hs-spicy-chick', categoryId: 'hs-burgers', priceOverride: null, isSyncEnabled: true },
            jahez: { itemId: 'jz-spicy-chick', menuId: 'jz-burgers', priceOverride: 29.00, isSyncEnabled: true },
            toyou: { itemId: 'ty-spicy-chick', priceOverride: null, isSyncEnabled: true }
          }
        },
        {
          name: 'Truffle Wagyu Burger',
          description: 'Double wagyu beef patty with truffle aioli, caramelised onions, and Swiss cheese.',
          price: 45.00,
          category: 'Burgers',
          imageUrl: '',
          platformMappings: {
            hungerstation: { productId: 'hs-truffle-beef', categoryId: 'hs-burgers', priceOverride: null, isSyncEnabled: true },
            jahez: { itemId: 'jz-truffle-beef', menuId: 'jz-burgers', priceOverride: 47.00, isSyncEnabled: true },
            toyou: { itemId: 'ty-truffle-beef', priceOverride: null, isSyncEnabled: true }
          }
        },
        {
          name: 'Classic Angus Burger',
          description: 'Angus beef patty with lettuce, tomatoes, pickles, and house burger sauce.',
          price: 32.00,
          category: 'Burgers',
          imageUrl: '',
          platformMappings: {
            hungerstation: { productId: 'hs-classic-angus', categoryId: 'hs-burgers', priceOverride: null, isSyncEnabled: true },
            jahez: { itemId: 'jz-classic-angus', menuId: 'jz-burgers', priceOverride: null, isSyncEnabled: true },
            toyou: { itemId: 'ty-classic-angus', priceOverride: null, isSyncEnabled: true }
          }
        },
        {
          name: 'Seasoned French Fries',
          description: 'Golden crispy skin-on fries with cajun seasoning blend.',
          price: 12.00,
          category: 'Sides',
          imageUrl: '',
          platformMappings: {
            hungerstation: { productId: 'hs-cajun-fries', categoryId: 'hs-sides', priceOverride: null, isSyncEnabled: true },
            jahez: { itemId: 'jz-cajun-fries', menuId: 'jz-sides', priceOverride: null, isSyncEnabled: true },
            toyou: { itemId: 'ty-cajun-fries', priceOverride: null, isSyncEnabled: true }
          }
        },
        {
          name: 'Coca Cola',
          description: '330ml chilled carbonated beverage.',
          price: 6.00,
          category: 'Beverages',
          imageUrl: '',
          platformMappings: {
            hungerstation: { productId: 'hs-coke', categoryId: 'hs-drinks', priceOverride: null, isSyncEnabled: true },
            jahez: { itemId: 'jz-coke', menuId: 'jz-drinks', priceOverride: null, isSyncEnabled: true },
            toyou: { itemId: 'ty-coke', priceOverride: null, isSyncEnabled: true }
          }
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log('[Seeding] Successfully seeded 5 sample items.');
    }
  } catch (error) {
    console.error('[Seeding Error]', error.message);
  }
};

// Initialize Socket.io
socketService.init(server);

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, async () => {
    console.log(`[Express] Unified Portal Backend listening on port ${PORT}`);
    await seedProducts();
  });
};

startServer();

// Periodic Mock Order Simulator for Tutoring
if (process.env.AUTO_GENERATE_ORDERS === 'true') {
  const intervalTime = parseInt(process.env.ORDER_GENERATION_INTERVAL_MS, 10) || 45000;
  console.log(`[Order Simulator] Auto-order simulation started. Interval: ${intervalTime}ms`);
  
  const platforms = ['hungerstation', 'jahez', 'toyou'];
  const firstNames = ['Khalid', 'Fatima', 'Nouf', 'Fahad', 'Sarah', 'Youssef', 'Hassan', 'Rania'];
  const lastNames = ['Al-Otaibi', 'Al-Malki', 'Al-Ghamdi', 'Al-Shehri', 'Al-Dosari', 'Al-Qahtani'];

  setInterval(async () => {
    try {
      // Check if there are products to order
      const products = await Product.find({ isAvailable: true });
      if (products.length === 0) return;

      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
      const randomCust = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const extOrderId = `${randomPlatform.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Pick 1-3 random products
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let total = 0;

      for (let i = 0; i < itemCount; i++) {
        const itemProduct = products[Math.floor(Math.random() * products.length)];
        // Check if item is already added to order
        if (orderItems.some(o => o.productId.toString() === itemProduct._id.toString())) {
          continue;
        }

        const quantity = Math.floor(Math.random() * 2) + 1;
        // Determine price based on platform priceOverride or standard price
        const mapping = itemProduct.platformMappings?.[randomPlatform] || {};
        const price = mapping.priceOverride !== null && mapping.priceOverride !== undefined
          ? mapping.priceOverride
          : itemProduct.price;

        orderItems.push({
          name: itemProduct.name,
          quantity,
          price,
          productId: itemProduct._id
        });
        total += price * quantity;
      }

      if (orderItems.length === 0) return;

      const newOrder = new Order({
        platform: randomPlatform,
        externalOrderId: extOrderId,
        customerName: randomCust,
        items: orderItems,
        totalPrice: Number(total.toFixed(2)),
        status: 'pending'
      });

      const savedOrder = await newOrder.save();
      socketService.emitNewOrder(savedOrder);
      socketService.emitSyncLog({
        type: 'simulated_order_received',
        message: `Simulated order ${extOrderId} placed on ${randomPlatform.toUpperCase()} by ${randomCust} ($${total.toFixed(2)})`,
        details: { orderId: savedOrder._id }
      });
    } catch (err) {
      console.error('[Order Simulator Error]', err.message);
    }
  }, intervalTime);
}
