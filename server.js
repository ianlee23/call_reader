import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow CORS from your Shopify storefront domain
app.use(cors({
  origin: 'https://businessgenie.biz',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('✅ Shopify Metafield Updater is running.');
});

app.post('/api/mark-call-read', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ success: false, error: 'Missing customer_id or call_id' });
  }

  const shop = process.env.SHOPIFY_DOMAIN; // e.g. mystore.myshopify.com
  const accessToken = process.env.ADMIN_API_ACCESS_TOKEN;
  const metafieldNamespace = 'calls';
  const metafieldKey = 'read_call_ids';

  const metafieldUrl = `https://${shop}/admin/api/2024-01/customers/${customer_id}/metafields.json`;

  try {
    // 1. Get existing metafields
    const response = await fetch(`${metafieldUrl}?namespace=${metafieldNamespace}&key=${metafieldKey}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    let metafield = data.metafields?.[0];
    let updatedIds = [];

    if (metafield) {
      const existingIds = JSON.parse(metafield.value || '[]');
      if (!existingIds.includes(call_id)) {
        updatedIds = [...existingIds, call_id];
      } else {
        updatedIds = existingIds; // Already marked
      }
    } else {
      // Metafield doesn't exist yet
      updatedIds = [call_id];
    }

    const payload = {
      metafield: {
        namespace: metafieldNamespace,
        key: metafieldKey,
        type: 'json',
        value: JSON.stringify(updatedIds),
      },
    };

    const method = metafield ? 'PUT' : 'POST';
    const targetUrl = metafield
      ? `https://${shop}/admin/api/2024-01/metafields/${metafield.id}.json`
      : metafieldUrl;

    const saveResponse = await fetch(targetUrl, {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const saveResult = await saveResponse.json();

    res.json({ success: true, updated: updatedIds, saved: saveResult });
  } catch (err) {
    console.error('Error marking call as read:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
