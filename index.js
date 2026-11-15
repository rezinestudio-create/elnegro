const https = require('https');
const url = require('url');

const SHOP_ID = '207573';
const API_KEY = '6342749|MFAy03lhFM6tAVnk4qGBQ4UqlC8IiDAZNWRZLixh29eab68c';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571572812400038170/r3s_xg4dzCpicQqfiBUHIyp93srknslnhCgIVmjCTMW1cuBMkp2jwhfxyrlATHpzSVwx';

function sendDiscordWebhook(data, appId) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(DISCORD_WEBHOOK_URL);
      const postData = JSON.stringify({
        username: 'Claude Cheats Reseller Bot',
        avatar_url: 'https://api.sellauth.com/storage/images/1271087.webp',
        embeds: [
          {
            title: '🚀 New Wholesale Reseller Application',
            color: 0xff6b00,
            description: 'A new reseller partnership application was submitted via the storefront.',
            fields: [
              { name: 'Application ID', value: `\`${appId}\``, inline: true },
              { name: 'Discord Username', value: data.discord ? `\`${data.discord}\`` : 'Not provided', inline: true },
              { name: 'Storefront / Channel URL', value: data.storeUrl || 'None', inline: false },
              { name: 'Expected Monthly Volume', value: data.volume || 'Not specified', inline: true },
              { name: 'Target Software Titles', value: data.titles || 'All Software', inline: true },
              { name: 'Notes & Experience', value: data.notes || 'None provided', inline: false }
            ],
            footer: {
              text: 'Claude Cheats · Automated Reseller System'
            },
            timestamp: new Date().toISOString()
          }
        ]
      });

      const postReq = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (postRes) => {
        postRes.on('data', () => {});
        postRes.on('end', () => resolve(true));
      });

      postReq.on('error', (err) => {
        console.error('[DISCORD WEBHOOK ERROR]', err.message);
        resolve(false);
      });

      postReq.write(postData);
      postReq.end();
    } catch (err) {
      console.error('[DISCORD WEBHOOK EXCEPTION]', err.message);
      resolve(false);
    }
  });
}

function fetchSellAuth(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const targetUrl = `https://api.sellauth.com/v1/shops/${SHOP_ID}${endpoint}`;
    const parsed = new URL(targetUrl);
    
    const reqOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Claude-Cheats-Portal/1.0',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function readRequestBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch (e) {
        return resolve({});
      }
    }
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Products List
  if (pathname === '/api/products' || pathname.endsWith('/products')) {
    try {
      const response = await fetchSellAuth('/products?include=images,variants');
      if (response.data && Array.isArray(response.data.data)) {
        const sellauthProds = response.data.data.map(p => {
          const img = (p.images && p.images.length > 0 && p.images[0].url) ? p.images[0].url : null;
          const minPrice = (p.variants && p.variants.length > 0)
            ? Math.min(...p.variants.map(v => parseFloat(v.price || 0)))
            : parseFloat(p.price || 6.00);

          return {
            id: p.id,
            name: p.name,
            category: (p.category && p.category.name) || 'Software',
            status: p.status_text || 'Undetected',
            status_text: p.status_text || 'Undetected',
            status_color: p.status_color || '#10b981',
            image: img || '/assets/1058939.webp',
            images: p.images || [],
            price: minPrice,
            stock: p.stock_count !== undefined ? p.stock_count : (p.stock || 1),
            featured: true,
            bestseller: true,
            description: p.description || '',
            desc: p.description || 'Instant automated SellAuth key delivery and loader download.',
            features: [
              'Instant Automated Key Delivery',
              'Windows 10 / 11 All Builds Supported',
              'Kernel-Level Ring-0 Protection',
              'Live Customer & Invoice Support'
            ],
            variants: (p.variants && p.variants.length > 0) ? p.variants.map(v => ({
              id: v.id,
              name: v.name || 'Access',
              price: parseFloat(v.price || 0)
            })) : [{ id: 'default', name: 'Standard Access', price: minPrice }],
            updated_at: p.updated_at
          };
        });

        res.writeHead(200);
        res.end(JSON.stringify({ source: 'sellauth', data: sellauthProds }));
        return;
      }
    } catch (err) {
      console.error('API Products Error:', err);
    }
    res.writeHead(200);
    res.end(JSON.stringify({ source: 'sellauth', data: [] }));
    return;
  }

  // 2. Status Check
  if (pathname === '/api/status' || pathname.endsWith('/status')) {
    let stats = null;
    let sellauthProducts = [];
    try {
      const resp = await fetchSellAuth('/stats');
      stats = resp.data;
    } catch (e) {}

    try {
      const prodResp = await fetchSellAuth('/products?include=images,variants');
      if (prodResp.data && Array.isArray(prodResp.data.data)) {
        sellauthProducts = prodResp.data.data.map(p => ({
          id: p.id,
          name: p.name,
          category: (p.category && p.category.name) || 'Software',
          status: p.status_text || 'Undetected',
          status_text: p.status_text || 'Undetected',
          status_color: p.status_color || '#10b981',
          image: (p.images && p.images.length > 0 && p.images[0].url) ? p.images[0].url : '/assets/1058939.webp',
          stock: p.stock_count !== undefined ? p.stock_count : (p.stock || 'In Stock'),
          updated_at: p.updated_at
        }));
      }
    } catch (e) {
      console.error('API Status Products Error:', e);
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'online',
      uptime: '99.98%',
      serverTime: new Date().toISOString(),
      sellauth: {
        connected: true,
        shopId: SHOP_ID,
        storeName: 'Claude Cheats',
        stats: stats || { products_sold: 6, total_customers: 6, average_rating: 5 }
      },
      sellauthProducts: sellauthProducts,
      services: [
        { name: 'Ring-0 Hypervisor Kernel Driver', status: 'Undetected', status_color: '#10b981', version: 'v4.1.8', anticheats: 'Kernel Integrity' },
        { name: 'Anti-Cheat Detection Watchdog', status: 'Undetected', status_color: '#10b981', version: 'v3.2.0', anticheats: 'EAC / BattlEye / Vanguard' },
        { name: 'Automated Key Delivery Engine', status: 'OPERATIONAL', status_color: '#10b981', version: 'Instant (< 5s)', anticheats: 'Automated Webhook' },
        { name: 'Payment Verification Gateways', status: 'ACTIVE', status_color: '#10b981', version: 'Cash App / Stripe / Crypto', anticheats: 'Autonomous' },
        { name: 'HWID Virtualization Engine', status: 'Undetected', status_color: '#10b981', version: 'v5.0.2', anticheats: 'Ring-0 EFI' }
      ]
    }));
    return;
  }

  // 3. Payment Methods
  if (pathname === '/api/payment-methods' || pathname.endsWith('/payment-methods')) {
    try {
      const response = await fetchSellAuth('/payment-methods');
      if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        res.writeHead(200);
        res.end(JSON.stringify(response.data));
        return;
      }
    } catch (err) {}
    res.writeHead(200);
    res.end(JSON.stringify({
      data: [
        { name: 'Cash App', type: 'CASHAPP', is_active: true, fee: '0%' },
        { name: 'Stripe (Cards / Apple Pay / Google Pay)', type: 'STRIPE', is_active: true, fee: '0%' },
        { name: 'PayPal (Friends & Family)', type: 'PAYPALFF', is_active: true, fee: '0%' },
        { name: 'Cryptocurrency (BTC, ETH, LTC, SOL, USDT)', type: 'CRYPTO', is_active: true, fee: '0%' },
        { name: 'Customer Balance', type: 'CUSTOMERBALANCE', is_active: true, fee: '0%' }
      ]
    }));
    return;
  }

  // 3.5. Checkout Endpoint
  if (pathname === '/api/checkout' || pathname.endsWith('/checkout')) {
    try {
      const payload = await readRequestBody(req);
      const postData = JSON.stringify({
        email: payload.email,
        coupon: payload.coupon || undefined,
        cart: payload.cart
      });

      const response = await fetchSellAuth('/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        body: postData
      });

      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
      res.end(typeof response.data === 'object' ? JSON.stringify(response.data) : (response.raw || '{}'));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 4. Invoices Lookup
  if (pathname === '/api/invoices/lookup' || pathname.endsWith('/invoices/lookup')) {
    try {
      const payload = await readRequestBody(req);
      const query = (payload.query || '').trim().toLowerCase();

      if (!query) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Please provide an email or Invoice ID' }));
        return;
      }

      const response = await fetchSellAuth('/invoices?per_page=100');
      const allInvoices = (response.data && response.data.data) ? response.data.data : [];

      const matched = allInvoices.filter(inv => {
        const emailMatch = inv.email && inv.email.toLowerCase().includes(query);
        const idMatch = String(inv.id).includes(query) || (inv.unique_id && inv.unique_id.toLowerCase().includes(query));
        return emailMatch || idMatch;
      });

      res.writeHead(200);
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
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to query invoices', details: e.message }));
    }
    return;
  }

  // 5. Reseller Application
  if (pathname === '/api/reseller/apply' || pathname.endsWith('/reseller/apply')) {
    try {
      const data = await readRequestBody(req);
      console.log('[RESELLER APPLICATION RECEIVED]', data);
      const appId = 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      await sendDiscordWebhook(data, appId);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        applicationId: appId,
        message: 'Application recorded and forwarded to our Discord team! Join discord.gg/cla-ude to finalize.'
      }));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid application payload' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
};
