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

  return new Promise((resolve) => {
    const targetUrl = `https://api.sellauth.com/v1/shops/${SHOP_ID}/products`;
    const parsed = new URL(targetUrl);

    const clientReq = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Claude-Cheats-Portal/1.0'
      }
    }, (clientRes) => {
      let data = '';
      clientRes.on('data', chunk => { data += chunk; });
      clientRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = clientRes.statusCode || 200;
        res.end(data);
        resolve();
      });
    });

    clientReq.on('error', (err) => {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to fetch SellAuth products', details: err.message }));
      resolve();
    });

    clientReq.end();
  });
};
