import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const ProductModal = ({ product, isOpen, onClose }) => {
  const { setProducts } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState('hungerstation');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // HungerStation states
  const [hsSync, setHsSync] = useState(true);
  const [hsId, setHsId] = useState('');
  const [hsCatId, setHsCatId] = useState('');
  const [hsPrice, setHsPrice] = useState('');

  // Jahez states
  const [jzSync, setJzSync] = useState(true);
  const [jzId, setJzId] = useState('');
  const [jzMenuId, setJzMenuId] = useState('');
  const [jzPrice, setJzPrice] = useState('');

  // ToYou states
  const [tySync, setTySync] = useState(true);
  const [tyId, setTyId] = useState('');
  const [tyPrice, setTyPrice] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price || 0);
      setCategory(product.category || '');
      setIsAvailable(product.isAvailable !== false);

      const hs = product.platformMappings?.hungerstation || {};
      setHsSync(hs.isSyncEnabled !== false);
      setHsId(hs.productId || '');
      setHsCatId(hs.categoryId || '');
      setHsPrice(hs.priceOverride !== null && hs.priceOverride !== undefined ? hs.priceOverride : '');

      const jz = product.platformMappings?.jahez || {};
      setJzSync(jz.isSyncEnabled !== false);
      setJzId(jz.itemId || '');
      setJzMenuId(jz.menuId || '');
      setJzPrice(jz.priceOverride !== null && jz.priceOverride !== undefined ? jz.priceOverride : '');

      const ty = product.platformMappings?.toyou || {};
      setTySync(ty.isSyncEnabled !== false);
      setTyId(ty.itemId || '');
      setTyPrice(ty.priceOverride !== null && ty.priceOverride !== undefined ? ty.priceOverride : '');
    } else {
      // Set defaults for new item
      setName('');
      setDescription('');
      setPrice(0);
      setCategory('');
      setIsAvailable(true);

      setHsSync(true);
      setHsId('');
      setHsCatId('hs-category-1');
      setHsPrice('');

      setJzSync(true);
      setJzId('');
      setJzMenuId('jz-menu-1');
      setJzPrice('');

      setTySync(true);
      setTyId('');
      setTyPrice('');
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      description,
      price: Number(price),
      category,
      isAvailable,
      platformMappings: {
        hungerstation: {
          productId: hsId,
          categoryId: hsCatId,
          priceOverride: hsPrice === '' ? null : Number(hsPrice),
          isSyncEnabled: hsSync
        },
        jahez: {
          itemId: jzId,
          menuId: jzMenuId,
          priceOverride: jzPrice === '' ? null : Number(jzPrice),
          isSyncEnabled: jzSync
        },
        toyou: {
          itemId: tyId,
          priceOverride: tyPrice === '' ? null : Number(tyPrice),
          isSyncEnabled: tySync
        }
      }
    };

    try {
      const url = product 
        ? `http://localhost:5000/api/products/${product._id}`
        : 'http://localhost:5000/api/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedProduct = await res.json();
        if (product) {
          setProducts((prev) => prev.map((p) => (p._id === savedProduct._id ? savedProduct : p)));
        } else {
          setProducts((prev) => [savedProduct, ...prev]);
        }
        onClose();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message || 'Failed to save product'}`);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Network error while saving product');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{product ? 'Edit Menu Item 🍔' : 'Add Menu Item 🍔'}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row-group">
            {/* Left Column: Basic Details */}
            <div className="form-column">
              <h4>Core Information</h4>
              <div className="form-group">
                <label>Item Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g., Spicy Chicken Burger"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  required 
                  placeholder="e.g., Burgers, Sides, Drinks"
                />
              </div>

              <div className="form-group">
                <label>Base Price (SAR) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="3" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe ingredients, allergens, size details..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="checkbox-label">Available for ordering</span>
              </div>
            </div>

            {/* Right Column: Platform Mappings */}
            <div className="form-column">
              <h4>Platform Integrations</h4>
              <div className="platform-tabs">
                <button
                  type="button"
                  className={`tab-item ${activeSubTab === 'hungerstation' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('hungerstation')}
                >
                  HungerStation
                </button>
                <button
                  type="button"
                  className={`tab-item ${activeSubTab === 'jahez' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('jahez')}
                >
                  Jahez
                </button>
                <button
                  type="button"
                  className={`tab-item ${activeSubTab === 'toyou' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('toyou')}
                >
                  ToYou
                </button>
              </div>

              <div className="tab-pane-content">
                {activeSubTab === 'hungerstation' && (
                  <div className="integration-form-fields">
                    <div className="form-group checkbox-group">
                      <input 
                        type="checkbox" 
                        id="hs-sync-chk" 
                        checked={hsSync} 
                        onChange={(e) => setHsSync(e.target.checked)}
                      />
                      <label htmlFor="hs-sync-chk">Enable HungerStation Sync</label>
                    </div>

                    <div className="form-group">
                      <label>HungerStation SKU / Product ID</label>
                      <input 
                        type="text" 
                        value={hsId} 
                        onChange={(e) => setHsId(e.target.value)} 
                        placeholder="e.g., hs-spicy-burger-99"
                        disabled={!hsSync}
                      />
                    </div>

                    <div className="form-group">
                      <label>HungerStation Category ID</label>
                      <input 
                        type="text" 
                        value={hsCatId} 
                        onChange={(e) => setHsCatId(e.target.value)} 
                        placeholder="e.g., hs-category-burgers"
                        disabled={!hsSync}
                      />
                    </div>

                    <div className="form-group">
                      <label>Price Override (SAR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={hsPrice} 
                        onChange={(e) => setHsPrice(e.target.value)} 
                        placeholder="Leave empty to use base price"
                        disabled={!hsSync}
                      />
                    </div>
                  </div>
                )}

                {activeSubTab === 'jahez' && (
                  <div className="integration-form-fields">
                    <div className="form-group checkbox-group">
                      <input 
                        type="checkbox" 
                        id="jz-sync-chk" 
                        checked={jzSync} 
                        onChange={(e) => setJzSync(e.target.checked)}
                      />
                      <label htmlFor="jz-sync-chk">Enable Jahez Sync</label>
                    </div>

                    <div className="form-group">
                      <label>Jahez Item ID / Code</label>
                      <input 
                        type="text" 
                        value={jzId} 
                        onChange={(e) => setJzId(e.target.value)} 
                        placeholder="e.g., jz-item-10293"
                        disabled={!jzSync}
                      />
                    </div>

                    <div className="form-group">
                      <label>Jahez Menu ID</label>
                      <input 
                        type="text" 
                        value={jzMenuId} 
                        onChange={(e) => setJzMenuId(e.target.value)} 
                        placeholder="e.g., jz-menu-main"
                        disabled={!jzSync}
                      />
                    </div>

                    <div className="form-group">
                      <label>Price Override (SAR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={jzPrice} 
                        onChange={(e) => setJzPrice(e.target.value)} 
                        placeholder="Leave empty to use base price"
                        disabled={!jzSync}
                      />
                    </div>
                  </div>
                )}

                {activeSubTab === 'toyou' && (
                  <div className="integration-form-fields">
                    <div className="form-group checkbox-group">
                      <input 
                        type="checkbox" 
                        id="ty-sync-chk" 
                        checked={tySync} 
                        onChange={(e) => setTySync(e.target.checked)}
                      />
                      <label htmlFor="ty-sync-chk">Enable ToYou Sync</label>
                    </div>

                    <div className="form-group">
                      <label>ToYou Merchant Item ID</label>
                      <input 
                        type="text" 
                        value={tyId} 
                        onChange={(e) => setTyId(e.target.value)} 
                        placeholder="e.g., ty-burger-spicy"
                        disabled={!tySync}
                      />
                    </div>

                    <div className="form-group">
                      <label>Price Override (SAR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={tyPrice} 
                        onChange={(e) => setTyPrice(e.target.value)} 
                        placeholder="Leave empty to use base price"
                        disabled={!tySync}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
