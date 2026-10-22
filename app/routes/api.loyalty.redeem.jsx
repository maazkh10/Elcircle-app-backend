// this was the code  i wrote for mongodb sync with mongod now that next am wringting for Oddo database 

// import CustomerPoints from "../models/CustomerPoints.server";


// export const handle = { unauthenticated: true };

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Accept",
// };

// export const loader = async () => {
//   return new Response(JSON.stringify({ status: "online" }), {
//     status: 200,
//     headers: { ...corsHeaders, "Content-Type": "application/json" },
//   });
// };

// // ==========================================
// // ACTION: Handles Rewards Redemptions Safely
// // ==========================================
// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

//   try {
//     const contentType = request.headers.get("content-type") || "";
//     let body = {};

//     // Hybrid parser extracts data regardless of browser submission format
//     if (contentType.includes("application/json")) {
//       body = await request.json();
//     } else {
//       const formData = await request.formData();
//       body = Object.fromEntries(formData);
//     }

//     const { email, shop, points } = body;

//     if (!email || !shop || !points) {
//       throw new Error("Missing parameters: email, shop, or points.");
//     }

//     console.log(`[LOYALTY] Processing: ${email} for ${points}pts`);

//     const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
//     const subDomain = cleanShop.split(".")[0].replace(/-/g, "_");
//     const tokenKey = `SHOPIFY_TOKEN_${subDomain}`;
//     const accessToken = process.env[tokenKey];

//     if (!accessToken) throw new Error("Token Missing: " + tokenKey);

//     const customer = await CustomerPoints.findOne({ email: email.toLowerCase().trim() });
//     if (!customer || customer.totalpoints < Number(points)) {
//       throw new Error("Database validation failed or insufficient points");
//     }

//     // ⭐ NEW CALCULATION RULE: 20 Points = 1.00 AED
//     const discountAmount = (Number(points) / 20).toFixed(2);
//     const discountCode = `LOYAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

//     const query = `
//       mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
//         discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     const variables = {
//       basicCodeDiscount: {
//         title: "Loyalty Redemption Reward",
//         code: discountCode,
//         startsAt: new Date().toISOString(),
//         usageLimit: 7,
//         appliesOncePerCustomer: false,
//         customerSelection: { all: true },
//         customerGets: {
//           value: { 
//             discountAmount: { 
//               amount: discountAmount, 
//               appliesOnEachItem: false 
//             } 
//           },
//           items: { all: true }
//         }
//       }
//     };

//     const shopifyResponse = await fetch(`https://${cleanShop}/admin/api/2024-01/graphql.json`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Shopify-Access-Token": accessToken,
//       },
//       body: JSON.stringify({ query, variables })
//     });

//     const gqlResult = await shopifyResponse.json();
    
//     if (gqlResult.errors || (gqlResult.data?.discountCodeBasicCreate?.userErrors?.length > 0)) {
//       console.error("[SHOPIFY ERROR DETAIL]", JSON.stringify(gqlResult, null, 2));
//       const errorMsg = gqlResult.errors?.[0]?.message || gqlResult.data?.discountCodeBasicCreate?.userErrors?.[0]?.message;
//       throw new Error(errorMsg || "Shopify rejected discount creation");
//     }

//     // Deduct points and save log entries
//     customer.totalpoints -= Number(points);
//     customer.redeemed.push({ pointsUsed: Number(points), code: discountCode, date: new Date() });
//     await customer.save();

//     console.log(`[SUCCESS] Created Code: ${discountCode} (${discountAmount} AED) for ${email}`);

//     return new Response(JSON.stringify({ success: true, discountCode }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err) {
//     console.error("[REDEEM FAILED]", err.message);
//     return new Response(JSON.stringify({ success: false, error: err.message }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// };




// new code with oodo db and mongodb as backupdown 


import { updateOdooPoints, getOdooPoints } from "../lib/odoo.server";

export const handle = { unauthenticated: true };

const corsheader = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, ngrok-skip-browser-warning, Accept",
};

export const loader = async () => {
  return new Response(JSON.stringify({ status: "online" }), {
    status: 200,
    headers: {
      ...corsheader,
      "Content-Type": "application/json",
    },
  });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsheader,
    });
  }

  try {
    const contentType = request.headers.get("Content-Type") || "";
    let body = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    const { email, shop, points } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanShop = String(shop || "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const requestedPoints = Number(points);

    if (
      !normalizedEmail ||
      !cleanShop ||
      !Number.isSafeInteger(requestedPoints) ||
      requestedPoints <= 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Valid email, shop, and positive whole-number points are required.",
        }),
        {
          status: 400,
          headers: {
            ...corsheader,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(
      `[LOYALTY] Processing Odoo redemption: ${normalizedEmail}, ${requestedPoints} points`
    );

    // Resolve the Shopify access token for this store.
    const subDomain = cleanShop.split(".")[0].replace(/-/g, "_");
    const tokenKey = `SHOPIFY_TOKEN_${subDomain}`;
    const accessToken = process.env[tokenKey];

    if (!accessToken) {
      throw new Error(`Shopify access token is not configured for this store.`);
    }

    // Validate the customer's current Odoo balance.
    const odooData = await getOdooPoints(normalizedEmail);
    const odooBalance = Number(
      odooData?.availablePoints ?? odooData?.totalpoints
    );

    if (!Number.isFinite(odooBalance)) {
      throw new Error("Could not verify the customer's Odoo points balance.");
    }

    console.log(`[ODOO] Customer balance: ${odooBalance} points`);

    if (odooBalance < requestedPoints) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Insufficient points. Available: ${odooBalance}, requested: ${requestedPoints}.`,
        }),
        {
          status: 400,
          headers: {
            ...corsheader,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const discountAmount = (requestedPoints / 20).toFixed(2);
    const discountCode = `LOYAL-${crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

    // Create the Shopify discount code.
    const query = `
      mutation discountCodeBasicCreate(
        $basicCodeDiscount: DiscountCodeBasicInput!
      ) {
        discountCodeBasicCreate(
          basicCodeDiscount: $basicCodeDiscount
        ) {
          userErrors {
            field
            message
          }
          codeDiscountNode {
            id
          }
        }
      }
    `;

    const variables = {
      basicCodeDiscount: {
        title: `Loyalty Redemption ${discountCode}`,
        code: discountCode,
        startsAt: new Date().toISOString(),
        usageLimit: 1,
        appliesOncePerCustomer: true,
        customerSelection: { all: true },
        customerGets: {
          value: {
            discountAmount: {
              amount: discountAmount,
              appliesOnEachItem: false,
            },
          },
          items: { all: true },
        },
      },
    };

    const shopifyResponse = await fetch(
      `https://${cleanShop}/admin/api/2026-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const gqlResult = await shopifyResponse.json();

    if (!shopifyResponse.ok || gqlResult.errors) {
      console.error(
        "[SHOPIFY ERROR]",
        JSON.stringify(gqlResult.errors || gqlResult, null, 2)
      );
      throw new Error("Shopify could not create the discount code.");
    }

    const discountResult = gqlResult.data?.discountCodeBasicCreate;
    const userErrors = discountResult?.userErrors || [];

    if (userErrors.length > 0 || !discountResult?.codeDiscountNode?.id) {
      console.error("[SHOPIFY DISCOUNT ERROR]", userErrors);
      throw new Error(
        userErrors.map((error) => error.message).join("; ") ||
          "Shopify did not confirm discount creation."
      );
    }

    // Deduct the redeemed points from Odoo.
    await updateOdooPoints(
      normalizedEmail,
      -requestedPoints,
      cleanShop,
      discountResult.codeDiscountNode.id,
      `Redeemed ${requestedPoints} points for discount code ${discountCode}`
    );

    console.info("[LOYALTY] Redemption completed", {
      shop: cleanShop,
      email: normalizedEmail,
      pointsRedeemed: requestedPoints,
      discountCode,
      discountAmount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        discountCode,
        discountAmount,
        pointsRedeemed: requestedPoints,
        remainingPoints: odooBalance - requestedPoints,
      }),
      {
        status: 200,
        headers: {
          ...corsheader,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("[REDEEM FAILED]", err.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to complete loyalty redemption. Please try again or contact support.",
      }),
      {
        status: 500,
        headers: {
          ...corsheader,
          "Content-Type": "application/json",
        },
      }
    );
  }
};
