import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;
const NAMESPACE = 'custom';
const KEY = 'pinned_calls';

router.get('/', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${url}?namespace=${NAMESPACE}&key=${KEY}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];

    const callIds = metafield?.value ? JSON.parse(metafield.value) : [];
    res.json({ call_ids: callIds });
  } catch (err) {
    console.error('Error fetching pinned calls:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
