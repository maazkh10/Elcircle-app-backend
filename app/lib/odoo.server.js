import xmlrpc from 'xmlrpc';

const url = process.env.ODOO_URL;
const db = process.env.ODOO_DB;
const username = process.env.ODOO_USERNAME;
const apiKey = process.env.ODOO_API_KEY;

// Helper function to handle async XML-RPC calls cleanly
const callOdoo = (path, method, args) => {
  const client = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/${path}` });
  return new Promise((resolve, reject) => {
    client.methodCall(method, args, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
};

/**
 * Reads points for a given customer email from Odoo
 */
export async function getOdooPoints(email) {
  try {
    const uid = await callOdoo('common', 'authenticate', [db, username, apiKey, {}]);
    if (!uid) return null;

    // Search for customer by email
    const partnerIds = await callOdoo('object', 'execute_kw', [
      db, uid, apiKey, 'res.partner', 'search', [[['email', '=', email]]]
    ]);

    if (!partnerIds.length) return { totalpoints: 0, availablePoints: 0 };

    // Fetch the custom points field (x_loyalty_points) from the partner profile
    const partners = await callOdoo('object', 'execute_kw', [
      db, uid, apiKey, 'res.partner', 'read', [partnerIds, ['x_loyalty_points']]
    ]);

    return {
      totalpoints: partners[0].x_loyalty_points || 0,
      availablePoints: partners[0].x_loyalty_points || 0,
    };
  } catch (err) {
    console.error("❌ Odoo Read Error (Falling back to MongoDB):", err);
    return null; 
  }
}

/**
 * Increments points for a customer email inside Odoo
 */


// export async function updateOdooPoints(email, pointsToAdd) {
//   try {
//     const uid = await callOdoo('common', 'authenticate', [db, username, apiKey, {}]);
//     if (!uid) return false;

//     // Locate the customer profile
//     const partnerIds = await callOdoo('object', 'execute_kw', [
//       db, uid, apiKey, 'res.partner', 'search', [[['email', '=', email]]]
//     ]);

//     if (partnerIds.length) {
//       // 1. Fetch current points balance
//       const partners = await callOdoo('object', 'execute_kw', [
//         db, uid, apiKey, 'res.partner', 'read', [partnerIds, ['x_loyalty_points']]
//       ]);
//       const currentPoints = partners[0].x_loyalty_points || 0;
//       const newPoints = currentPoints + pointsToAdd;

//       // 2. Write updated total back to Odoo
//       await callOdoo('object', 'execute_kw', [
//         db, uid, apiKey, 'res.partner', 'write', [partnerIds, { 'x_loyalty_points': newPoints }]
//       ]);
//       console.log(`✅ Successfully synced +${pointsToAdd} points to Odoo for ${email}`);
//       return true;
//     } else {
//       console.log(`ℹ️ Customer ${email} not found in Odoo during points calculation.`);
//       return false;
//     }
//   } catch (err) {
//     console.error("❌ Failed to sync points to Odoo:", err);
//     return false;
//   }
// }


// ==========================================
// 1. CONFIGURATION (Replace with your info!)
// ==========================================
const ODOO_URL = "https://test1106.odoo.com"; // Your exact Odoo URL
const ODOO_DB = "test1106";                   // Your exact Odoo Database name
const ODOO_USERNAME = "itaphrodit@gmail.com";  // Your Odoo admin email
const ODOO_PASSWORD = "Maazkh@10";   // Your Odoo password/API Key

// ==========================================
// 2. HELPER TO HANDLE DIRECT ODOO API CALLS
// ==========================================
async function executeOdooCall(service, method, args) {
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
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

  const data = await response.json();
  if (data.error) {
    throw new Error(`Odoo API Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

// ==========================================
// 3. EXPORTED FUNCTION FOR YOUR WEBHOOKS
// ==========================================
export async function updateOdooPoints(email, pointsDelta, shopUrl, orderRef, description) {

    try {
        console.log(`[]oddo syn authentications...`)
//A authentication code 
        const uid = await executeOdooCall("common" , "authenticate" , [
            ODOO_DB,
            ODOO_USERNAME,
            ODOO_PASSWORD,
            {}
        ])

        if (!uid) {
            throw new Error("Authentication error check ur db email and all (uid error)")
        }

        console.log(`[Oddo sync Authentication suceffuly UID : ${uid}]`)

        console.log(`[Oddo sync Authentication suceffuly Email : ${email}]`)


        ///B search for cutomer's Oddo partner Id using their email
        const partnerIds  = await executeOdooCall("object" , "execute_kw",[
            ODOO_DB,
              uid,
            ODOO_PASSWORD,
            "res.partner",
            "search",
            [[["email" , "=" , email]]]
        ])

        if (!partnerIds || partnerIds.length === 0 ) {
            console.log(`[Oddo Warning] No partner found in Odoo matching email : ${email}`)
            return null
        }
        const partnerId = partnerIds[0];

        // c read the currct  points 

        console.log(`[oddo syncu] Reafing ur current Total points balance`)
        const partnerData = await executeOdooCall("object" , "execute_kw",[
            ODOO_DB,
            uid,
            ODOO_PASSWORD,
            "res.partner",
            "read",
            [[partnerId], ["x_loyalty_points"]]
        ]);

        const currentPoints = partnerData[0]?.x_loyalty_points || 0
        const newPointstotal = currentPoints + pointsDelta;

        console.log(`[Oddo sync] Current: ${currentPoints} | Delta : ${pointsDelta} |  new total :${newPointstotal}`)

        //D now updae it
        await executeOdooCall("object" , "execute_kw" ,[
            ODOO_DB,
            uid,
            ODOO_PASSWORD,
            "res.partner",
            "write",
            [[partnerId] , {x_loyalty_points : newPointstotal}]
        ])
        console.log(`new points updated succefully ${newPointstotal}`)


        // E create the col in odod for the transaction 

        console.log(`[Oddo sync adding  enter of ur points: ${pointsDelta} for ur email partenrs Id ${partnerId}...]`)

        const colLine = await executeOdooCall("object" , "execute_kw" , [
            ODOO_DB,
            uid,
            ODOO_PASSWORD,
            // this is the that table name 
            "x_res_partner_line_a24f8",
            "create",
            [{
                x_res_partner_id : partnerId,
                x_studio_points_delta : pointsDelta,
                x_studio_shopify_order_ref : orderRef,
                x_studio_store_url : shopUrl,
                x_name : description ||     `for loyality ${email}`
            }]
        ])
        console.log(`[Oddo success ] Row created succefully ${colLine}`)
        return colLine

    } catch (error) {
        console.error("faild to syn the points transaction")
        throw error
    }

}