import test from "node:test";
import assert from "node:assert/strict";

process.env.SHOPIFY_API_KEY = "test-app-key";
process.env.SHOPIFY_API_SECRET = "test-secret-for-unsigned-webhook-check";
process.env.SHOPIFY_APP_URL = "http://localhost:43190";
delete process.env.Mongo_URI;
const { routes } = await import("../build/server/index.js");

for (const id of ["routes/webhooks.orders.create", "routes/webhooknew.order.create"]) {
  test(`${id} rejects an invalid Shopify signature before database access`, async () => {
    const result = await routes[id].module.action({ request: new Request("http://localhost/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Topic": "orders/create",
        "X-Shopify-Shop-Domain": "example.myshopify.com",
        "X-Shopify-Hmac-Sha256": "invalid-signature",
      },
      body: JSON.stringify({ financial_status: "paid", customer: { email: "example@example.com" } }),
    }) });
    assert.equal(result.status, 401);
  });
}
