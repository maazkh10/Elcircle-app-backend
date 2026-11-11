import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";

// this was the old code for mondo db
// import prisma from "../db.server";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type",
// };

// export const loader = async () => {
//   return new Response("Buy points API working", { headers: corsHeaders });
// };

// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null,
//       { status: 204,
//         headers: corsHeaders });
//   }

//   try {
//     const body = await request.json();

//     const email = body.email?.toLowerCase().trim();
//     const shop = body.shop;
//     const points = Number(body.points);

//     if (!email || !shop || !points) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Missing params" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     // 💰 1 point = $1
//     const amount = points;

//     /* ---------------- GET ACCESS TOKEN ---------------- */
// const session = await prisma.session.findFirst({
//   where: {
//     shop: shop,
//     isOnline: false,
//   },
// });

// if (!session) {
//   console.log("No session for shop:", shop);

//   return new Response(
//     JSON.stringify({
//       success: false,
//       error: "App not installed on this store"
//     }),
//     {
//       status: 400,
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     }
//   );
// }
//     console.log(session , "session")
//     const accessToken = session?.accessToken;
//     if (!accessToken) {
//       throw new Error("No access token found for shop");
//     }
//     /* ---------------- STEP 1: CREATE DRAFT ORDER ---------------- */
//     const draftRes = await fetch(
//       `https://${shop}/admin/api/2024-01/draft_orders.json`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": accessToken,
//         },
//         body: JSON.stringify({
//           draft_order: {
//             line_items: [
//               {
//                 title: `Buy ${points} Points`,
//                 price: amount.toString(),
//                 quantity: 1,
//               },
//             ],
//             customer: {
//               email: email,
//             },
//           },
//         }),
//       }
//     );
//     const draftData = await draftRes.json();
//     console.log("🟡 Draft Response:", draftData);
//     const draftId = draftData?.draft_order?.id;
//     if (!draftId) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Draft order creation failed",
//           shopifyResponse: draftData,
//         }),
//         {
//           status: 500,
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     /* ---------------- STEP 2: SEND INVOICE (GENERATES CHECKOUT URL) ---------------- */
//     const invoiceRes = await fetch(

//       `https://${shop}/admin/api/2024-01/draft_orders/${draftId}/send_invoice.json`,

//       {

//         method: "POST",

//         headers: {

//           "Content-Type": "application/json",

//           "X-Shopify-Access-Token": accessToken,

//         },

//         body: JSON.stringify({

//           draft_order_invoice: {

//             to: email,

//             subject: "Complete your purchase",

//             custom_message: "Click to complete your points purchase",

//           },

//         }),

//       }

//     );


//     const invoiceData = await invoiceRes.json();

//     console.log("🟢 Invoice Response:", invoiceData);

//     const invoiceUrl = draftData?.draft_order?.invoice_url;

//     if (!invoiceUrl) {

//       return new Response(

//         JSON.stringify({

//           success: false,

//           error: "Invoice URL not generated",

//           draft: draftData,

//           invoice: invoiceData,

//         }),

//         {

//           status: 500,

//           headers: { ...corsHeaders, "Content-Type": "application/json" },

//         }

//       );

//     }

//     /* ---------------- SUCCESS ---------------- */
//     return new Response(
//       JSON.stringify({
//         success: true,
//         checkoutUrl: invoiceUrl,
//       }),
//       {
//         status: 200,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("🔥 ERROR:", error);

//     return new Response(
//       JSON.stringify({ success: false, error: error.message }),
//       {
//         status: 500,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   }
// };


// new code added try to addd with the oddo



// import process from "node:process";
// import prisma from "../db.server"; // Import Prisma directly to load the session safely

// // ==========================================
// // 1. CONFIGURATION & ENVIRONMENT VARIABLES
// // ==========================================
// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Accept",
// };

// const ODOO_URL = process.env.ODOO_URL || "https://test1106.odoo.com";
// const ODOO_DB = process.env.ODOO_DB || "test1106";
// const ODOO_USERNAME = process.env.ODOO_USERNAME || "itaphrodit@gmail.com";
// const ODOO_PASSWORD = process.env.ODOO_API_KEY || "Maazkh@10";

// // ==========================================
// // 2. HELPER TO HANDLE DIRECT ODOO API CALLS (JSON-RPC)
// // ==========================================
// async function executeOdooCall(service, method, args) {
//   const response = await fetch(`${ODOO_URL}/jsonrpc`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       jsonrpc: "2.0",
//       method: "call",
//       params: { service, method, args },
//     }),
//   });

//   const data = await response.json();
//   if (data.error) {
//     throw new Error(`Odoo API Error: ${data.error.code ?? "unknown"}`);
//   }
//   return data.result;
// }

// // ==========================================
// // 3. EXPORTED ODOO UTILITIES
// // ==========================================
// export async function getOdooPoints(email) {
//   try {
//     const uid = await executeOdooCall("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
//     if (!uid) return null;

//     const partnerIds = await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "res.partner", "search", [[["email", "=", email]]]
//     ]);

//     if (!partnerIds || partnerIds.length === 0) {
//       return { totalpoints: 0, availablePoints: 0 };
//     }

//     const partnerData = await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "res.partner", "read", [[partnerIds[0]], ["x_loyalty_points"]]
//     ]);

//     const points = partnerData[0]?.x_loyalty_points || 0;
//     return { totalpoints: points, availablePoints: points };
//   } catch (err) {
//     console.error("❌ Odoo Read Error:", err);
//     return null;
//   }
// }

// export async function updateOdooPoints(email, pointsDelta, shopUrl, orderRef, description) {
//   try {
//     console.log(`[Odoo Sync] Authenticating...`);
//     const uid = await executeOdooCall("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
//     if (!uid) throw new Error("Authentication error (uid error)");

//     const partnerIds = await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "res.partner", "search", [[["email", "=", email]]]
//     ]);

//     if (!partnerIds || partnerIds.length === 0) {
//       console.log(`[Odoo Warning] No partner found matching email: ${email}`);
//       return null;
//     }
//     const partnerId = partnerIds[0];

//     const partnerData = await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "res.partner", "read", [[partnerId], ["x_loyalty_points"]]
//     ]);

//     const currentPoints = partnerData[0]?.x_loyalty_points || 0;
//     const newPointstotal = currentPoints + pointsDelta;

//     await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "res.partner", "write", [[partnerId], { x_loyalty_points: newPointstotal }]
//     ]);

//     const colLine = await executeOdooCall("object", "execute_kw", [
//       ODOO_DB, uid, ODOO_PASSWORD, "x_res_partner_line_a24f8", "create",
//       [{
//         x_res_partner_id: partnerId,
//         x_studio_points_delta: pointsDelta,
//         x_studio_shopify_order_ref: orderRef,
//         x_studio_store_url: shopUrl,
//         x_name: description || `for loyalty ${email}`
//       }]
//     ]);

//     return colLine;
//   } catch (error) {
//     console.error("❌ Failed to sync the points transaction to Odoo:");
//     throw error;
//   }
// }

// // ==========================================
// // 4. SHOPIFY ROUTER HANDLERS (LOADER & ACTION)
// // ==========================================
// export const loader = async () => {
//   return new Response("Buy points API working", { headers: corsHeaders });
// };

// export const action = async ({ request }) => {
//   if (request.method === "OPTIONS") {
//     return new Response(null, { status: 204, headers: corsHeaders });
//   }

//   try {
//     const body = await request.json();
//     const email = body.email?.toLowerCase().trim();
//     const shop = body.shop;
//     const points = Number(body.points);

//     if (!email || !shop || !points) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Missing params" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const amount = points;

//     /* ---------------- GET ACCESS TOKEN ---------------- */
//     console.log(`[Shopify Context] Querying active offline token for: ${shop}`);

//     const offlineSessionId = `offline_${shop}`;

//     // Force a fresh uncached live lookup from the SQLite database
//     let sessionRecord = await prisma.session.findUnique({
//       where: { id: offlineSessionId },
//     });

//     // Smart Fallback Checklist: If findUnique misses due to a runtime session change, search by shop name directly
//     if (!sessionRecord || !sessionRecord.accessToken) {
//       console.log(`⚠️ Offline ID query missed. Querying via shop domain fallback search for: ${shop}`);
//       sessionRecord = await prisma.session.findFirst({
//         where: { shop: shop, isOnline: false },
//         orderBy: { expires: 'desc' } // Make sure we grab the newest token if duplicates exist
//       });
//     }

//     if (!sessionRecord || !sessionRecord.accessToken) {
//       console.log(`❌ No offline database session token found for store: ${shop}`);
//       return new Response(
//         JSON.stringify({ success: false, error: `Store ${shop} is not authenticated with the app.` }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const accessToken = sessionRecord.accessToken;
//     const apiVersion = shopify?.config?.apiVersion || '2024-01';

//     /* ---------------- STEP 1: CREATE DRAFT ORDER ---------------- */
//     const draftRes = await fetch(
//       `https://${shop}/admin/api/${apiVersion}/draft_orders.json`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": accessToken,
//         },
//         body: JSON.stringify({
//           draft_order: {
//             line_items: [
//               {
//                 title: `Buy Loyalty Points (${points} Pts)`,
//                 price: amount.toString(),
//                 quantity: 1,
//               },
//             ],
//             customer: { email: email },
//             note_attributes: [
//               { name: "is_points_purchase", value: "true" },
//               { name: "points_to_add", value: points.toString() }
//             ]
//           },
//         }),
//       }
//     );

//     const draftData = await draftRes.json();
//     console.log("🟡 Draft Response:", draftData);

//     if (draftData.errors) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Shopify rejected token credentials directly.",
//           details: draftData.errors
//         }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const draftId = draftData?.draft_order?.id;
//     if (!draftId) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Draft order creation failed structurally",
//           shopifyResponse: draftData,
//         }),
//         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     /* ---------------- STEP 2: SEND INVOICE ---------------- */
//     const invoiceRes = await fetch(
//       `https://${shop}/admin/api/${apiVersion}/draft_orders/${draftId}/send_invoice.json`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": accessToken,
//         },
//         body: JSON.stringify({
//           draft_order_invoice: {
//             to: email,
//             subject: "Complete your purchase",
//             custom_message: "Click to complete your points purchase",
//           },
//         }),
//       }
//     );

//     const invoiceData = await invoiceRes.json();
//     const invoiceUrl = draftData?.draft_order?.invoice_url;

//     if (!invoiceUrl) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Invoice URL generation failed",
//           draft: draftData,
//           invoice: invoiceData,
//         }),
//         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     return new Response(
//       JSON.stringify({ success: true, checkoutUrl: invoiceUrl }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   } catch (error) {
//     console.error("🔥 CRITICAL ROUTER ERROR:", error);
//     return new Response(
//       JSON.stringify({ success: false, error: error.message }),
//       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   }
// };


// new code with the new oddo one





import process from "node:process";
import prisma from "../db.server";

// ======================================================
// 1. CONFIGURATION
// ======================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, ngrok-skip-browser-warning, Accept",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD =
  process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD;

const PARTNER_MODEL = "res.partner";

const POINTS_FIELD =
  process.env.ODOO_POINTS_FIELD ||
  "x_studio_loyalty_points_1";

const HISTORY_FIELD =
  process.env.ODOO_HISTORY_FIELD ||
  "x_studio_loyalty_history_1";

const SHOPIFY_API_VERSION =
  process.env.SHOPIFY_API_VERSION || "2025-10";

const POINTS_PER_AED = 1;

const MIN_AMOUNT_AED = 1;
const MAX_AMOUNT_AED = 100000;

// ======================================================
// 2. RESPONSE HELPER
// ======================================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

// ======================================================
// 3. SHOP DOMAIN VALIDATION
// ======================================================

// ======================================================
// 4. ODOO JSON-RPC HELPER
// ======================================================

async function executeOdooCall(service, method, args) {
  if (
    !ODOO_URL ||
    !ODOO_DB ||
    !ODOO_USERNAME ||
    !ODOO_PASSWORD
  ) {
    throw new Error("Odoo environment variables are missing.");
  }

  const baseUrl = ODOO_URL.replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service,
        method,
        args,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Odoo HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `Odoo API Error: ${data.error.code ?? "unknown"}`
    );
  }

  return data.result;
}

// ======================================================
// 5. GET ODOO CUSTOMER POINTS
// ======================================================

export async function getOdooPoints(email) {
  try {
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return {
        totalpoints: 0,
        availablePoints: 0,
      };
    }

    const uid = await executeOdooCall(
      "common",
      "authenticate",
      [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]
    );

    if (!uid) {
      throw new Error("Odoo authentication failed.");
    }

    const partnerIds = await executeOdooCall(
      "object",
      "execute_kw",
      [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        PARTNER_MODEL,
        "search",
        [[["email", "=", normalizedEmail]]],
      ]
    );

    if (!partnerIds?.length) {
      return {
        totalpoints: 0,
        availablePoints: 0,
      };
    }

    const partnerData = await executeOdooCall(
      "object",
      "execute_kw",
      [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        PARTNER_MODEL,
        "read",
        [[partnerIds[0]], [POINTS_FIELD]],
      ]
    );

    const points =
      Number(partnerData[0]?.[POINTS_FIELD]) || 0;

    return {
      totalpoints: points,
      availablePoints: points,
    };
  } catch (error) {
    console.error("Odoo Read Error:", error);
    throw error;
  }
}

// ======================================================
// 6. UPDATE ODOO CUSTOMER POINTS
// IMPORTANT:
// Call this only after verified payment.
// Use an idempotent payment/ledger check before calling.
// ======================================================

export async function updateOdooPoints(
  email,
  pointsDelta,
  shopUrl,
  orderRef,
  description
) {
  try {
    const normalizedEmail = email?.toLowerCase().trim();
    const delta = Number(pointsDelta);

    if (
      !normalizedEmail ||
      !Number.isFinite(delta) ||
      delta === 0
    ) {
      throw new Error("Invalid Odoo points update parameters.");
    }

    const uid = await executeOdooCall(
      "common",
      "authenticate",
      [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]
    );

    if (!uid) {
      throw new Error("Odoo authentication failed.");
    }

    const partnerIds = await executeOdooCall(
      "object",
      "execute_kw",
      [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        PARTNER_MODEL,
        "search",
        [[["email", "=", normalizedEmail]]],
      ]
    );

    let partnerId;

    if (!partnerIds?.length) {
      partnerId = await executeOdooCall(
        "object",
        "execute_kw",
        [
          ODOO_DB,
          uid,
          ODOO_PASSWORD,
          PARTNER_MODEL,
          "create",
          [
            {
              name: normalizedEmail.split("@")[0],
              email: normalizedEmail,
            },
          ],
        ]
      );
    } else {
      partnerId = partnerIds[0];
    }

    const partnerData = await executeOdooCall(
      "object",
      "execute_kw",
      [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        PARTNER_MODEL,
        "read",
        [[partnerId], [POINTS_FIELD, HISTORY_FIELD]],
      ]
    );

    const currentPoints =
      Number(partnerData[0]?.[POINTS_FIELD]) || 0;

    const currentHistory =
      partnerData[0]?.[HISTORY_FIELD] || "";

    const newPointsTotal = currentPoints + delta;

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dubai",
    });

    const logLine =
      `[${timestamp}] ${delta >= 0 ? "+" : ""}${delta} pts` +
      ` | Order: ${orderRef || "N/A"}` +
      ` | Store: ${shopUrl || "N/A"}` +
      ` | Description: ${description || "Loyalty transaction"}`;

    const updatedHistory = currentHistory
      ? `${logLine}\n${currentHistory}`
      : logLine;

    await executeOdooCall(
      "object",
      "execute_kw",
      [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        PARTNER_MODEL,
        "write",
        [
          [partnerId],
          {
            [POINTS_FIELD]: newPointsTotal,
            [HISTORY_FIELD]: updatedHistory,
          },
        ],
      ]
    );

    console.log(
      `[Odoo Success] Customer ${normalizedEmail}: ${newPointsTotal} points`
    );

    return partnerId;
  } catch (error) {
    console.error(
      "Failed to update Odoo loyalty points:",
      error
    );

    throw error;
  }
}

// ======================================================
// 7. GET SHOPIFY ACCESS TOKEN
// ======================================================

async function getShopifyAccessToken(cleanShop) {
  const subDomain = cleanShop
    .split(".")[0]
    .replace(/-/g, "_")
    .toUpperCase();

  const tokenKey = `SHOPIFY_TOKEN_${subDomain}`;

  // First: custom store token from .env
  let accessToken = process.env[tokenKey];

  if (accessToken) {
    console.log(
      `[Shopify Context] Using environment token: ${tokenKey}`
    );

    return accessToken;
  }

  // Second: Prisma offline session
  console.log(
    `[Shopify Context] Looking for offline session: ${cleanShop}`
  );

  let sessionRecord = await prisma.session.findUnique({
    where: {
      id: `offline_${cleanShop}`,
    },
  });

  if (!sessionRecord?.accessToken) {
    sessionRecord = await prisma.session.findFirst({
      where: {
        shop: cleanShop,
        isOnline: false,
      },
      orderBy: {
        expires: "desc",
      },
    });
  }

  accessToken = sessionRecord?.accessToken;

  return accessToken || null;
}

// ======================================================
// 8. LOADER
// ======================================================

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return jsonResponse({
    success: true,
    message: "Buy loyalty points API is working.",
    conversion: "AED 1 = 1 point",
  });
};

// ======================================================
// 9. CREATE CUSTOM AED POINTS PURCHASE
// ======================================================

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed.",
      },
      405
    );
  }

  try {
    // -----------------------------------------------
    // STEP 1: READ CUSTOMER REQUEST
    // -----------------------------------------------

    const { email, shop: cleanShop } = await getAuthenticatedStorefrontCustomer(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ success: false, error: "Invalid JSON request." }, 400);
    }

    const currency = String(body.currency || "")
      .trim()
      .toUpperCase();

    // New frontend sends amountAED.
    // Do not trust points or amount sent by the browser.
    const amountAED = Number(body.amountAED);

    // -----------------------------------------------
    // STEP 2: VALIDATE REQUEST
    // -----------------------------------------------

    if (currency !== "AED") {
      return jsonResponse(
        {
          success: false,
          error: "Only AED payments are supported.",
        },
        400
      );
    }

    if (
      !Number.isSafeInteger(amountAED) ||
      amountAED < MIN_AMOUNT_AED ||
      amountAED > MAX_AMOUNT_AED
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Enter a whole AED amount between 1 and 100,000.",
        },
        400
      );
    }

    // AED 1 = 1 point.
    // Calculate on the server, never trust browser points.
    const points = amountAED * POINTS_PER_AED;

    console.log("------------------------------------");
    console.log("NEW LOYALTY POINTS PURCHASE");
    console.log("Shop:", cleanShop);
    console.log("Amount AED:", amountAED);
    console.log("Points:", points);
    console.log("------------------------------------");

    // -----------------------------------------------
    // STEP 3: GET SHOPIFY ACCESS TOKEN
    // -----------------------------------------------

    const accessToken = await getShopifyAccessToken(cleanShop);

    if (!accessToken) {
      return jsonResponse(
        {
          success: false,
          error:
            `No Shopify access token found for ${cleanShop}. ` +
            "Please install or authenticate the app.",
        },
        401
      );
    }

    // -----------------------------------------------
    // STEP 4: CREATE SHOPIFY DRAFT ORDER
    // -----------------------------------------------

    const draftRes = await fetch(
      `https://${cleanShop}/admin/api/${SHOPIFY_API_VERSION}/draft_orders.json`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },

        body: JSON.stringify({
          draft_order: {
            line_items: [
              {
                title: `Loyalty Points Purchase - ${points} Points`,
                price: amountAED.toFixed(2),
                quantity: 1,
              },
            ],

            customer: {
              email,
            },

            currency: "AED",

            note: [
              "Loyalty points purchase",
              `Customer: ${email}`,
              `Amount: AED ${amountAED}`,
              `Points: ${points}`,
              "Conversion: AED 1 = 1 point",
              "Points must only be credited after verified payment.",
            ].join("\n"),

            tags: "loyalty-points-purchase",

            note_attributes: [
              {
                name: "is_points_purchase",
                value: "true",
              },
              {
                name: "points_purchase_type",
                value: "CUSTOM_AMOUNT",
              },
              {
                name: "points_purchase_amount_aed",
                value: String(amountAED),
              },
              {
                name: "points_to_add",
                value: String(points),
              },
              {
                name: "points_conversion",
                value: "1 AED = 1 point",
              },
              {
                name: "points_purchase_shop",
                value: cleanShop,
              },
              {
                name: "points_purchase_email",
                value: email,
              },
            ],
          },
        }),
      }
    );

    const draftData = await draftRes.json();

    if (!draftRes.ok) {
      console.error(
        "Shopify Draft Order Error:",
        draftData
      );

      return jsonResponse(
        {
          success: false,
          error:
            draftData.errors
              ? "Shopify rejected the draft order."
              : "Unable to create the purchase.",
          details: draftData.errors || draftData,
        },
        draftRes.status
      );
    }

    const draftOrder = draftData?.draft_order;

    const draftId = draftOrder?.id;

    if (!draftId) {
      console.error(
        "Draft order ID missing:",
        draftData
      );

      return jsonResponse(
        {
          success: false,
          error: "Shopify did not return a draft order ID.",
        },
        500
      );
    }

    console.log(
      `[Shopify] Draft order created: ${draftId}`
    );

    // -----------------------------------------------
    // STEP 5: SEND SHOPIFY INVOICE
    // -----------------------------------------------

    const invoiceRes = await fetch(
      `https://${cleanShop}/admin/api/${SHOPIFY_API_VERSION}/draft_orders/${draftId}/send_invoice.json`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },

        body: JSON.stringify({
          draft_order_invoice: {
            to: email,
            subject: "Complete your loyalty points purchase",

            custom_message:
              `You requested AED ${amountAED} worth of loyalty points. ` +
              `${points} points will be credited after successful payment.`,
          },
        }),
      }
    );

    const invoiceData = await invoiceRes.json();

    if (!invoiceRes.ok) {
      console.error(
        "Shopify Invoice Error:",
        invoiceData
      );

      return jsonResponse(
        {
          success: false,
          error: "Unable to send the Shopify payment invoice.",
          details: invoiceData.errors || invoiceData,
          draftOrderId: draftId,
        },
        invoiceRes.status
      );
    }

    // Shopify may provide the invoice URL in the
    // original draft response or the send-invoice response.
    const checkoutUrl =
      invoiceData?.draft_order?.invoice_url ||
      draftOrder?.invoice_url;

    if (!checkoutUrl) {
      console.error(
        "Invoice URL missing:",
        invoiceData
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Invoice was processed, but Shopify did not return an invoice URL. Check the draft order in Shopify Admin.",
          draftOrderId: draftId,
        },
        502
      );
    }

    // -----------------------------------------------
    // STEP 6: RETURN CHECKOUT URL
    // -----------------------------------------------

    console.log("------------------------------------");
    console.log("POINTS PURCHASE CHECKOUT CREATED");
    console.log("Draft Order:", draftId);
    console.log("Amount AED:", amountAED);
    console.log("Points:", points);
    console.log("------------------------------------");

    return jsonResponse(
      {
        success: true,
        message: "Your points purchase invoice is ready.",

        checkoutUrl,

        draftOrderId: String(draftId),

        amountAED,

        currency: "AED",

        points,

        conversion: "AED 1 = 1 point",

        paymentStatus: "PENDING",
      },
      200
    );

  } catch (error) {
    if (error instanceof Response) throw error;
    console.error(
      "CRITICAL BUY POINTS API ERROR:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Something went wrong while creating your purchase.",
      },
      500
    );
  }
};
