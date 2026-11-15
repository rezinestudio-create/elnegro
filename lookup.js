const https = require('https');

const SHOP_ID = '207573';
const API_KEY = '6342749|MFAy03lhFM6tAVnk4qGBQ4UqlC8IiDAZNWRZLixh29eab68c';

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const payload = await readBody(req);
    const query = (payload.query || '').trim().toLowerCase();

    if (!query) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Please provide an email or Invoice ID' }));
    }

    const invoicesRes = await new Promise((resolve, reject) => {
      https.get(`https://api.sellauth.com/v1/shops/${SHOP_ID}/invoices?per_page=100`, {
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

    const allInvoices = (invoicesRes.data && Array.isArray(invoicesRes.data)) ? invoicesRes.data : [];
    const matched = allInvoices.filter(inv => {
      const emailMatch = inv.email && inv.email.toLowerCase().includes(query);
      const idMatch = String(inv.id).includes(query) || (inv.unique_id && inv.unique_id.toLowerCase().includes(query));
      return emailMatch || idMatch;
    });

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      count: matched.length,
      invoices: matched.slice(0, 10).map(inv => ({
        id: inv.id,
        unique_id: inv.unique_id,
        status: inv.status,
        price: inv.price,
        currency: inv.currency,
        gateway: (inv.payment_method && inv.payment_method.name) || inv.gateway,
        created_at: inv.created_at,
        completed_at: inv.completed_at,
        email: inv.email ? inv.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) : 'N/A'
      }))
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to query invoices', details: err.message }));
  }
};
