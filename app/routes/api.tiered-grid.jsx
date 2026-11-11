import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";

import { getCustomerMembership } from "../lib/membership.server";


const corsHeaders = {
  "Access-Control-Allow-Origin": "https://dashboard-customer.myshopify.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Accept, Content-Type, ngrok-skip-browser-warning",
  "Cache-Control": "no-store",
};

export async function loader({ request }) {
  const { email } = await getAuthenticatedStorefrontCustomer(request);

  try {
    const membership = await getCustomerMembership(email);

    return Response.json(
      {
        success: true,
        found: membership.found,
        tier: membership.tier,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Tiered Grid API]", error);

    return Response.json(
      { success: false, error: "Membership lookup failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return Response.json(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: corsHeaders }
  );
}
