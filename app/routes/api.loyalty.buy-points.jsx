
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



// import shopify from "../shopify.server";
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
//     throw new Error(`Odoo API Error: ${JSON.stringify(data.error)}`);
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

import shopify from "../shopify.server";
import prisma from "../db.server";

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT VARIABLES
// ==========================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Accept",
};

const ODOO_URL = process.env.ODOO_URL || "https://edu-maazkhan1.odoo.com"; 
const ODOO_DB = process.env.ODOO_DB || "edu-maazkhan1";                   
const ODOO_USERNAME = process.env.ODOO_USERNAME || "maazkh2700@gmail.com";  
const ODOO_PASSWORD = process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD; 

const PARTNER_MODEL = "res.partner";
// const POINTS_FIELD = "x_studio_loyalty_points";
// Change this line in your code:
const POINTS_FIELD = "x_studio_loyalty_points_1";

const HISTORY_FIELD = "x_studio_loyalty_history_1";

// ==========================================
// 2. ODOO API CALL HELPER (JSON-RPC)
// ==========================================
async function executeOdooCall(service, method, args) {
  const baseUrl = (ODOO_URL || "").replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Odoo API Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

// ==========================================
// 3. EXPORTED ODOO UTILITIES
// ==========================================
export async function getOdooPoints(email) {
  try {
    const uid = await executeOdooCall("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
    if (!uid) return { totalpoints: 0, availablePoints: 0 };

    const partnerIds = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "search", [[["email", "=", email]]]
    ]);

    if (!partnerIds || partnerIds.length === 0) {
      return { totalpoints: 0, availablePoints: 0 };
    }

    const partnerData = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "read", [[partnerIds[0]], [POINTS_FIELD]]
    ]);

    const points = partnerData[0]?.[POINTS_FIELD] || 0;
    return { totalpoints: points, availablePoints: points };
  } catch (err) {
    console.error("❌ Odoo Read Error:", err);
    return { totalpoints: 0, availablePoints: 0 }; 
  }
}

export async function updateOdooPoints(email, pointsDelta, shopUrl, orderRef, description) {
  try {
    const uid = await executeOdooCall("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
    if (!uid) throw new Error("Authentication error (uid error)");

    let partnerIds = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "search", [[["email", "=", email]]]
    ]);

    let partnerId;
    if (!partnerIds || partnerIds.length === 0) {
      partnerId = await executeOdooCall("object", "execute_kw", [
        ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "create",
        [{ name: email.split("@")[0], email: email }]
      ]);
    } else {
      partnerId = partnerIds[0];
    }

    const partnerData = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "read", [[partnerId], [POINTS_FIELD, HISTORY_FIELD]]
    ]);

    const currentPoints = partnerData[0]?.[POINTS_FIELD] || 0;
    const currentHistory = partnerData[0]?.[HISTORY_FIELD] || "";
    const newPointsTotal = currentPoints + pointsDelta;

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const logLine = `[${timestamp}] ${pointsDelta >= 0 ? '+' : ''}${pointsDelta} pts | Order: ${orderRef || 'N/A'} | Store: ${shopUrl || 'N/A'}`;
    const updatedHistory = currentHistory ? `${logLine}\n${currentHistory}` : logLine;

    await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "write",
      [
        [partnerId], 
        { 
          [POINTS_FIELD]: newPointsTotal,
          [HISTORY_FIELD]: updatedHistory
        }
      ]
    ]);

    console.log(`✅ [Odoo Success] Updated points to ${newPointsTotal} on contact ID ${partnerId}`);
    return partnerId;
  } catch (error) {
    console.error("❌ Failed to sync points transaction to Odoo:", error);
    throw error;
  }
}

// ==========================================
// 4. SHOPIFY ROUTER HANDLERS
// ==========================================
export const loader = async () => {
  return new Response("Buy points API working", { headers: corsHeaders });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const rawShop = body.shop || "";
    const cleanShop = rawShop.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    const points = Number(body.points);

    if (!email || !cleanShop || !points) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters (email, shop, or points)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = points;

    /* ---------------- GET ACCESS TOKEN ---------------- */
    // 1. Try resolving custom .env variable token first (e.g. SHOPIFY_TOKEN_DASHBOARD_CUSTOMER)
    const subDomain = cleanShop.split(".")[0].replace(/-/g, "_").toUpperCase();
    const tokenKey = `SHOPIFY_TOKEN_${subDomain}`;
    let accessToken = process.env[tokenKey];

    if (accessToken) {
      console.log(`[Shopify Context] Using direct .env Access Token for key: ${tokenKey}`);
    } else {
      // 2. Fallback to Prisma SQLite Session store if no custom env token is supplied
      console.log(`[Shopify Context] Querying active offline token from database for: ${cleanShop}`);
      const offlineSessionId = `offline_${cleanShop}`;
      
      let sessionRecord = await prisma.session.findUnique({
        where: { id: offlineSessionId },
      });

      if (!sessionRecord || !sessionRecord.accessToken) {
        sessionRecord = await prisma.session.findFirst({
          where: { shop: cleanShop, isOnline: false },
          orderBy: { expires: 'desc' }
        });
      }

      accessToken = sessionRecord?.accessToken;
    }

    if (!accessToken) {
      console.log(`❌ No access token found for store: ${cleanShop}`);
      return new Response(
        JSON.stringify({ success: false, error: `Store ${cleanShop} is not authenticated with valid token.` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiVersion = process.env.SHOPIFY_API_VERSION || shopify?.config?.apiVersion || '2024-01';

    /* ---------------- STEP 1: CREATE DRAFT ORDER ---------------- */
    const draftRes = await fetch(
      `https://${cleanShop}/admin/api/${apiVersion}/draft_orders.json`,
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
                title: `Buy Loyalty Points (${points} Pts)`, 
                price: amount.toString(), 
                quantity: 1,
              },
            ],
            customer: { email: email },
            note_attributes: [
              { name: "is_points_purchase", value: "true" },
              { name: "points_to_add", value: points.toString() }
            ]
          },
        }),
      }
    );

    const draftData = await draftRes.json();
    
    if (draftData.errors) {
      console.error("🟡 Draft Error Response:", draftData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify rejected token credentials directly.",
          details: draftData.errors
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const draftId = draftData?.draft_order?.id;
    if (!draftId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Draft order creation failed structurally",
          shopifyResponse: draftData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* ---------------- STEP 2: SEND INVOICE ---------------- */
    const invoiceRes = await fetch(
      `https://${cleanShop}/admin/api/${apiVersion}/draft_orders/${draftId}/send_invoice.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          draft_order_invoice: {
            to: email,
            subject: "Complete your purchase",
            custom_message: "Click to complete your points purchase",
          },
        }),
      }
    );

    const invoiceData = await invoiceRes.json();
    const invoiceUrl = draftData?.draft_order?.invoice_url;

    if (!invoiceUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invoice URL generation failed",
          draft: draftData,
          invoice: invoiceData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, checkoutUrl: invoiceUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 CRITICAL ROUTER ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};