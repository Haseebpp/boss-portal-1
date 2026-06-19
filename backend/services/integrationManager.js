import hungerstationAdapter from './adapters/hungerstationAdapter.js';
import jahezAdapter from './adapters/jahezAdapter.js';
import toyouAdapter from './adapters/toyouAdapter.js';

class IntegrationManager {
  constructor() {
    this.adapters = {
      hungerstation: hungerstationAdapter,
      jahez: jahezAdapter,
      toyou: toyouAdapter
    };
  }

  async syncProductToAllPlatforms(product, action = 'UPDATE') {
    const promises = Object.entries(this.adapters).map(async ([platform, adapter]) => {
      try {
        const result = await adapter.syncCatalogItem(product, action);
        return { platform, ...result };
      } catch (err) {
        return { platform, success: false, error: err.message };
      }
    });

    const results = await Promise.allSettled(promises);
    
    // Format the synchronization report
    const report = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      } else {
        const platforms = Object.keys(this.adapters);
        return {
          platform: platforms[index],
          success: false,
          error: 'Uncaught Promise error during adapter execution'
        };
      }
    });

    console.log(`[Integration Manager] Finished synchronization for action: ${action}. Report:`, report);
    return report;
  }

  async createProductOnAllPlatforms(product) {
    return this.syncProductToAllPlatforms(product, 'CREATE');
  }

  async updateProductOnAllPlatforms(product) {
    return this.syncProductToAllPlatforms(product, 'UPDATE');
  }

  async deleteProductFromAllPlatforms(product) {
    return this.syncProductToAllPlatforms(product, 'DELETE');
  }

  async syncOrderStatusUpdate(platform, externalOrderId, status) {
    const adapter = this.adapters[platform];
    if (!adapter) {
      throw new Error(`Unsupported delivery platform: ${platform}`);
    }
    return adapter.updateOrderStatus(externalOrderId, status);
  }
}

export default new IntegrationManager();
