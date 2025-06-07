const express = require('express');
const axios = require('axios');
const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;
const METAFIELD_NAMESPACE = 'custom';
const METAFIELD_KEY = 'read_messages';

router.get('/', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  try {
    const getUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json?namespace=${METAFIELD_NAMESPACE}&key=${METAFIELD_KEY}`;
    const getResponse = await axios.get(getUrl, {
      headers: { 'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN },
    });

    const metafield = getResponse.data.metafields?.[0];

    if (metafield && metafield.value) {
      const callIds = JSON.parse(metafield.value);
      return res.json({ call_ids: callIds });
    }

    // No metafield or empty list
    res.json({ call_ids: [] });
  } catch (error) {
    console.error('Shopify error details:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch metafields',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
