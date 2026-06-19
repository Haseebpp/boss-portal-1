import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const MenuMatrix = ({ onEditProduct, onAddProduct }) => {
  const { products, setProducts } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories list
  const categories = ['All', ...new Set(products.map((p) => p.category))];

  // Toggle availability state
  const handleToggleAvailability = async (product) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable: !product.isAvailable })
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this menu item from the system and sync deletion to all active platforms?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="menu-matrix-container">
      <div className="matrix-header">
        <div>
          <h2>Menu Matrix</h2>
          <span className="subtitle">Master Catalog & Platform Mapping Control</span>
        </div>
        <button className="btn btn-primary" onClick={onAddProduct}>
          ＋ Add New Item
        </button>
      </div>

      <div className="matrix-filters">
        <div className="search-box">
          🔍 <input 
            type="text" 
            placeholder="Search items by name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Item details</th>
              <th>Base Price</th>
              <th>Category</th>
              <th>In Kitchen Status</th>
              <th>HungerStation Sync</th>
              <th>Jahez Sync</th>
              <th>ToYou Sync</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-placeholder">
                  No products found. Use "Add New Item" to populate your menu.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const hs = product.platformMappings?.hungerstation || {};
                const jz = product.platformMappings?.jahez || {};
                const ty = product.platformMappings?.toyou || {};

                return (
                  <tr key={product._id} className={product.isAvailable ? '' : 'row-unavailable'}>
                    <td className="cell-details">
                      <div className="product-info">
                        <strong>{product.name}</strong>
                        <p>{product.description || 'No description provided'}</p>
                      </div>
                    </td>
                    <td>
                      <span className="base-price">SAR {product.price.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="category-badge">{product.category}</span>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={product.isAvailable}
                          onChange={() => handleToggleAvailability(product)}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className={`availability-text ${product.isAvailable ? 'available' : 'unavailable'}`}>
                        {product.isAvailable ? 'Serving' : 'Suspended'}
                      </span>
                    </td>
                    
                    {/* HungerStation Mapping */}
                    <td className="cell-sync">
                      <span className={`sync-badge ${hs.isSyncEnabled && hs.productId ? 'active' : 'inactive'}`}>
                        {hs.isSyncEnabled && hs.productId ? '● Active' : '○ Inactive'}
                      </span>
                      {hs.isSyncEnabled && hs.productId && (
                        <div className="sync-details">
                          <span>ID: {hs.productId}</span>
                          {hs.priceOverride !== null && hs.priceOverride !== undefined && (
                            <span className="override-price">Override: SAR {hs.priceOverride.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Jahez Mapping */}
                    <td className="cell-sync">
                      <span className={`sync-badge ${jz.isSyncEnabled && jz.itemId ? 'active' : 'inactive'}`}>
                        {jz.isSyncEnabled && jz.itemId ? '● Active' : '○ Inactive'}
                      </span>
                      {jz.isSyncEnabled && jz.itemId && (
                        <div className="sync-details">
                          <span>ID: {jz.itemId}</span>
                          {jz.priceOverride !== null && jz.priceOverride !== undefined && (
                            <span className="override-price">Override: SAR {jz.priceOverride.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ToYou Mapping */}
                    <td className="cell-sync">
                      <span className={`sync-badge ${ty.isSyncEnabled && ty.itemId ? 'active' : 'inactive'}`}>
                        {ty.isSyncEnabled && ty.itemId ? '● Active' : '○ Inactive'}
                      </span>
                      {ty.isSyncEnabled && ty.itemId && (
                        <div className="sync-details">
                          <span>ID: {ty.itemId}</span>
                          {ty.priceOverride !== null && ty.priceOverride !== undefined && (
                            <span className="override-price">Override: SAR {ty.priceOverride.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditProduct(product)}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuMatrix;
