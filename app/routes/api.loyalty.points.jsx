import CustomerPoints from "../models/CustomerPoints.server";

/* ----------------------------------
   COMMON CORS HEADERS
---------------------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

/* ----------------------------------
   PREFLIGHT (IMPORTANT)
---------------------------------- */
export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(null, { status: 405, headers: corsHeaders });
};

/* ----------------------------------
   GET CUSTOMER POINTS
---------------------------------- */
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(
        JSON.stringify({ totalpoints: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    const customer = await CustomerPoints.findOne({
      email: email.toLowerCase(),
    });

    return new Response(
      JSON.stringify({
        totalpoints: customer?.totalpoints || 0,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("POINTS API ERROR:", err);

    // IMPORTANT: even errors return CORS headers
    return new Response(
      JSON.stringify({
        totalpoints: 0,
        error: "Server error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
