import CustomerPoints from "../models/CustomerPoints.server";

export const action  = async ({ request }) => {
  
   console.log("WEBHOOK HIT ✅");

  const order = await request.json();

  const email = order.customer?.email;
  
  if (!email) return new Response("No customer");

  const orderTotal = Number(order.total_price);
  
  const earnedPoints = orderTotal;

  let customer = await CustomerPoints.findOne({ email });

  if (!customer) {
    await CustomerPoints.create({
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
