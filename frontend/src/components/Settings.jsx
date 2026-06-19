import React from 'react';

const Settings = () => {
  const webhooks = [
    { platform: 'HungerStation', url: 'http://localhost:5000/api/webhooks/hungerstation', method: 'POST' },
    { platform: 'Jahez', url: 'http://localhost:5000/api/webhooks/jahez', method: 'POST' },
    { platform: 'ToYou', url: 'http://localhost:5000/api/webhooks/toyou', method: 'POST' }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const curlHungerstation = `curl -X POST http://localhost:5000/api/webhooks/hungerstation \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "HS-998271",
    "customer": { "name": "Ahmad Al-Mansour" },
    "items": [
      { "name": "Spicy Chicken Burger", "quantity": 2, "price": 28.00 },
      { "name": "Seasoned French Fries", "quantity": 1, "price": 12.00 }
    ],
    "total": 68.00
  }'`;

  const curlJahez = `curl -X POST http://localhost:5000/api/webhooks/jahez \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderRef": "JZ-441209",
    "customerName": "Nouf Bin-Fahad",
    "orderItems": [
      { "itemName": "Truffle Wagyu Burger", "qty": 1, "itemPrice": 45.00 },
      { "itemName": "Coca Cola", "qty": 1, "itemPrice": 6.00 }
    ],
    "amountPaid": 51.00
  }'`;

  const curlToyou = `curl -X POST http://localhost:5000/api/webhooks/toyou \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference_id": "TY-773182",
    "delivery_details": { "client_name": "Sultan Al-Ghamdi" },
    "lines": [
      { "title": "Classic Angus Burger", "qty": 2, "unit_price": 32.00 }
    ],
    "grand_total": 64.00
  }'`;

  return (
    <div className="settings-container">
      <h2>Credentials & Integration Gateway</h2>
      <p className="description">
        Manage API credentials for the delivery channels and view public webhook listener endpoints.
      </p>

      <div className="settings-sections">
        {/* Credentials Form Section */}
        <div className="settings-card">
          <h3>Portal API Credentials</h3>
          <div className="credentials-list">
            <div className="credential-row">
              <div className="platform-header">
                <span className="platform-icon">🍔</span>
                <strong>HungerStation Integration</strong>
              </div>
              <div className="form-group">
                <label>Partner API Client Secret Key</label>
                <input type="password" value="••••••••••••••••••••••••••••" disabled />
              </div>
              <div className="form-group">
                <label>API Endpoint Base URL</label>
                <input type="text" value="https://api.partner.deliveryhero.com" disabled />
              </div>
            </div>

            <div className="credential-row">
              <div className="platform-header">
                <span className="platform-icon">⚡</span>
                <strong>Jahez Integration</strong>
              </div>
              <div className="form-group">
                <label>Merchant X-API-KEY</label>
                <input type="password" value="••••••••••••••••••••••••••••" disabled />
              </div>
              <div className="form-group">
                <label>API Endpoint Base URL</label>
                <input type="text" value="https://integration.jahez.net/api/v1" disabled />
              </div>
            </div>

            <div className="credential-row">
              <div className="platform-header">
                <span className="platform-icon">🎈</span>
                <strong>ToYou Integration</strong>
              </div>
              <div className="form-group">
                <label>Merchant Authorization Token</label>
                <input type="password" value="••••••••••••••••••••••••••••" disabled />
              </div>
              <div className="form-group">
                <label>API Endpoint Base URL</label>
                <input type="text" value="https://merchant-api.toyou.io/sync" disabled />
              </div>
            </div>
          </div>
          <div className="card-note">
            ⚠️ Credentials are set via backend environment variables (<code>.env</code>) to ensure security and prevent client-side exposure.
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="settings-card">
          <h3>Inbound Webhook Listeners</h3>
          <p className="card-desc">
            Provide these endpoints to HungerStation, Jahez, and ToYou partner portals to stream customer orders in real-time.
          </p>

          <div className="webhook-urls">
            {webhooks.map((wh) => (
              <div key={wh.platform} className="webhook-item">
                <div className="webhook-meta">
                  <span className="webhook-platform">{wh.platform}</span>
                  <span className="webhook-method">{wh.method}</span>
                </div>
                <div className="webhook-input-group">
                  <input type="text" value={wh.url} readOnly />
                  <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(wh.url)}>
                    📋 Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="developer-simulation">
            <h3>Developer Tutoring & Simulation</h3>
            <p className="card-desc">
              You can trigger mock orders locally by firing these HTTP POST requests in your terminal or API client (Postman/Insomnia) to simulate live delivery app orders.
            </p>

            <div className="simulation-commands">
              <div className="command-block">
                <h4>Simulate HungerStation Order</h4>
                <pre>{curlHungerstation}</pre>
                <button className="btn btn-secondary btn-sm btn-copy" onClick={() => copyToClipboard(curlHungerstation)}>
                  📋 Copy Curl
                </button>
              </div>

              <div className="command-block">
                <h4>Simulate Jahez Order</h4>
                <pre>{curlJahez}</pre>
                <button className="btn btn-secondary btn-sm btn-copy" onClick={() => copyToClipboard(curlJahez)}>
                  📋 Copy Curl
                </button>
              </div>

              <div className="command-block">
                <h4>Simulate ToYou Order</h4>
                <pre>{curlToyou}</pre>
                <button className="btn btn-secondary btn-sm btn-copy" onClick={() => copyToClipboard(curlToyou)}>
                  📋 Copy Curl
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
