import CustomerPoints from "../models/CustomerPoints.server";

export const loader = async () => {
  return new Response("Webhook active", { status: 200 });
};

export const action = async ({ request }) => {

  try {

    console.log("WEBHOOK HIT");

    const shop = request.headers.get("x-shopify-shop-domain");

    const order = await request.json();

    const email = order.customer?.email?.toLowerCase().trim();

    if (!shop || !email) {
      return new Response("Missing data", { status: 200 });
    }

    /* ===============================
       FIND CUSTOMER IN DB
    =============================== */

    let customer = await CustomerPoints.findOne({ shop, email });

    if (!customer) {
      customer = await CustomerPoints.create({
        shop,
        email,
        totalpoints: 0,
        availablePoints: 0,
        order: [],
        redeemed: []
      });
    }

    /* ===============================
       BUY POINTS DETECTION
    =============================== */

    const pointsPurchase = order.line_items.find(
      item => item.title.includes("Buy Loyalty Points")
    );

    if (pointsPurchase) {

      const points = Number(pointsPurchase.price) * pointsPurchase.quantity;

      customer.totalpoints += points;
      customer.availablePoints += points;

      customer.order.push({
        orderId: order.id,
        pointsEarned: points,
        date: new Date()
      });

      await customer.save();

      console.log("Points purchased:", points);

      return new Response("Points added", { status: 200 });
    }

    /* ===============================
       REDEEM POINTS
    =============================== */

    const discountCodes = order.discount_codes || [];

    const loyaltyCode = discountCodes.find(d =>
      d.code.startsWith("LOYALTY-")
    );

    if (loyaltyCode) {

      const usedPoints = Number(loyaltyCode.code.split("-")[1]);

      customer.totalpoints -= usedPoints;
      customer.availablePoints -= usedPoints;

      customer.redeemed.push({
        orderId: order.id,
        pointsUsed: usedPoints,
        date: new Date()
      });

      await customer.save();

      console.log("Points redeemed:", usedPoints);

      return new Response("Points deducted", { status: 200 });
    }

    /* ===============================
       NORMAL ORDER → EARN POINTS
    =============================== */

    const earnedPoints = Number(order.total_price);

    customer.totalpoints += earnedPoints;
    customer.availablePoints += earnedPoints;

    customer.order.push({
      orderId: order.id,
      pointsEarned: earnedPoints,
      date: new Date()
    });

    await customer.save();

    console.log("Points earned:", earnedPoints);

    return new Response("Points earned", { status: 200 });

  } catch (error) {

    console.error("Webhook Error:", error);

    return new Response("Error", { status: 200 });

  }

};