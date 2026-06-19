import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import socketService from '../services/socketService.js';

const router = express.Router();

// Helper to find a product matching name/platform ID to link the ref
async function findProductRef(name) {
  try {
    const product = await Product.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, 'i') }
      ]
    });
    return product ? product._id : null;
  } catch {
    return null;
  }
}

// 1. HungerStation Webhook
router.post('/hungerstation', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Webhook HungerStation] Received payload:', JSON.stringify(payload, null, 2));

    // Normalize hungerstation parameters
    const externalOrderId = payload.order_id || `hs-${Date.now()}`;
    const customerName = payload.customer?.name || 'HungerStation Guest';
    const rawItems = payload.items || [];
    const totalPrice = payload.total || 0;

    const items = [];
    for (const item of rawItems) {
      const name = item.name || 'Unknown Item';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const productId = await findProductRef(name);

      items.push({ name, quantity, price, productId });
    }

    const order = new Order({
      platform: 'hungerstation',
      externalOrderId,
      customerName,
      items,
      totalPrice,
      status: 'pending'
    });

    const savedOrder = await order.save();
    
    // Broadcast via WebSockets
    socketService.emitNewOrder(savedOrder);
    socketService.emitSyncLog({
      type: 'webhook_order_received',
      message: `New HungerStation Order #${externalOrderId} ($${totalPrice}) received via webhook.`,
      details: { orderId: savedOrder._id }
    });

    res.status(201).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Webhook HungerStation Error]', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing error', error: error.message });
  }
});

// 2. Jahez Webhook
router.post('/jahez', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Webhook Jahez] Received payload:', JSON.stringify(payload, null, 2));

    // Normalize jahez parameters
    const externalOrderId = payload.orderRef || `jz-${Date.now()}`;
    const customerName = payload.customerName || 'Jahez Guest';
    const rawItems = payload.orderItems || [];
    const totalPrice = payload.amountPaid || 0;

    const items = [];
    for (const item of rawItems) {
      const name = item.itemName || 'Unknown Item';
      const quantity = item.qty || 1;
      const price = item.itemPrice || 0;
      const productId = await findProductRef(name);

      items.push({ name, quantity, price, productId });
    }

    const order = new Order({
      platform: 'jahez',
      externalOrderId,
      customerName,
      items,
      totalPrice,
      status: 'pending'
    });

    const savedOrder = await order.save();

    // Broadcast via WebSockets
    socketService.emitNewOrder(savedOrder);
    socketService.emitSyncLog({
      type: 'webhook_order_received',
      message: `New Jahez Order #${externalOrderId} ($${totalPrice}) received via webhook.`,
      details: { orderId: savedOrder._id }
    });

    res.status(201).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Webhook Jahez Error]', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing error', error: error.message });
  }
});

// 3. ToYou Webhook
router.post('/toyou', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Webhook ToYou] Received payload:', JSON.stringify(payload, null, 2));

    // Normalize toyou parameters
    const externalOrderId = payload.reference_id || `ty-${Date.now()}`;
    const customerName = payload.delivery_details?.client_name || 'ToYou Guest';
    const rawItems = payload.lines || [];
    const totalPrice = payload.grand_total || 0;

    const items = [];
    for (const item of rawItems) {
      const name = item.title || 'Unknown Item';
      const quantity = item.qty || 1;
      const price = item.unit_price || 0;
      const productId = await findProductRef(name);

      items.push({ name, quantity, price, productId });
    }

    const order = new Order({
      platform: 'toyou',
      externalOrderId,
      customerName,
      items,
      totalPrice,
      status: 'pending'
    });

    const savedOrder = await order.save();

    // Broadcast via WebSockets
    socketService.emitNewOrder(savedOrder);
    socketService.emitSyncLog({
      type: 'webhook_order_received',
      message: `New ToYou Order #${externalOrderId} ($${totalPrice}) received via webhook.`,
      details: { orderId: savedOrder._id }
    });

    res.status(201).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Webhook ToYou Error]', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing error', error: error.message });
  }
});

export default router;
