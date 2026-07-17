import prisma from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async () => {
  return new Response("Buy points API working", { headers: corsHeaders });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, 
      { status: 204, 
        headers: corsHeaders });
  }

  try {
    const body = await request.json();

    const email = body.email?.toLowerCase().trim();
    const shop = body.shop;
    const points = Number(body.points);

    if (!email || !shop || !points) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 💰 1 point = $1
    const amount = points;

    /* ---------------- GET ACCESS TOKEN ---------------- */
const session = await prisma.session.findFirst({
  where: {
    shop: shop,
    isOnline: false,
  },
});

if (!session) {
  console.log("No session for shop:", shop);    

  return new Response(
    JSON.stringify({
      success: false,
      error: "App not installed on this store"
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

    console.log(session , "session")

    const accessToken = session?.accessToken;

    if (!accessToken) {
      throw new Error("No access token found for shop");
    }

    /* ---------------- STEP 1: CREATE DRAFT ORDER ---------------- */
    const draftRes = await fetch(
      `https://${shop}/admin/api/2024-01/draft_orders.json`,
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
                title: `Buy ${points} Points`,
                price: amount.toString(), 
                quantity: 1,
              },
            ],
            customer: {
              email: email,
            },
          },
        }),
      }
    );

    const draftData = await draftRes.json();
    console.log("🟡 Draft Response:", draftData);

    const draftId = draftData?.draft_order?.id;

    if (!draftId) {

      return new Response(

        JSON.stringify({
        
          success: false,
        
          error: "Draft order creation failed",
        
          shopifyResponse: draftData,
        
        }),
        
        {
        
          status: 500,
        
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        
        }
      );
    }

    /* ---------------- STEP 2: SEND INVOICE (GENERATES CHECKOUT URL) ---------------- */
    const invoiceRes = await fetch(
      
      `https://${shop}/admin/api/2024-01/draft_orders/${draftId}/send_invoice.json`,
      
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
    
    console.log("🟢 Invoice Response:", invoiceData);

    const invoiceUrl = draftData?.draft_order?.invoice_url;

    if (!invoiceUrl) {
    
      return new Response(
    
        JSON.stringify({
    
          success: false,
    
          error: "Invoice URL not generated",
    
          draft: draftData,
    
          invoice: invoiceData,
    
        }),
    
        {
    
          status: 500,
    
          headers: { ...corsHeaders, "Content-Type": "application/json" },
    
        }
    
      );
    
    }

    /* ---------------- SUCCESS ---------------- */
    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: invoiceUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔥 ERROR:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};