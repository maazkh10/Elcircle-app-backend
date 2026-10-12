import prisma from "../db.server";
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
  await authenticate.public.appProxy(request);

  const shop = (url.searchParams.get("shop") || "").trim().toLowerCase();
  const customerId = (url.searchParams.get("logged_in_customer_id") || "").trim();

  if (!shop || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Error("APP_PROXY_INVALID_SHOP");
  }

  if (!/^\d+$/.test(customerId)) {
    throw new Error("APP_PROXY_CUSTOMER_NOT_LOGGED_IN");
  }

  let session = await prisma.session.findUnique({
    where: { id: `offline_${shop}` },
  });

  if (!session?.accessToken) {
    session = await prisma.session.findFirst({
      where: { shop, isOnline: false },
      orderBy: { expires: "desc" },
    });
  }

  if (!session?.accessToken) {
    throw new Error("SHOPIFY_OFFLINE_SESSION_NOT_FOUND");
  }

  const customerGid = `gid://shopify/Customer/${customerId}`;
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-04";
  const query = `
    query ElcircleCustomerEmail($id: ID!) {
      customer(id: $id) {
        id
        email
      }
    }
  `;

  const response = await fetch(
    `https://${shop}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({ query, variables: { id: customerGid } }),
    },
  );

  const payload = await response.json();

  if (!response.ok || payload.errors?.length) {
    console.error("[Membership] Shopify customer lookup failed", {
      status: response.status,
      errors: payload.errors,
    });
    throw new Error("SHOPIFY_CUSTOMER_LOOKUP_FAILED");
  }

  const customer = payload.data?.customer;
  const email = customer?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("SHOPIFY_CUSTOMER_EMAIL_UNAVAILABLE");
  }

  return {
    shop,
    customerId,
    email,
  };
}
