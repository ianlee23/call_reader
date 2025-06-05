const express = require('express');
const axios = require('axios');
const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;
const METAFIELD_NAMESPACE = 'custom';
const METAFIELD_KEY = 'read_messages';

router.post('/', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ error: 'Missing customer_id or call_id' });
  }

  try {
    const getUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/customers/${customer_id}/metafields.json`;
    const getResponse = await axios.get(getUrl, {
      headers: { 'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN },
    });

    const existingMetafield = getResponse.data.metafields.find(
      (m) => m.namespace === METAFIELD_NAMESPACE && m.key === METAFIELD_KEY
    );

    let updatedValue = [];

    if (existingMetafield) {
      const current = JSON.parse(existingMetafield.value);
      if (!current.includes(call_id)) {
        updatedValue = [...current, call_id];
      } else {
        updatedValue = current;
      }

      const updateUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/metafields/${existingMetafield.id}.json`;
      await axios.put(updateUrl, {
        metafield: {
          id: existingMetafield.id,
          value: JSON.stringify(updatedValue),
          type: 'json',
        },
      });
    } else {
      const createUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/metafields.json`;
      await axios.post(createUrl, {
        metafield: {
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_KEY,
          value: JSON.stringify([call_id]),
          type: 'json',
          owner_id: customer_id,
          owner_resource: 'customer',
        },
      });
      updatedValue = [call_id];
    }

    res.json({ success: true, updated: updatedValue });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Metafield update failed' });
  }
});

module.exports = router;
