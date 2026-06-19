import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);

  // Fetch initial orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Fetch initial products
  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();

    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to order socket server.');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from order socket server.');
    });

    // Listen for new orders
    socketInstance.on('NEW_ORDER', (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      
      // Play order alert sound if possible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.5;
        audio.play();
      } catch (e) {
        console.warn('Audio play blocked:', e);
      }
    });

    // Listen for order status changes
    socketInstance.on('ORDER_STATUS_CHANGED', (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    });

    // Listen for sync logs
    socketInstance.on('SYNC_LOG_ENTRY', (logEntry) => {
      setSyncLogs((prevLogs) => [logEntry, ...prevLogs].slice(0, 100)); // Limit to last 100 logs
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
        return true;
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
    return false;
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      orders,
      products,
      syncLogs,
      fetchOrders,
      fetchProducts,
      updateOrderStatus,
      setProducts
    }}>
      {children}
    </SocketContext.Provider>
  );
};
