import { connect } from "mongoose";
import prisma from "../db.server";
import CustomerPoints from "../models/CustomerPoints.server";


/* ----------------------------------
   COMMON CORS HEADERS
---------------------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/* ----------------------------------
   LOADER (Handles OPTIONS Prefetch)
---------------------------------- */
export const loader = async ({ request }) => {
  // await connectDB()
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response("OK", { headers: corsHeaders });
};

/* ----------------------------------
   ACTION (REDEEM POINTS)
---------------------------------- */
export const action = async ({ request }) => {
  try {
    const { email, points, shop } = await request.json();

    if (!email || !points || !shop) {
      throw new Error("Missing data");
    }

    /* ---------- CUSTOMER ---------- */
    const customerDoc = await CustomerPoints.findOne({
      email: email.toLowerCase(),
    });

    if (!customerDoc) {
      throw new Error("Customer not found");
    }

    if (customerDoc.availablePoints < points) {
      throw new Error("Not enough points");
    }

    /* ---------- LOAD OFFLINE TOKEN ---------- */
    const session = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
    });

    if (!session) {
      throw new Error("Offline session not found");
    }

    const accessToken = session.accessToken;

    /* ---------- CALCULATE DISCOUNT ---------- */
    // Example: 1 point = 0.1 AED
    const discountValue = (points * 0.1).toFixed(2);

    const discountCode =
      `LOYALTY-${points}-` +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    /* ---------- CREATE SHOPIFY DISCOUNT ---------- */
    const shopifyResponse = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query: `
            mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
              discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
                codeDiscountNode { id }
                userErrors { message }
              }
            }
          `,
          variables: {
            basicCodeDiscount: {
              title: "Loyalty Discount",
              code: discountCode,
              startsAt: new Date().toISOString(),
              customerSelection: { all: true },
              // neeed to change this true after testing 
              appliesOncePerCustomer: false,
            //  need to change this to 1 after testing 
              usageLimit: 1, 
              customerGets: {
                value: {
                  discountAmount: {
                    amount: discountValue,
                    appliesOnEachItem: false,
                  },
                },
                items: { all: true },
              },
            },
          },
        }),
      }
    );

    const result = await shopifyResponse.json();

    if (result.errors?.length) {
      throw new Error(result.errors[0].message);
    }

    return new Response(
      JSON.stringify({ success: true, discountCode }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
