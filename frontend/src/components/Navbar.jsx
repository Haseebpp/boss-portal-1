import React from 'react';
import { useSocket } from '../context/SocketContext';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { isConnected, orders, products } = useSocket();

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="Bozz Logo" className="navbar-logo-img" />
        <div>
          <h1>BozzPortal</h1>
          <span className="subtitle">Unified Delivery Hub</span>
        </div>
      </div>

      <div className="navbar-menu">
        <button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📥 Orders Board
          {activeOrdersCount > 0 && (
            <span className="badge badge-alert">{activeOrdersCount}</span>
          )}
        </button>
        <button 
          className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🍔 Menu Matrix
          <span className="badge badge-neutral">{products.length}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📜 Activity Log
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Credentials
        </button>
      </div>

      <div className="navbar-status">
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isConnected ? 'System Live' : 'Connecting...'}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
