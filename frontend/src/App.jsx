import React, { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import OrderBoard from './components/OrderBoard';
import MenuMatrix from './components/MenuMatrix';
import ActivityLog from './components/ActivityLog';
import Settings from './components/Settings';
import ProductModal from './components/ProductModal';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="app-layout">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="app-main-content">
        {activeTab === 'orders' && <OrderBoard />}
        {activeTab === 'menu' && (
          <MenuMatrix 
            onEditProduct={handleEditProduct} 
            onAddProduct={handleAddProduct} 
          />
        )}
        {activeTab === 'activity' && <ActivityLog />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
