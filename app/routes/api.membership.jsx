import { getCustomerMembership } from "../lib/membership.server";
import { syncCustomerQualifyingSpend } from "../lib/loyalty-ledger.server";
import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * GET /api/membership
 *
 * Intended to be reached through the configured Shopify App Proxy, e.g.
 * /apps/elcircle-membership. The customer identity is verified from Shopify;
 * this route deliberately ignores any email supplied by the browser.
 */
export const loader = async ({ request }) => {
  try {
    const storefrontCustomer = await getAuthenticatedStorefrontCustomer(request);
    await syncCustomerQualifyingSpend(storefrontCustomer);
    const membership = await getCustomerMembership(storefrontCustomer.email);

    return jsonResponse({
      success: true,
      found: membership.found,
      tier: membership.tier,
      benefits: membership.benefits
        ? {
            minimumInvestment: membership.benefits.minimumInvestment,
            benefitAmount: membership.benefits.benefitAmount,
            invitationOnly: Boolean(membership.benefits.invitationOnly),
          }
        : null,
      access: membership.access,
    });
  } catch (error) {
    const reason = String(error?.message || "");

    if (
      reason.startsWith("APP_PROXY_") ||
      reason === "SHOPIFY_OFFLINE_SESSION_NOT_FOUND"
    ) {
      return jsonResponse(
        { success: false, error: "Please log in to view your membership." },
        401,
      );
    }

    console.error("[Membership API] Membership lookup failed:", reason);
    // Fail closed: an Odoo/Shopify infrastructure failure never grants access.
    return jsonResponse(
      { success: false, error: "Membership is temporarily unavailable." },
      503,
    );
  }
};

export const action = async () =>
  jsonResponse({ success: false, error: "Method not allowed." }, 405);
