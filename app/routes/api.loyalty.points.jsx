import CustomerPoints from "../models/CustomerPoints.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
};

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    const email = url.searchParams.get("email")?.toLowerCase().trim();
    const shop = url.searchParams.get("shop");

    if (!email || !shop) {
      return new Response(
        JSON.stringify({ totalpoints: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer = await CustomerPoints.findOne({ shop, email });

    return new Response(
      JSON.stringify({ totalpoints: customer?.totalpoints || 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("POINTS FETCH ERROR:", error);

    return new Response(
      JSON.stringify({ totalpoints: 0 }),
      { status: 500, headers: corsHeaders }
    );
  }
};