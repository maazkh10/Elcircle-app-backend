import prisma from "../db.server";
import CustomerPoints from "../models/CustomerPoints.server";

export const handle = { unauthenticated: true };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
};

export const action = async ({ request }) => {
  try {
    const form = await request.formData();
    const email = form.get("email")?.toLowerCase().trim();
    const shop = form.get("shop");
    const points = Number(form.get("points"));

    if (!email || !shop || !points) {
      throw new Error("Missing parameters");
    }

    const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const customer = await CustomerPoints.findOne({
      shop: cleanShop,
      email
    });

    if (!customer) throw new Error("Customer not found");
    if (customer.totalpoints < points) throw new Error("Not enough points");

    const discountAmount = (points * 0.1).toFixed(2);

    const session = await prisma.session.findFirst({
      where: { shop: cleanShop, isOnline: false },
    });

    if (!session) throw new Error("No Shopify session found");

    const discountCode = `LOYALTY-${points}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const response = await fetch(
      `https://${cleanShop}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken,

        },

        body: JSON.stringify({
          query: `
          mutation {
            discountCodeBasicCreate(basicCodeDiscount: {
              title: "Loyalty Discount",
              code: "${discountCode}",
              startsAt: "${new Date().toISOString()}",
              customerSelection: { all: true },
              customerGets: {
                value: {
                  discountAmount: {
                    amount: "${discountAmount}",
                    appliesOnEachItem: false
                  }
                },
                items: { all: true }
              }
            }) {
              userErrors { message }
            }
          }
          `,
        }),
      }
    );

    const json = await response.json();

    const errors =
      json?.data?.discountCodeBasicCreate?.userErrors || [];

    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    return new Response(
      JSON.stringify({ success: true, discountCode }),
      { status: 200 ,  headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("REDEEM ERROR:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
};