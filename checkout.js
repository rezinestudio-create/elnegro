const https = require('https');

const SHOP_ID = '207573';
const API_KEY = '6342749|MFAy03lhFM6tAVnk4qGBQ4UqlC8IiDAZNWRZLixh29eab68c';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    await new Promise(resolve => req.on('end', resolve));

    let payload = {};
    try {
      payload = JSON.parse(body || '{}');
    } catch (e) {
      payload = {};
    }

    if (!payload.email || !payload.cart || !Array.isArray(payload.cart) || payload.cart.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'A valid email and non-empty cart are required.' }));
    }

    const postData = JSON.stringify({
      email: payload.email,
      coupon: payload.coupon || undefined,
      cart: payload.cart
    });

    const sellauthRes = await new Promise((resolve, reject) => {
      const clientReq = https.request({
        hostname: 'api.sellauth.com',
        path: `/v1/shops/${SHOP_ID}/checkout`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (clientRes) => {
        let d = '';
        clientRes.on('data', chunk => { d += chunk; });
        clientRes.on('end', () => resolve({ status: clientRes.statusCode, data: d }));
      });
      clientReq.on('error', reject);
      clientReq.write(postData);
      clientReq.end();
    });

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = sellauthRes.status || 200;
    res.end(sellauthRes.data);
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
};
