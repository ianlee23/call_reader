import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;
const NAMESPACE = 'custom';
const KEY = 'pinned_calls';

router.post('/', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ success: false, error: 'Missing customer_id or call_id' });
  }

  const metafieldUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${metafieldUrl}?namespace=${NAMESPACE}&key=${KEY}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];
    let pinnedIds = metafield?.value ? JSON.parse(metafield.value) : [];

    if (!pinnedIds.includes(call_id)) {
      pinnedIds.push(call_id);
    }

    const payload = {
      metafield: {
        namespace: NAMESPACE,
        key: KEY,
        type: 'list.single_line_text_field',
        value: JSON.stringify(pinnedIds),
      },
    };

    const targetUrl = metafield
      ? `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/metafields/${metafield.id}.json`
      : metafieldUrl;

    const saveResponse = await fetch(targetUrl, {
      method: metafield ? 'PUT' : 'POST',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const saveResult = await saveResponse.json();

    if (!saveResponse.ok) {
      return res.status(saveResponse.status).json({
        success: false,
        error: 'Failed to save metafield',
        details: saveResult,
      });
    }

    res.json({ success: true, updated: pinnedIds, saved: saveResult });
  } catch (err) {
    console.error('Error pinning call:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
