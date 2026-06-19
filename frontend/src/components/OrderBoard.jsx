import React from 'react';
import { useSocket } from '../context/SocketContext';

const OrderBoard = () => {
  const { orders, updateOrderStatus } = useSocket();

  const columns = {
    pending: { title: 'New Orders 📥', class: 'col-pending' },
    preparing: { title: 'Preparing 🍳', class: 'col-preparing' },
    dispatched: { title: 'Dispatched 🛵', class: 'col-dispatched' },
    completed: { title: 'Completed 🚀', class: 'col-completed' }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'hungerstation': return '🍔';
      case 'jahez': return '⚡';
      case 'toyou': return '🎈';
      default: return '📦';
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'hungerstation': return 'HungerStation';
      case 'jahez': return 'Jahez';
      case 'toyou': return 'ToYou';
      default: return platform;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group orders by column key
  const getOrdersByColumn = (colKey) => {
    return orders.filter(order => {
      if (colKey === 'completed') {
        return order.status === 'delivered' || order.status === 'cancelled';
      }
      return order.status === colKey;
    });
  };

  return (
    <div className="order-board-container">
      <div className="board-header">
        <h2>Live Order Desk</h2>
        <span className="live-pill">LIVE TRACKING ACTIVE</span>
      </div>

      <div className="kanban-board">
        {Object.entries(columns).map(([key, col]) => {
          const colOrders = getOrdersByColumn(key);
          return (
            <div key={key} className={`kanban-column ${col.class}`}>
              <div className="column-header">
                <h3>{col.title}</h3>
                <span className="column-count">{colOrders.length}</span>
              </div>
              <div className="column-body">
                {colOrders.length === 0 ? (
                  <div className="empty-column-placeholder">
                    No orders here
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div key={order._id} className={`order-card platform-${order.platform}`}>
                      <div className="order-card-header">
                        <span className={`platform-badge badge-${order.platform}`}>
                          {getPlatformIcon(order.platform)} {getPlatformName(order.platform)}
                        </span>
                        <span className="order-id">#{order.externalOrderId}</span>
                      </div>

                      <div className="order-customer">
                        👤 {order.customerName}
                      </div>

                      <div className="order-items-list">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <span className="item-qty">{item.quantity}x</span>
                            <span className="item-name">{item.name}</span>
                            <span className="item-price">SAR {item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-footer">
                        <span className="order-time">🕒 {formatTime(order.createdAt)}</span>
                        <span className="order-total">SAR {order.totalPrice.toFixed(2)}</span>
                      </div>

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="order-actions">
                          {order.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-action-accept"
                                onClick={() => updateOrderStatus(order._id, 'preparing')}
                              >
                                Accept & Cook
                              </button>
                              <button 
                                className="btn btn-action-reject"
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <>
                              <button 
                                className="btn btn-action-dispatch"
                                onClick={() => updateOrderStatus(order._id, 'dispatched')}
                              >
                                Ready to Dispatch
                              </button>
                              <button 
                                className="btn btn-action-reject"
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {order.status === 'dispatched' && (
                            <>
                              <button 
                                className="btn btn-action-complete"
                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                              >
                                Complete Delivery
                              </button>
                              <button 
                                className="btn btn-action-reject"
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      
                      {order.status === 'delivered' && (
                        <div className="order-badge-success">✓ Delivered Successfully</div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="order-badge-fail">✗ Order Rejected/Cancelled</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderBoard;
