import express from 'express';
import Order from '../models/Order.js';
import integrationManager from '../services/integrationManager.js';
import socketService from '../services/socketService.js';

const router = express.Router();

// Get all orders (sorted by newest first)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'dispatched', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await order.save();

    // Broadcast update via WebSockets to all dashboards
    socketService.emitOrderStatusChanged(updatedOrder);

    // Sync status change to partner delivery app
    integrationManager.syncOrderStatusUpdate(order.platform, order.externalOrderId, status)
      .then(report => {
        socketService.emitSyncLog({
          type: 'order_status_sync',
          message: `Order status for ${order.platform.toUpperCase()} order #${order.externalOrderId} updated to ${status.toUpperCase()}.`,
          details: report
        });
      })
      .catch(error => {
        socketService.emitSyncLog({
          type: 'order_status_sync_error',
          message: `Failed syncing status to ${order.platform.toUpperCase()} for order #${order.externalOrderId}`,
          error: error.message
        });
      });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

export default router;
