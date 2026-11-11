import CustomerPoints from "../models/CustomerPoints.server";
import { connectMongo } from "../lib/db.server";
import { authenticate } from "../shopify.server";

export const loader = async () => {
  return new Response("Webhook endpoint active", { status: 200 });
};

export const action = async ({ request }) => {
  try {

    const { shop, payload: order } = await authenticate.webhook(request);

    if (order.financial_status !== "paid") {
      return new Response("Waiting for payment", { status: 200 });
    }

    const email = order.customer?.email?.toLowerCase().trim();

    if (!shop || !email) {
      return new Response("Missing shop/email", { status: 200 });
    }

    const discountCodes = order.discount_codes || [];
    const loyaltyCode = discountCodes.find((d) =>
      d.code.toUpperCase().startsWith("LOYALTY-")
    );

    if (!loyaltyCode) {
      return new Response("No loyalty discount", { status: 200 });
    }

    const usedPoints = Number(loyaltyCode.code.split("-")[1]);

    await connectMongo();
    const customer = await CustomerPoints.findOne({ shop, email });

    if (!customer) {
      return new Response("Customer not found", { status: 200 });
    }

    customer.totalpoints -= usedPoints;

    customer.redeemed.push({
      orderId: order.id,
      pointsUsed: usedPoints,
      date: new Date()
    });

    await customer.save();

    return new Response("Points deducted", { status: 200 });

  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Webhook Error:", err);
    return new Response("Error", { status: 200 });
  }
};
