import axios from 'axios';

class ToYouAdapter {
  constructor() {
    this.apiKey = process.env.TOYOU_API_KEY;
    this.apiUrl = process.env.TOYOU_API_URL || 'https://merchant-api.toyou.io/sync';
    this.simulate = process.env.SIMULATE_INTEGRATION === 'true';
  }

  async syncCatalogItem(product, action = 'UPDATE') {
    const isSyncEnabled = product.platformMappings?.toyou?.isSyncEnabled;
    if (!isSyncEnabled) {
      return { success: false, message: 'Sync disabled for ToYou', platform: 'toyou' };
    }

    const mapping = product.platformMappings?.toyou || {};
    const price = mapping.priceOverride !== null && mapping.priceOverride !== undefined 
      ? mapping.priceOverride 
      : product.price;

    const payload = {
      merchant_item_id: mapping.itemId || `ty-${product._id}`,
      title: product.name,
      price: price,
      status: product.isAvailable ? 'ACTIVE' : 'INACTIVE',
      sync_action: action
    };

    console.log(`[ToYou API] Syncing product: ${product.name} (Action: ${action})`);

    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 900));
      
      console.log(`[ToYou SIMULATED RESPONSE] Payload sent successfully:`, JSON.stringify(payload, null, 2));
      
      return {
        success: true,
        platform: 'toyou',
        action: action,
        message: `ToYou item ${payload.merchant_item_id} synchronized successfully.`
      };
    } else {
      try {
        const headers = {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        };

        const response = await axios.post(`${this.apiUrl}/items`, payload, { headers });
        return {
          success: true,
          platform: 'toyou',
          action: action,
          data: response.data
        };
      } catch (error) {
        console.error(`[ToYou API ERROR]`, error.response?.data || error.message);
        return {
          success: false,
          platform: 'toyou',
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
    console.log(`[ToYou API] Updating order ${externalOrderId} status to: ${status}`);
    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, platform: 'toyou', status };
    } else {
      try {
        const headers = { 'Authorization': `Bearer ${this.apiKey}` };
        const tyStatus = status === 'preparing' ? 'PREPARING' : status === 'dispatched' ? 'DISPATCHED' : status === 'cancelled' ? 'CANCELLED' : 'DELIVERED';
        const response = await axios.post(`${this.apiUrl}/orders/${externalOrderId}/status`, { status: tyStatus }, { headers });
        return { success: true, platform: 'toyou', data: response.data };
      } catch (error) {
        console.error(`[ToYou API ERROR]`, error.message);
        return { success: false, platform: 'toyou', error: error.message };
      }
    }
  }
}

export default new ToYouAdapter();
