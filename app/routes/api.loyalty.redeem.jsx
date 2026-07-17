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


import CustomerPoints from "../models/CustomerPoints.server";
import { updateOdooPoints, getOdooPoints } from "../lib/odoo.server";

export const handle = { unauthenticated: true };

const corsheader = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Accept",
};

export const loader = async () => {
  return new Response(JSON.stringify({ status: "online" }), {
    status: 200,
    headers: {
      ...corsheader,
      "Content-Type": "application/json"
    }
  });
};

export const action = async ({ request }) => {
  // ⭐ FIX 1: Corrected "OPTIONS" spelling to catch preflight checks cleanly
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsheader });
  }

  try {
    const contentType = request.headers.get("Content-Type") || "empty";
    let body = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    const { email, shop, points } = body;

    if (!email || !shop || !points) {
      throw new Error("Missing parameters: email, shop, or points.");
    }

// --- REPLACE THIS SPECIFIC TOKEN LOOKUP BLOCK IN YOUR ACTION HANDLER ---
console.log(`[LOYALTY] Processing Odoo redemption: ${email} for ${points}pts`);

const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

// Extract the subdomain and switch any hyphens to underscores to match your env file layout
const subDomain = cleanShop.split(".")[0].replace(/-/g, "_");
const tokenKey = `SHOPIFY_TOKEN_${subDomain}`;
const accessToken = process.env[tokenKey];

if (!accessToken) throw new Error("Token missing for dynamic lookup key: " + tokenKey);
// ------------------------------------------------------------------------

    // 1. Odoo Validation Pipelines
    const odooData = await getOdooPoints(email);
    const odooBalance = odooData?.availablePoints || 0;

    console.log(`[ODOO] Customer real-time balance: ${odooBalance} points.`);

    // ⭐ FIX 3: Changed check to use odooBalance variable rather than raw object
    if (odooBalance < Number(points)) {
      throw new Error(`Validation failed. Insufficient Odoo points balance. Available: ${odooBalance}, Requested: ${points}`);
    }

    const discountAmount = (Number(points) / 20).toFixed(2);
    const discountCode = `LOYAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    /* =============================================================
       2. SHOPIFY COUPON GENERATION (FIX 4: Corrected Variables Structure)
       ============================================================= */
    const query = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
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

    // Wrapped inside basicCodeDiscount to perfectly align variables with your GraphQL declaration definition
    const variables = {
      basicCodeDiscount: {
        title: "Loyalty Redemption Reward",
        code: discountCode,
        startsAt: new Date().toISOString(),
        usageLimit: 7, // Kept at 7 instances maximum
        appliesOncePerCustomer: true,
        customerSelection: { all: true },
        customerGets: {
          value: { 
            discountAmount: { 
              amount: discountAmount, 
              appliesOnEachItem: false 
            } 
          },
          items: { all: true }
        }
      }
    };

    const shopifyResponse = await fetch(`https://${cleanShop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }) // Sent variables as payload correctly
    });

    const gqlResult = await shopifyResponse.json();

    if (gqlResult.errors || (gqlResult.data?.discountCodeBasicCreate?.userErrors?.length > 0)) {
      console.error("[SHOPIFY ERROR DETAIL]", JSON.stringify(gqlResult, null, 2));
      const errorMsg = gqlResult.errors?.[0]?.message || gqlResult.data?.discountCodeBasicCreate?.userErrors?.[0]?.message;
      throw new Error(errorMsg || "Shopify rejected discount creation layout properties");
    }

    // 3. Sync points reduction with Odoo 
    await updateOdooPoints(
      email,
      -Number(points),
      cleanShop,
      "N/A",
      `Redeem pending discount code: ${discountCode}`
    );

    // 4. Sync MongoDB fallback states
    let customer = await CustomerPoints.findOne({ email: email.toLowerCase().trim() });
    if (!customer) {
      customer = await CustomerPoints.create({
        shop: cleanShop,
        email: email.toLowerCase().trim(),
        totalpoints: 0,
        availablePoints: 0,
        order: [],
        redeemed: []
      });
    }

    // Mirror updated point records down stream
    customer.totalpoints = Math.max(0, odooBalance - Number(points));
    customer.availablePoints = Math.max(0, odooBalance - Number(points));
    
    customer.redeemed.push({ 
      pointsUsed: Number(points), 
      code: discountCode, 
      status: "pending", 
      date: new Date() 
    });
    
    await customer.save();

    console.log(`[SUCCESS] Created Code: ${discountCode} (${discountAmount} AED) for ${email}. Synced to Odoo & Mongo.`);

    return new Response(JSON.stringify({ success: true, discountCode }), {
      status: 200,
      headers: { ...corsheader, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[REDEEM FAILED]", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsheader, "Content-Type": "application/json" },
    });
  }
};

