


// import { connectDB } from "../lib/db.server";

import CustomerPoints from "../models/CustomerPoints.server";

// loader one 
export const loader = async () =>{

    return new Response("Webhook code  one api")
}


export const action = async ({ request }) => {
  try {

    // await connectDB()

    console.log("🔥 ORDER WEBHOOK RECEIVED");

    const order = await request.json();

    console.log("Discount codes:", order.discount_codes);

    const email = order.customer?.email;
    if (!email) return new Response("No customer");

    const loyaltyCode = order.discount_codes?.find(
      d => d.code.startsWith("LOYALTY-")
    );

    if (!loyaltyCode) {
      console.log("No loyalty discount used");
      return new Response("No loyalty code");
    }

    const usedPoints = Number(loyaltyCode.code.split("-")[1]);

    const customer = await CustomerPoints.findOne({
      email: email.toLowerCase()
    });

    if (!customer) return new Response("Customer not found");

    customer.availablePoints -= usedPoints;
    await customer.save();

    console.log("✅ Points deducted:", usedPoints);

    return new Response("OK");
  } catch (err) {
    console.log("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
};
