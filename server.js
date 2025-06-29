import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;

app.use(cors({
  origin: 'https://businessgenie.biz',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.send('✅ Shopify Metafield Updater is running.');
});

// MARK CALL AS READ
app.post('/api/mark-call-read', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ success: false, error: 'Missing customer_id or call_id' });
  }

  const namespace = 'custom';
  const key = 'read_messages';
  const metafieldUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${metafieldUrl}?namespace=${namespace}&key=${key}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];
    let updatedIds = metafield?.value ? JSON.parse(metafield.value) : [];

    if (!updatedIds.includes(call_id)) updatedIds.push(call_id);

    const payload = {
      metafield: {
        namespace,
        key,
        type: 'list.single_line_text_field',
        value: JSON.stringify(updatedIds),
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
      return res.status(saveResponse.status).json({ success: false, error: 'Failed to save metafield', details: saveResult });
    }

    res.json({ success: true, updated: updatedIds, saved: saveResult });
  } catch (err) {
    console.error('Error marking call as read:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET READ CALLS
app.get('/api/get-read-calls', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  const namespace = 'custom';
  const key = 'read_messages';
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${url}?namespace=${namespace}&key=${key}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];

    if (metafield?.value) {
      const callIds = JSON.parse(metafield.value);
      return res.json({ call_ids: callIds });
    }

    res.json({ call_ids: [] });
  } catch (err) {
    console.error('Error fetching read calls:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PIN CALL
app.post('/api/pin-call', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ success: false, error: 'Missing customer_id or call_id' });
  }

  const namespace = 'custom';
  const key = 'pinned_calls';
  const metafieldUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${metafieldUrl}?namespace=${namespace}&key=${key}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];
    let pinnedIds = metafield?.value ? JSON.parse(metafield.value) : [];

    if (!pinnedIds.includes(call_id)) pinnedIds.push(call_id);

    const payload = {
      metafield: {
        namespace,
        key,
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
      return res.status(saveResponse.status).json({ success: false, error: 'Failed to save metafield', details: saveResult });
    }

    res.json({ success: true, updated: pinnedIds, saved: saveResult });
  } catch (err) {
    console.error('Error pinning call:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// UNPIN CALL
app.post('/api/unpin-call', async (req, res) => {
  const { customer_id, call_id } = req.body;

  if (!customer_id || !call_id) {
    return res.status(400).json({ success: false, error: 'Missing customer_id or call_id' });
  }

  const namespace = 'custom';
  const key = 'pinned_calls';
  const metafieldUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${metafieldUrl}?namespace=${namespace}&key=${key}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];

    if (!metafield) {
      return res.status(404).json({ success: false, error: 'Pinned calls metafield not found' });
    }

    let pinnedIds = metafield.value ? JSON.parse(metafield.value) : [];

    // Remove the call_id
    pinnedIds = pinnedIds.filter(id => id !== call_id);

    const payload = {
      metafield: {
        namespace,
        key,
        type: 'list.single_line_text_field',
        value: JSON.stringify(pinnedIds),
      },
    };

    const saveResponse = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-04/metafields/${metafield.id}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const saveResult = await saveResponse.json();

    if (!saveResponse.ok) {
      return res.status(saveResponse.status).json({ success: false, error: 'Failed to update metafield', details: saveResult });
    }

    res.json({ success: true, updated: pinnedIds, saved: saveResult });
  } catch (err) {
    console.error('Error unpinning call:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET PINNED CALLS
app.get('/api/get-pinned-calls', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  const namespace = 'custom';
  const key = 'pinned_calls';
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2025-04/customers/${customer_id}/metafields.json`;

  try {
    const response = await fetch(`${url}?namespace=${namespace}&key=${key}`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const metafield = data.metafields?.[0];

    if (metafield?.value) {
      const pinnedIds = JSON.parse(metafield.value);
      return res.json({ call_ids: pinnedIds });
    }

    res.json({ call_ids: [] });
  } catch (err) {
    console.error('Error fetching pinned calls:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
