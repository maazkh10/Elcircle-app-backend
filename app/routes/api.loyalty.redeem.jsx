import prisma from "../db.server";
import CustomerPoints from "../models/CustomerPoints.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* PREFLIGHT */
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return new Response("OK", { headers: corsHeaders });
};

/* REDEEM */
export const action = async ({ request }) => {
  try {
    const { email, points, shop } = await request.json();

    if (!email || !points || !shop) {
      throw new Error("Missing data");
    }

    /* ---------- CUSTOMER ---------- */
    const customer = await CustomerPoints.findOne({
      email: email.toLowerCase(),
    });

    if (!customer) throw new Error("Customer not found");

    if (customer.availablePoints < points) {
      throw new Error("Not enough points");
    }

    /* ---------- LOAD OFFLINE TOKEN ---------- */
    const session = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
    });

    if (!session) throw new Error("Offline session not found");

    const accessToken = session.accessToken;

    /* ---------- CREATE DISCOUNT ---------- */
    const discountCode =
      "LOYALTY-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();

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
  appliesOncePerCustomer: true,
  usageLimit: 1,
  combinesWith: {
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false
  },
  customerGets: {
    value: {
      discountAmount: {
        amount: "59.00",
        appliesOnEachItem: false
      }
    },
    items: { all: true }
  }
}




          }

        }),
      }
    );

    const result = await shopifyResponse.json();

if (result.errors && result.errors.length > 0) {
  console.log("Graphql ERROR : " , result.errors);
  throw new Error(result.errors[0].message)
}


if (result.data && 
  result.data.discountCodeBasicCreate && 
  result.data.discountCodeBasicCreate.userErrors.length > 0
) {
  console.log("USer ERROR : " , result.data.discountCodeBasicCreate.userErrors);
  throw new Error(result.data.discountCodeBasicCreate.userErrors[0].message)
}


    /* ---------- DEDUCT POINTS ---------- */
    customer.availablePoints -= points;
    await customer.save();

    return new Response(
      JSON.stringify({ success: true, discountCode }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};
