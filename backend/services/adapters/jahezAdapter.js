import axios from 'axios';

class JahezAdapter {
  constructor() {
    this.apiKey = process.env.JAHEZ_API_KEY;
    this.apiUrl = process.env.JAHEZ_API_URL || 'https://integration.jahez.net/api/v1';
    this.simulate = process.env.SIMULATE_INTEGRATION === 'true';
  }

  async syncCatalogItem(product, action = 'UPDATE') {
    const isSyncEnabled = product.platformMappings?.jahez?.isSyncEnabled;
    if (!isSyncEnabled) {
      return { success: false, message: 'Sync disabled for Jahez', platform: 'jahez' };
    }

    const mapping = product.platformMappings?.jahez || {};
    const price = mapping.priceOverride !== null && mapping.priceOverride !== undefined 
      ? mapping.priceOverride 
      : product.price;

    // Jahez expects itemId / item_code and status
    const payload = {
      item_code: mapping.itemId || `jz-${product._id}`,
      menu_id: mapping.menuId || 'default_menu',
      name_en: product.name,
      price: price,
      status: product.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      operation: action === 'CREATE' ? 'ADD' : action === 'DELETE' ? 'REMOVE' : 'UPDATE'
    };

    console.log(`[Jahez API] Syncing product: ${product.name} (Action: ${action})`);

    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));
      
      console.log(`[Jahez SIMULATED RESPONSE] Payload sent successfully:`, JSON.stringify(payload, null, 2));
      
      return {
        success: true,
        platform: 'jahez',
        action: action,
        message: `Jahez item ${payload.item_code} successfully updated on menu ${payload.menu_id}.`
      };
    } else {
      try {
        const headers = {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        };

        const response = await axios.post(`${this.apiUrl}/menu/items`, payload, { headers });
        return {
          success: true,
          platform: 'jahez',
          action: action,
          data: response.data
        };
      } catch (error) {
        console.error(`[Jahez API ERROR]`, error.response?.data || error.message);
        return {
          success: false,
          platform: 'jahez',
          error: error.response?.data || error.message
        };
      }
    }
  }

  async createProduct(product) {
    return this.syncCatalogItem(product, 'CREATE');
  }

  async updateProduct(product) {
    return this.syncCatalogItem(product, 'UPDATE');
  }

  async deleteProduct(product) {
    return this.syncCatalogItem(product, 'DELETE');
  }

  async updateOrderStatus(externalOrderId, status) {
    console.log(`[Jahez API] Updating order ${externalOrderId} status to: ${status}`);
    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, platform: 'jahez', status };
    } else {
      try {
        const headers = { 'X-API-KEY': this.apiKey };
        const jzStatus = status === 'preparing' ? 'CONFIRMED' : status === 'dispatched' ? 'PICKED_UP' : status === 'cancelled' ? 'CANCELLED' : 'DELIVERED';
        const response = await axios.post(`${this.apiUrl}/orders/${externalOrderId}/status`, { status: jzStatus }, { headers });
        return { success: true, platform: 'jahez', data: response.data };
      } catch (error) {
        console.error(`[Jahez API ERROR]`, error.message);
        return { success: false, platform: 'jahez', error: error.message };
      }
    }
  }
}

export default new JahezAdapter();
