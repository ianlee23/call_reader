import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN; // e.g. yourstore.myshopify.com
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;

router.post("/", async (req, res) => {
  try {
    const { customerId, firstName, lastName, email } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    // GraphQL mutation
    const mutation = `
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            firstName
            lastName
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        id: `gid://shopify/Customer/${customerId}`,
        firstName,
        lastName,
        email,
      },
    };

    const response = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: data.errors });
    }

    const userErrors = data.data.customerUpdate.userErrors;
    if (userErrors.length > 0) {
      return res.status(400).json({ errors: userErrors });
    }

    res.json({ success: true, customer: data.data.customerUpdate.customer });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
