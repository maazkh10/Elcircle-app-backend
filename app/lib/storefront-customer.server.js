import { authenticate } from "../shopify.server";

/**
 * Resolve the signed-in Shopify customer from a Shopify App Proxy request.
 * Do not accept an email supplied by browser JavaScript as proof of identity.
 *
 * Requires the app's read_customers scope and an app proxy configured in the
 * active shopify.app*.toml config.
 */
export async function getAuthenticatedStorefrontCustomer(request) {
  const url = new URL(request.url);

  // Verifies Shopify's App Proxy signature. Direct unsigned browser requests fail.
  const { admin, session } = await authenticate.public.appProxy(request);

  const shop = (url.searchParams.get("shop") || "").trim().toLowerCase();
  const customerId = (url.searchParams.get("logged_in_customer_id") || "").trim();

  if (!shop || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Response(null, { status: 400 });
  }

  if (!/^\d+$/.test(customerId)) {
    throw new Response(null, {
      status: 401,
      headers: { "X-Elcircle-Auth": "customer-login-required" },
    });
  }

  if (!admin || !session?.accessToken) {
    throw new Response(null, { status: 401 });
  }

  const response = await admin.graphql(
    `query ElcircleCustomerEmail($id: ID!) {
      customer(id: $id) {
        email
      }
    }`,
    { variables: { id: `gid://shopify/Customer/${customerId}` } },
  );
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error("SHOPIFY_CUSTOMER_LOOKUP_FAILED");
  }

  const email = payload.data?.customer?.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("SHOPIFY_CUSTOMER_EMAIL_UNAVAILABLE");
  }

  return { shop, customerId, email, admin };
}
