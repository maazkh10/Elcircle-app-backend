import { getOdooPoints } from "../lib/odoo.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const callback = url.searchParams.get("callback");

  if (!email) {
    return jsonResponse({
      success: false,
      points: 0,
      totalpoints: 0,
      history: "",
      error: "Customer email is required",
    }, 400);
  }

  try {
    const odooData = await getOdooPoints(email);

    const payload = {
      success: true,
      points: odooData.totalpoints ?? odooData.availablePoints ?? 0,
      totalpoints: odooData.totalpoints ?? odooData.availablePoints ?? 0,
      history: odooData.history ?? "",
    };

    if (callback) {
      // Accept only a simple JavaScript identifier for JSONP.
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
        return jsonResponse({ success: false, error: "Invalid callback" }, 400);
      }

      return new Response(`${callback}(${JSON.stringify(payload)})`, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/javascript; charset=utf-8",
        },
      });
    }

    return jsonResponse(payload);
  } catch (error) {
    console.error("[Loyalty Points] Odoo read failed:", error);

    return jsonResponse({
      success: false,
      points: 0,
      totalpoints: 0,
      history: "",
      error: "Unable to retrieve loyalty points",
    }, 502);
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}
