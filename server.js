import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

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
  const metafieldNamespace = 'custom';
  const metafieldKey = 'read_messages';

  const metafieldUrl = `https://${shop}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    // 1. Get existing metafields filtered by namespace and key
    const response = await fetch(`${metafieldUrl}?namespace=${metafieldNamespace}&key=${metafieldKey}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching metafields:', data);
      return res.status(response.status).json({ success: false, error: 'Failed to fetch metafields', details: data });
    }

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
        type: 'list.single_line_text_field',
        value: updatedIds.join(','), // ✅ Fix is here
      },
    };


    const method = metafield ? 'PUT' : 'POST';
    const targetUrl = metafield
      ? `https://${shop}/admin/api/2025-04/metafields/${metafield.id}.json`
      : metafieldUrl;

    // 2. Create or update metafield
    const saveResponse = await fetch(targetUrl, {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const saveResult = await saveResponse.json();

    if (!saveResponse.ok) {
      console.error('Error saving metafield:', saveResult);
      return res.status(saveResponse.status).json({ success: false, error: 'Failed to save metafield', details: saveResult });
    }

    console.log('Save metafield response:', saveResult);

    res.json({ success: true, updated: updatedIds, saved: saveResult });
  } catch (err) {
    console.error('Error marking call as read:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
