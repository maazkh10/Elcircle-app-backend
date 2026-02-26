import CustomerPoints from "../models/CustomerPoints.server";

export const action  = async ({ request }) => {
  
   console.log("WEBHOOK HIT ✅");

  const order = await request.json();

const shop = request.headers.get("x-shopify-shop-domain");




  const email = order.customer?.email;

  

  if (order.financial_status !== "paid") {
      return new Response("Waiting for payment", { status: 200 });
    }


  if (!email) return new Response("No customer");

  const orderTotal = Number(order.total_price);
  
  const earnedPoints = orderTotal;

  let customer = await CustomerPoints.findOne({ shop, email });

  if (!customer) {
    await CustomerPoints.create({
      shop,
      email,
      totalpoints: earnedPoints,
      availablePoints: earnedPoints,
      order: [{
        orderId: order.id,
        pointsEarned: earnedPoints,
        date: new Date()
      }]
    });
  } else {
    customer.totalpoints += earnedPoints;
    customer.availablePoints += earnedPoints;

    customer.order.push({
      orderId: order.id,
      pointsEarned: earnedPoints,
      date: new Date()
    });

    await customer.save();
  }

  return new Response("Points updated");
};
