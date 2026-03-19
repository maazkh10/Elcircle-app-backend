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

    const rawShop = url.searchParams.get("shop");

    const shop = rawShop
      ?.toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    console.log("QUERY:", { email, shop });

    if (!email) {
      return new Response(
        JSON.stringify({ totalpoints: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ GLOBAL USER (IGNORE SHOP)
    let customer = await CustomerPoints.findOne({ email });

    if (!customer) {
      console.log("Creating global customer...");

      customer = await CustomerPoints.create({
        email,
        shop, // just stored, not used for lookup
        totalpoints: 0,
        availablePoints: 0,
      });
    }

    return new Response(
      JSON.stringify({ totalpoints: customer.totalpoints }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("POINTS ERROR:", error);

    return new Response(
      JSON.stringify({ totalpoints: 0 }),
      { status: 500, headers: corsHeaders }
    );
  }
};