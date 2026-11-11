import process from "node:process";

import { getCustomerMembership } from "../lib/membership.server";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://dashboard-customer.myshopify.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type, Authorization",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const key = process.env.MEMBERSHIP_API_KEY;
  if (!key || request.headers.get("Authorization") !== `Bearer ${key}`) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const email = url.searchParams.get("email");

  if (!email) {
    return jsonResponse({ success: false, error: "Email is required" }, 400);
  }

  try {
    const membership = await getCustomerMembership(email);

    return jsonResponse({
      success: true,
      found: membership.found,
      tier: membership.tier,
      benefits: membership.benefits,
      access: membership.access,
    });
  } catch (error) {
    console.error("[Direct Membership API]", error);
    return jsonResponse(
      { success: false, error: "Membership lookup failed" },
      500,
    );
  }
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  return jsonResponse({ success: false, error: "Method not allowed" }, 405);
};
