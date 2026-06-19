import axios from 'axios';

class HungerStationAdapter {
  constructor() {
    this.apiKey = process.env.HUNGERSTATION_API_KEY;
    this.apiUrl = process.env.HUNGERSTATION_API_URL || 'https://api.partner.deliveryhero.com';
    this.simulate = process.env.SIMULATE_INTEGRATION === 'true';
  }

  async syncCatalogItem(product, action = 'UPDATE') {
    const isSyncEnabled = product.platformMappings?.hungerstation?.isSyncEnabled;
    if (!isSyncEnabled) {
      return { success: false, message: 'Sync disabled for HungerStation', platform: 'hungerstation' };
    }

    const mapping = product.platformMappings?.hungerstation || {};
    const price = mapping.priceOverride !== null && mapping.priceOverride !== undefined 
      ? mapping.priceOverride 
      : product.price;

    const payload = {
      sku: mapping.productId || `hs-${product._id}`,
      name: product.name,
      description: product.description || '',
      price: price,
      categoryId: mapping.categoryId || 'default_cat',
      is_active: product.isAvailable,
      action: action
    };

    console.log(`[HungerStation API] Syncing product: ${product.name} (Action: ${action})`);

    if (this.simulate) {
      // Simulate network latency (500 - 1500 ms)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      console.log(`[HungerStation SIMULATED RESPONSE] Payload sent successfully:`, JSON.stringify(payload, null, 2));
      
      return {
        success: true,
        platform: 'hungerstation',
        action: action,
        jobId: `hs-job-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        status: 'QUEUED',
        message: 'Catalog update queued successfully in Delivery Hero partner systems.'
      };
    } else {
      // Real API implementation
      try {
        const headers = {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        };

        const response = await axios.post(`${this.apiUrl}/catalog/products`, payload, { headers });
        return {
          success: true,
          platform: 'hungerstation',
          action: action,
          jobId: response.data.job_id,
          status: response.data.status || 'QUEUED',
          data: response.data
        };
      } catch (error) {
        console.error(`[HungerStation API ERROR]`, error.response?.data || error.message);
        return {
          success: false,
          platform: 'hungerstation',
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

  // Update order status back to HungerStation
  async updateOrderStatus(externalOrderId, status) {
    console.log(`[HungerStation API] Updating order ${externalOrderId} status to: ${status}`);
    if (this.simulate) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, platform: 'hungerstation', status };
    } else {
      try {
        const headers = { 'Authorization': `Bearer ${this.apiKey}` };
        const hsStatus = status === 'preparing' ? 'ACCEPTED' : status === 'dispatched' ? 'DISPATCHED' : status === 'cancelled' ? 'REJECTED' : 'DELIVERED';
        const response = await axios.put(`${this.apiUrl}/orders/${externalOrderId}/status`, { status: hsStatus }, { headers });
        return { success: true, platform: 'hungerstation', data: response.data };
      } catch (error) {
        console.error(`[HungerStation API ERROR]`, error.message);
        return { success: false, platform: 'hungerstation', error: error.message };
      }
    }
  }
}

export default new HungerStationAdapter();
