import xmlrpc from 'xmlrpc';

// const url = process.env.ODOO_URL;
// const db = process.env.ODOO_DB;
// const username = process.env.ODOO_USERNAME;
// const apiKey = process.env.ODOO_API_KEY;

// // Helper function to handle async XML-RPC calls cleanly
// const callOdoo = (path, method, args) => {
//   const client = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/${path}` });
//   return new Promise((resolve, reject) => {
//     client.methodCall(method, args, (error, value) => {
//       if (error) reject(error);
//       else resolve(value);
//     });
//   });
// };

// /**
//  * Reads points for a given customer email from Odoo
//  */
// export async function getOdooPoints(email) {
//   try {
//     const uid = await callOdoo('common', 'authenticate', [db, username, apiKey, {}]);
//     if (!uid) return null;

//     // Search for customer by email
//     const partnerIds = await callOdoo('object', 'execute_kw', [
//       db, uid, apiKey, 'res.partner', 'search', [[['email', '=', email]]]
//     ]);

//     if (!partnerIds.length) return { totalpoints: 0, availablePoints: 0 };

//     // Fetch the custom points field (x_loyalty_points) from the partner profile
//     const partners = await callOdoo('object', 'execute_kw', [
//       db, uid, apiKey, 'res.partner', 'read', [partnerIds, ['x_loyalty_points']]
//     ]);

//     return {
//       totalpoints: partners[0].x_loyalty_points || 0,
//       availablePoints: partners[0].x_loyalty_points || 0,
//     };
//   } catch (err) {
//     console.error("❌ Odoo Read Error (Falling back to MongoDB):", err);
//     return null; 
//   }
// }

// /**
//  * Increments points for a customer email inside Odoo
//  */


// // export async function updateOdooPoints(email, pointsToAdd) {
// //   try {
// //     const uid = await callOdoo('common', 'authenticate', [db, username, apiKey, {}]);
// //     if (!uid) return false;

// //     // Locate the customer profile
// //     const partnerIds = await callOdoo('object', 'execute_kw', [
// //       db, uid, apiKey, 'res.partner', 'search', [[['email', '=', email]]]
// //     ]);

// //     if (partnerIds.length) {
// //       // 1. Fetch current points balance
// //       const partners = await callOdoo('object', 'execute_kw', [
// //         db, uid, apiKey, 'res.partner', 'read', [partnerIds, ['x_loyalty_points']]
// //       ]);
// //       const currentPoints = partners[0].x_loyalty_points || 0;
// //       const newPoints = currentPoints + pointsToAdd;

// //       // 2. Write updated total back to Odoo
// //       await callOdoo('object', 'execute_kw', [
// //         db, uid, apiKey, 'res.partner', 'write', [partnerIds, { 'x_loyalty_points': newPoints }]
// //       ]);
// //       console.log(`✅ Successfully synced +${pointsToAdd} points to Odoo for ${email}`);
// //       return true;
// //     } else {
// //       console.log(`ℹ️ Customer ${email} not found in Odoo during points calculation.`);
// //       return false;
// //     }
// //   } catch (err) {
// //     console.error("❌ Failed to sync points to Odoo:", err);
// //     return false;
// //   }
// // }


// // ==========================================
// // 1. CONFIGURATION (Replace with your info!)
// // ==========================================
// // app/lib/odoo.server.js

// const ODOO_URL = process.env.ODOO_URL || "https://test1106.odoo.com"; 
// const ODOO_DB = process.env.ODOO_DB || "test1106";                   
// const ODOO_USERNAME = process.env.ODOO_USERNAME || "itaphrodit@gmail.com";  
// const ODOO_PASSWORD = process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD || "[REMOVED_EXPOSED_CREDENTIAL]";
// // ==========================================
// // 2. HELPER TO HANDLE DIRECT ODOO API CALLS
// // ==========================================
// async function executeOdooCall(service, method, args) {
//   const response = await fetch(`${ODOO_URL}/jsonrpc`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       jsonrpc: "2.0",
//       method: "call",
//       params: {
//         service: service,
//         method: method,
//         args: args,
//       },
//     }),
//   });

//   const data = await response.json();
//   if (data.error) {
//     throw new Error(`Odoo API Error: ${JSON.stringify(data.error)}`);
//   }
//   return data.result;
// }

// // ==========================================
// // 3. EXPORTED FUNCTION FOR YOUR WEBHOOKS
// // ==========================================
// export async function updateOdooPoints(email, pointsDelta, shopUrl, orderRef, description) {

//     try {
//         console.log(`[]oddo syn authentications...`)
// //A authentication code 
//         const uid = await executeOdooCall("common" , "authenticate" , [
//             ODOO_DB,
//             ODOO_USERNAME,
//             ODOO_PASSWORD,
//             {}
//         ])

//         if (!uid) {
//             throw new Error("Authentication error check ur db email and all (uid error)")
//         }

//         console.log(`[Oddo sync Authentication suceffuly UID : ${uid}]`)

//         console.log(`[Oddo sync Authentication suceffuly Email : ${email}]`)


//         ///B search for cutomer's Oddo partner Id using their email
//         const partnerIds  = await executeOdooCall("object" , "execute_kw",[
//             ODOO_DB,
//               uid,
//             ODOO_PASSWORD,
//             "res.partner",
//             "search",
//             [[["email" , "=" , email]]]
//         ])

//         if (!partnerIds || partnerIds.length === 0 ) {
//             console.log(`[Oddo Warning] No partner found in Odoo matching email : ${email}`)
//             return null
//         }
//         const partnerId = partnerIds[0];

//         // c read the currct  points 

//         console.log(`[oddo syncu] Reafing ur current Total points balance`)
//         const partnerData = await executeOdooCall("object" , "execute_kw",[
//             ODOO_DB,
//             uid,
//             ODOO_PASSWORD,
//             "res.partner",
//             "read",
//             [[partnerId], ["x_loyalty_points"]]
//         ]);

//         const currentPoints = partnerData[0]?.x_loyalty_points || 0
//         const newPointstotal = currentPoints + pointsDelta;

//         console.log(`[Oddo sync] Current: ${currentPoints} | Delta : ${pointsDelta} |  new total :${newPointstotal}`)

//         //D now updae it
//         await executeOdooCall("object" , "execute_kw" ,[
//             ODOO_DB,
//             uid,
//             ODOO_PASSWORD,
//             "res.partner",
//             "write",
//             [[partnerId] , {x_loyalty_points : newPointstotal}]
//         ])
//         console.log(`new points updated succefully ${newPointstotal}`)


//         // E create the col in odod for the transaction 

//         console.log(`[Oddo sync adding  enter of ur points: ${pointsDelta} for ur email partenrs Id ${partnerId}...]`)

//         const colLine = await executeOdooCall("object" , "execute_kw" , [
//             ODOO_DB,
//             uid,
//             ODOO_PASSWORD,
//             // this is the that table name 
//             "x_res_partner_line_a24f8",
//             "create",
//             [{
//                 x_res_partner_id : partnerId,
//                 x_studio_points_delta : pointsDelta,
//                 x_studio_shopify_order_ref : orderRef,
//                 x_studio_store_url : shopUrl,
//                 x_name : description ||     `for loyality ${email}`
//             }]
//         ])
//         console.log(`[Oddo success ] Row created succefully ${colLine}`)
//         return colLine

//     } catch (error) {
//         console.error("faild to syn the points transaction")
//         throw error
//     }
// }


// app/lib/odoo.server.js
// app/lib/odoo.server.js

// 1. CONFIGURATION & ENVIRONMENT VARIABLES
const ODOO_URL = process.env.ODOO_URL; 
const ODOO_DB = process.env.ODOO_DB;                   
const ODOO_USERNAME = process.env.ODOO_USERNAME;  
const ODOO_PASSWORD = process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD;

// Odoo Target Model: Contact Form
const PARTNER_MODEL = "res.partner";

// Technical Field Names on res.partner in Odoo Studio
// const POINTS_FIELD = "x_studio_loyalty_points";
// Change this line in your code:
const POINTS_FIELD = "x_studio_loyalty_points_1";

const HISTORY_FIELD = "x_studio_loyalty_history_1"; 

/**
 * HELPER: Direct Odoo JSON-RPC API Call Handler
 */
async function executeOdooCall(service, method, args) {
  const baseUrl = (ODOO_URL || "").replace(/\/+$/, '');
  const targetUrl = `${baseUrl}/jsonrpc`;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: service,
        method: method,
        args: args,
      },
    }),
  });

  const rawText = await response.text();

  if (!response.ok || rawText.trim().startsWith('<')) {
    console.error(`❌ Odoo Endpoint Error [${response.status}]: Called ${targetUrl}`);
    throw new Error(`Odoo returned non-JSON response. Check ODOO_URL in .env!`);
  }

  const data = JSON.parse(rawText);
  if (data.error) {
    throw new Error(`Odoo API Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

/**
 * 1. READ POINTS FOR A CUSTOMER BY EMAIL
 */




export async function getOdooPoints(email) {
  try {
    const uid = await executeOdooCall("common", "authenticate", [
      ODOO_DB,
      ODOO_USERNAME,
      ODOO_PASSWORD,
      {}
    ]);

    if (!uid) return { totalpoints: 0, availablePoints: 0 };

    const partnerIds = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "search", [[["email", "=", email]]]
    ]);

    if (!partnerIds || partnerIds.length === 0) {
      return { totalpoints: 0, availablePoints: 0 , history : ""};
    }

    // Read using the updated POINTS_FIELD ("x_studio_loyalty_points_1")
    const partnerData = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "read",
      [[partnerIds[0]], [POINTS_FIELD , HISTORY_FIELD]]
    ]);

    const rawPoints = partnerData[0]?.[POINTS_FIELD];
    const points = typeof rawPoints === "number" ? rawPoints : 0;

    return {
      totalpoints: points,
      availablePoints: points,
      history: partnerData[0]?.[HISTORY_FIELD] || ""
    };
  } catch (err) {
    console.error("❌ Odoo Read Error:", err);
    return { totalpoints: 0, availablePoints: 0 };
  }
}

/**
 * 2. UPDATE POINTS & APPEND TRANSACTION HISTORY LOG
 */
export async function updateOdooPoints(email, pointsDelta, shopUrl, orderRef, description) {
  try {
    console.log(`[Odoo Sync] Authenticating for DB: ${ODOO_DB}...`);
    
    // A. Authenticate and get User ID (UID)
    const uid = await executeOdooCall("common", "authenticate", [
      ODOO_DB,
      ODOO_USERNAME,
      ODOO_PASSWORD,
      {}
    ]);

    if (!uid) {
      throw new Error("Authentication failed. Check your Odoo DB, Username, or API Key.");
    }

    // B. Search for customer contact or auto-create if missing
    let partnerIds = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "search", [[["email", "=", email]]]
    ]);

    let partnerId;
    if (!partnerIds || partnerIds.length === 0) {
      console.log(`[Odoo Info] Creating new contact record for ${email}...`);
      partnerId = await executeOdooCall("object", "execute_kw", [
        ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "create",
        [{ name: email.split("@")[0], email: email }]
      ]);
      console.log(`✅ [Odoo Success] Created partner ID: ${partnerId}`);
    } else {
      partnerId = partnerIds[0];
    }

    // C. Read current points and existing text history string
    const partnerData = await executeOdooCall("object", "execute_kw", [
      ODOO_DB, uid, ODOO_PASSWORD, PARTNER_MODEL, "read",
      [[partnerId], [POINTS_FIELD, HISTORY_FIELD]]
    ]);

    const currentPoints = partnerData[0]?.[POINTS_FIELD] || 0;
    const currentHistory = partnerData[0]?.[HISTORY_FIELD] || "";
    const newPointsTotal = currentPoints + pointsDelta;

    // D. Build the new log line
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const logLine = `[${timestamp}] ${pointsDelta >= 0 ? '+' : ''}${pointsDelta} pts | Order: ${orderRef || 'N/A'} | Store: ${shopUrl || 'N/A'}`;
    const updatedHistory = currentHistory ? `${logLine}\n${currentHistory}` : logLine;

    // E. Save updated points and history back to res.partner
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

    console.log(`✅ [Odoo Success] Updated points to ${newPointsTotal} & logged transaction into field!`);
    return partnerId;

  } catch (error) {
    console.error("❌ Failed to sync points to Odoo:", error);
    throw error;
  }
}

/**
 * 3. READ MEMBERSHIP DATA FOR A CUSTOMER
 *
 * Configure custom fields on Odoo res.partner. Override the default technical
 * field names through environment variables if Odoo Studio generated others:
 * ODOO_MEMBERSHIP_TIER_FIELD, ODOO_INVESTMENT_AMOUNT_FIELD,
 * ODOO_INFINITE_APPROVED_FIELD.
 */
const MEMBERSHIP_TIER_FIELD =
  process.env.ODOO_MEMBERSHIP_TIER_FIELD || "x_studio_membership_tier_2";
const INVESTMENT_AMOUNT_FIELD =
  process.env.ODOO_INVESTMENT_AMOUNT_FIELD || "x_studio_investment_amount_aed";
const INFINITE_APPROVED_FIELD =
  process.env.ODOO_INFINITE_APPROVED_FIELD || "x_studio_infinite_invitation_approved";
const QUALIFYING_SPEND_FIELD =
  process.env.ODOO_QUALIFYING_SPEND_FIELD || "x_studio_qualifying_spend_aed";

export async function getOdooMembership(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Customer email is required to read Odoo membership.");
  }

  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
    throw new Error("Odoo environment variables are not fully configured.");
  }

  const uid = await executeOdooCall("common", "authenticate", [
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_PASSWORD,
    {},
  ]);
  if (!uid) throw new Error("Odoo authentication failed.");

  const partnerIds = await executeOdooCall("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_PASSWORD,
    PARTNER_MODEL,
    "search",
    [[["email", "ilike", normalizedEmail]]],
    { limit: 1 },
  ]);

  if (!Array.isArray(partnerIds) || partnerIds.length === 0) return null;

  const fields = [
    "name",
    "email",
    MEMBERSHIP_TIER_FIELD,
    INVESTMENT_AMOUNT_FIELD,
    QUALIFYING_SPEND_FIELD,
    INFINITE_APPROVED_FIELD,
  ];
  const rows = await executeOdooCall("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_PASSWORD,
    PARTNER_MODEL,
    "read",
    [[partnerIds[0]], fields],
  ]);

  const partner = rows?.[0];
  if (!partner) return null;

  return {
    partnerId: partner.id,
    name: partner.name || "",
    email: partner.email || normalizedEmail,
    tier: partner[MEMBERSHIP_TIER_FIELD] || null,
    investmentAmount: Number(partner[QUALIFYING_SPEND_FIELD] ?? partner[INVESTMENT_AMOUNT_FIELD] ?? 0),
    infiniteApproved: partner[INFINITE_APPROVED_FIELD] === true,
  };
}
