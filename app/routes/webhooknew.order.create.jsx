
import CustomerPoints from "../models/CustomerPoints.server";
 
export const loader = async () =>{
  return new Response ("Webhook endpoints active" , {status: 200})
}


export const action = async ({ request }) => {
  try {
    console.log("webhook hit 💕");

    const shop = request.headers.get("x-shopify-shop-domain");
    const order = await request.json();

    if (!shop) {
      console.log("shop not found");
      return new Response("No shop", { status: 200 });
    }

    if (order.financial_status !== "paid") {
      console.log("waiting for payment");
      return new Response("Waiting for payment", { status: 200 });
    }

    const email = order.customer?.email?.toLowerCase().trim();
    if (!email) {
      console.log("no email found");
      return new Response("No email", { status: 200 });
    }

    const orderTotal = Number(order.total_price);

    let customer = await CustomerPoints.findOne({ shop, email });

    if (!customer) {
      customer = await CustomerPoints.create({
        shop,
        email,
        totalpoints: 0,
        order: [],
        redeemed: []
      });
    }

    /* ===============================
       CHECK IF LOYALTY CODE USED
    =============================== */

    const discountCodes = order.discount_codes || [];
    const loyaltyCode = discountCodes.find((d) =>
      d.code.toUpperCase().startsWith("LOYALTY-")
    );

    if (loyaltyCode) {
      const usedPoints = Number(loyaltyCode.code.split("-")[1]);

      if (customer.totalpoints < usedPoints) {
        console.log("Not enough points to deduct");
        return new Response("Not enough points", { status: 200 });
      }

      customer.totalpoints -= usedPoints;

      customer.redeemed.push({
        orderId: order.id,
        pointsUsed: usedPoints,
        date: new Date()
      });

      await customer.save();

      console.log("Points deducted:", usedPoints);

      return new Response("Points deducted", { status: 200 });
    }

    /* ===============================
       ELSE → EARN POINTS
    =============================== */

    const earnedPoints = orderTotal;

    customer.totalpoints += earnedPoints;

    customer.order.push({
      orderId: order.id,
      pointsEarned: earnedPoints,
      date: new Date()
    });

    await customer.save();

    console.log("Points earned:", earnedPoints);

    return new Response("Points updated", { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response("Error", { status: 200 });
  }
};