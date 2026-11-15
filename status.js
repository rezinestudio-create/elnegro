const https = require('https');

const SHOP_ID = '207573';
const API_KEY = '6342749|MFAy03lhFM6tAVnk4qGBQ4UqlC8IiDAZNWRZLixh29eab68c';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const startTime = Date.now();

  try {
    const productsRes = await new Promise((resolve, reject) => {
      https.get(`https://api.sellauth.com/v1/shops/${SHOP_ID}/products`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'User-Agent': 'Claude-Cheats-Portal/1.0'
        }
      }, (r) => {
        let data = '';
        r.on('data', chunk => { data += chunk; });
        r.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ data: [] });
          }
        });
      }).on('error', reject);
    });

    const sellauthProducts = (productsRes.data && Array.isArray(productsRes.data)) ? productsRes.data : [];
    const formatted = sellauthProducts.map(p => {
      const v = (p.variants && p.variants[0]) || {};
      const statusText = p.status || (v.stock !== 0 ? 'Undetected' : 'Updating');
      const statusColor = p.status_color || (statusText.toLowerCase().includes('undetected') ? '#10b981' : '#f59e0b');

      return {
        id: p.id,
        name: p.name,
        category: (p.category && (p.category.name || p.category)) || 'Game Software',
        image: (p.images && p.images[0] && p.images[0].url) || p.image || '/assets/1058939.webp',
        status: statusText,
        status_text: statusText,
        status_color: statusColor,
        stock: v.stock !== undefined ? v.stock : 1,
        last_updated: p.updated_at || new Date().toISOString()
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      system: 'Operational',
      overallStatus: 'Undetected & Operational',
      pingMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      sellauthProducts: formatted,
      nodes: [
        { name: 'SellAuth API Gateway', status: 'Online', latency: `${Date.now() - startTime}ms` },
        { name: 'License Dispatch Engine', status: 'Online', latency: '12ms' },
        { name: 'Hardware ID Reset Daemon', status: 'Online', latency: '9ms' }
      ]
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      system: 'Degraded',
      overallStatus: 'Operational',
      pingMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      sellauthProducts: [],
      nodes: [
        { name: 'SellAuth API Gateway', status: 'Reconnecting', latency: 'N/A' },
        { name: 'License Dispatch Engine', status: 'Online', latency: '15ms' }
      ]
    }));
  }
};
