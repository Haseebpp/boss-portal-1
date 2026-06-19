import { Server } from 'socket.io';

class SocketService {
  constructor() {
    this.io = null;
    this.activeClients = 0;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for simplicity in development
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    this.io.on('connection', (socket) => {
      this.activeClients++;
      console.log(`[Socket.io] Dashboard client connected. Active clients: ${this.activeClients}`);

      socket.on('disconnect', () => {
        this.activeClients = Math.max(0, this.activeClients - 1);
        console.log(`[Socket.io] Dashboard client disconnected. Active clients: ${this.activeClients}`);
      });
    });

    console.log('[Socket.io] Real-time events server initialized.');
  }

  broadcast(event, data) {
    if (!this.io) {
      console.warn(`[Socket.io] Warning: Socket server is not initialized yet. Event ${event} was not sent.`);
      return;
    }
    this.io.emit(event, data);
  }

  emitNewOrder(order) {
    console.log(`[Socket.io] Broadcasting NEW_ORDER event for order: ${order.externalOrderId}`);
    this.broadcast('NEW_ORDER', order);
  }

  emitOrderStatusChanged(order) {
    console.log(`[Socket.io] Broadcasting ORDER_STATUS_CHANGED event for order: ${order.externalOrderId} (${order.status})`);
    this.broadcast('ORDER_STATUS_CHANGED', order);
  }

  emitSyncLog(logEntry) {
    this.broadcast('SYNC_LOG_ENTRY', {
      timestamp: new Date().toISOString(),
      ...logEntry
    });
  }
}

export default new SocketService();
