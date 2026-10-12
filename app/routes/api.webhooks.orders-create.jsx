import CustomerPoints from "../models/CustomerPoints.server";
import { updateOdooPoints } from "../lib/odoo.server";

export const action = async ({ request }) => {
  console.log("WEBHOOK HIT ✅");

  try {
    const order = await request.json();
    
    // Fallback: Check header first, then try order.shop_url, then payload domain
    const rawShop = request.headers.get("x-shopify-shop-domain") || order.shop_url || "";
    const cleanShop = rawShop.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();

    // Only process paid orders
    if (order.financial_status !== "paid") {
      return new Response("Waiting for payment", { status: 200 });
    }

    const email = order.customer?.email?.toLowerCase()?.trim();
    if (!email) {
      console.warn("⚠️ Webhook skipped: No customer email found in payload.");
      return new Response("No customer email", { status: 200 });
    }

    if (!cleanShop) {
      console.error("❌ Webhook failed: Unable to determine shop domain.");
      return new Response("Missing shop domain", { status: 400 });
    }

    // Calculate points earned (1 point per unit currency spent)
    const orderTotal = Number(order.total_price) || 0;
    const earnedPoints = Math.floor(orderTotal);
    const orderRef = order.name || `#${order.order_number}` || String(order.id);

    if (earnedPoints <= 0) {
      console.log(`[SYNC SKIPPED] 0 points earned for order ${orderRef}`);
      return new Response("Order total resulted in 0 points", { status: 200 });
    }

    // 1. SYNC WITH ODOO
    console.log(`[Odoo Sync] Awarding ${earnedPoints} points to ${email} for order ${orderRef}...`);
    
    await updateOdooPoints(
      email,
      earnedPoints,
      cleanShop,
      orderRef,
      `Order Earned Points: ${orderRef}`
    );

    // 2. MONGODB FALLBACK SYNC
    let customer = await CustomerPoints.findOne({ shop: cleanShop, email: email });

    if (!customer) {
      customer = await CustomerPoints.create({
        shop: cleanShop,
        email: email,
        totalpoints: earnedPoints,
        availablePoints: earnedPoints,
        order: [{
          orderId: String(order.id),
          pointsEarned: earnedPoints,
          date: new Date()
        }],
        redeemed: []
      });
    } else {
      customer.totalpoints += earnedPoints;
      customer.availablePoints += earnedPoints;

      customer.order.push({
        orderId: String(order.id),
        pointsEarned: earnedPoints,
        date: new Date()
      });

      await customer.save();
    }

    console.log(`✅ [SUCCESS] Synced ${earnedPoints} points for ${email} across Odoo & MongoDB.`);
    return new Response("Points updated successfully", { status: 200 });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};