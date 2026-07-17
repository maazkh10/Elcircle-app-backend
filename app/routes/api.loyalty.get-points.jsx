
import { getOdooPoints } from "../lib/odoo.server";

// Define strict, explicit CORS properties
// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "GET, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning, Accept",
//   "Content-Type": "application/json" // Tied directly to the base headers definition
// };

export const loader = async ({ request }) => {

  const headers  = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning, Accept");
  headers.set("Content-Type", "application/json");

  // 1. Instantly respond to preflight OPTIONS checks
  if (request.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: headers 
    });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email parameter" }), {
      status: 400,
      headers: headers
    });
  }

  try {
    const odooData = await getOdooPoints(email);
    const pointsBalance = odooData?.availablePoints || 0;
    
    console.log(`[PROXY SUCCESS] Dispatching ${pointsBalance} points to storefront for ${email}`);

    // 2. Return standard Response with raw stringified JSON data payload
    return new Response(JSON.stringify({ points: pointsBalance }), {
      status: 200,
      headers: headers
    });

  } catch (error) {
    console.error("[PROXY READ ERROR]", error);
    return new Response(JSON.stringify({ points: 0, error: error.message }), {
      status: 500,
      headers: headers
    });
  }
};

export const action = async ({ request }) => {
    const headers  = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning, Accept");
  headers.set("Content-Type", "application/json");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers });
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), { 
    status: 405, 
    headers: headers
  });
};
