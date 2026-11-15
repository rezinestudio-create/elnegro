const https = require('https');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571572812400038170/r3s_xg4dzCpicQqfiBUHIyp93srknslnhCgIVmjCTMW1cuBMkp2jwhfxyrlATHpzSVwx';

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const data = await readBody(req);
    const appId = 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    await sendDiscordWebhook(data, appId);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      applicationId: appId,
      message: 'Application recorded and forwarded to our Discord team! Join discord.gg/cla-ude to finalize.'
    }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Failed to process application', details: err.message }));
  }
};
