import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";
// import { getOdooPoints } from "../lib/odoo.server";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "*",
//   "Content-Type": "application/json",
// };

// function jsonResponse(payload, status = 200) {
//   return new Response(JSON.stringify(payload), {
//     status,
//     headers: corsHeaders,
//   });
// }

// export async function loader({ request }) {
//   if (request.method === "OPTIONS") {
//     return new Response(null, { status: 204, headers: corsHeaders });
//   }

//   const url = new URL(request.url);
//   const email = url.searchParams.get("email")?.trim().toLowerCase();
//   const callback = url.searchParams.get("callback");

//   if (!email) {
//     return jsonResponse({
//       success: false,
//       points: 0,
//       totalpoints: 0,
//       history: "",
//       error: "Customer email is required",
//     }, 400);
//   }

//   try {
//     const odooData = await getOdooPoints(email);

//     const payload = {
//       success: true,
//       points: odooData.totalpoints ?? odooData.availablePoints ?? 0,
//       totalpoints: odooData.totalpoints ?? odooData.availablePoints ?? 0,
//       history: odooData.history ?? "",
//     };

//     if (callback) {
//       // Accept only a simple JavaScript identifier for JSONP.
//       if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
//         return jsonResponse({ success: false, error: "Invalid callback" }, 400);
//       }

//       return new Response(`${callback}(${JSON.stringify(payload)})`, {
//         status: 200,
//         headers: {
//           ...corsHeaders,
//           "Content-Type": "application/javascript; charset=utf-8",
//         },
//       });
//     }

//     return jsonResponse(payload);
//   } catch (error) {
//     console.error("[Loyalty Points] Odoo read failed:", error);

//     return jsonResponse({
//       success: false,
//       points: 0,
//       totalpoints: 0,
//       history: "",
//       error: "Unable to retrieve loyalty points",
//     }, 502);
//   }
// }

// export async function action({ request }) {
//   if (request.method === "OPTIONS") {
//     return new Response(null, { status: 204, headers: corsHeaders });
//   }

//   return jsonResponse({ error: "Method not allowed" }, 405);
// }



// new code for fetching thing

import {
  getOdooPoints,
  getOdooMembership,
} from "../lib/odoo.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function parseHistory(history) {
  if (Array.isArray(history)) return history;

  if (typeof history !== "string" || !history.trim()) {
    return [];
  }

  // Support history stored as a JSON array.
  try {
    const parsed = JSON.parse(history);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Existing Odoo history may be plain text instead of JSON.
  }

  // Support the existing newline-separated history format.
  return history
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((description, index) => ({
      id: `history-${index}`,
      description,
    }));
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const { email } = await getAuthenticatedStorefrontCustomer(request);

  try {
    const [odooData, membership] = await Promise.all([
      getOdooPoints(email),
      getOdooMembership(email),
    ]);

    if (!membership) {
      return jsonResponse(
        {
          success: false,
          error: "Customer was not found in Odoo",
        },
        404
      );
    }

    const points = Number(
      odooData?.totalpoints ??
      odooData?.availablePoints ??
      0
    );

    const history = parseHistory(odooData?.history);

    const payload = {
      success: true,

      // Loyalty points
      points,
      totalpoints: points,

      // Membership values read from Odoo
      tier: membership.tier,
      infiniteApproved: membership.infiniteApproved,
      lifetimeSpend: membership.investmentAmount,
      totalSpend: membership.investmentAmount,

      // History is the existing Odoo text history.
      history: odooData?.history ?? "",
      transactions: history,
      activity: history,

      // Not connected until the real Odoo field is confirmed.
      storeCredit: null,
    };

    return jsonResponse(payload);
  } catch (error) {
    console.error(
      "[Loyalty Points] Odoo read failed:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error: "Unable to retrieve membership data from Odoo",
      },
      502
    );
  }
}

export async function action() {
  return jsonResponse(
    { success: false, error: "Method not allowed" },
    405
  );
}
