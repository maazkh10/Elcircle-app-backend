
// old code 
// import CustomerPoints from "../models/CustomerPoints.server";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "*",
//   "Content-Type": "application/json",
// };

// export async function loader({ request }) {
//   console.log("LOYALTY ROUTE HIT");

//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: corsHeaders,
//     });
//   }

//   try {
//     const url = new URL(request.url);

//     const email = url.searchParams.get("email")?.toLowerCase()?.trim();
//     const customerId = url.searchParams.get("customerId");
//     const callback = url.searchParams.get("callback");

//     console.log("POINTS REQUEST:", {
//       email,
//       customerId,
//     });

//     let customer = null;

//     if (email) {
//       customer = await CustomerPoints.findOne({
//         email,
//       });
//     } else if (customerId) {
//       customer = await CustomerPoints.findOne({
//         customerId: customerId.toString(),
//       });
//     }

//     const totalpoints = customer?.totalpoints ?? 0;

//     console.log("FOUND CUSTOMER:", customer?._id);
//     console.log("TOTAL POINTS:", totalpoints);

//     const payload = {
//       success: true,
//       totalpoints,
//     };

//     if (callback) {
//       return new Response(
//         `${callback}(${JSON.stringify(payload)})`,
//         {
//           status: 200,
          
//           headers: {
//             ...corsHeaders,
//             "Content-Type": "application/javascript",
//           },
//         }
//       );
//     }

//     return new Response(
//       JSON.stringify(payload),
//       {
//         status: 200,
//         headers: corsHeaders,
//       }
//     );
//   } catch (error) {
//     console.error("POINTS ERROR:", error);

//     return new Response(
//       JSON.stringify({
//         success: false,
//         totalpoints: 0,
//         error: error.message,
//       }),
//       {
//         status: 200,
//         headers: corsHeaders,
//       }
//     );
//   }
// }

// export async function action({ request }) {
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: corsHeaders,
//     });
//   }

//   return new Response(
//     JSON.stringify({
//       error: "Method not allowed",
//     }),
//     {
//       status: 405,
//       headers: corsHeaders,
//     }
//   );
// }


// new code for that oddod 

import CustomerPoints from "../models/CustomerPoints.server";
import { getOdooPoints } from "../lib/odoo.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  console.log("LOYALTY ROUTE HIT");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);

    const email = url.searchParams.get("email")?.toLowerCase()?.trim();
    const customerId = url.searchParams.get("customerId");
    const callback = url.searchParams.get("callback");

    console.log("POINTS REQUEST:", { email, customerId });

    let totalpoints = 0;
    let history = "";

    // 🚀 READ FROM ODOO FIRST
    if (email) {
      const odooData = await getOdooPoints(email);
      if (odooData) {
        totalpoints = odooData.totalpoints ?? odooData.availablePoints ?? 0;
        history = odooData.history || "";
        console.log("FOUND LIVE ODOO POINTS:", totalpoints);
      } else {
        console.log("⚠️ Odoo query failed or returned null. Trying MongoDB fallback...");
        
        // --- MONGODB FALLBACK READ ---
        const customer = await CustomerPoints.findOne({ email });
        totalpoints = customer?.totalpoints ?? 0;
        console.log("FOUND FALLBACK MONGO POINTS:", totalpoints);
      }
    } else if (customerId) {
      const customer = await CustomerPoints.findOne({ customerId: customerId.toString() });
      totalpoints = customer?.totalpoints ?? 0;
      console.log("FOUND MONGO POINTS BY ID:", totalpoints);
    }

    const payload = {
      success: true,
      points: totalpoints,      // Map to both keys for compatibility
      totalpoints: totalpoints,
      history: history,
    };

    if (callback) {
      return new Response(
        `${callback}(${JSON.stringify(payload)})`,
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/javascript",
          },
        }
      );
    }

    return new Response(
      JSON.stringify(payload),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("POINTS ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        points: 0,
        totalpoints: 0,
        history: "",
        error: error.message,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    {
      status: 405,
      headers: corsHeaders,
    }
  );
}