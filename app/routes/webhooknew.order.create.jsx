// old code this one 
// import CustomerPoints from "../models/CustomerPoints.server";

// export const loader = async () => {
// return new Response("Webhook active", { status: 200 });
// };

// export const action = async ({ request }) => {
// try {
// console.log("WEBHOOK HIT");

// const shop = request.headers.get("x-shopify-shop-domain");
// const order = await request.json();
// const email = order.customer?.email?.toLowerCase().trim();

// if (!shop || !email) {
//   return new Response("Missing data", { status: 200 });
// }

// /* ===============================
//    FIND CUSTOMER (GLOBAL EMAIL)
// =============================== */

// let customer = await CustomerPoints.findOne({ email });

// if (!customer) {
//   customer = await CustomerPoints.create({
//     shop,
//     email,
//     totalpoints: 0,
//     availablePoints: 0,
//     order: [],
//     redeemed: []
//   });
// }

// /* ===============================
//    PREVENT DUPLICATE PROCESSING
// =============================== */

// const alreadyProcessed =
//   customer.order.some(o => o.orderId === order.id) ||
//   customer.redeemed.some(r => r.orderId === order.id);

// if (alreadyProcessed) {
//   console.log("Order already processed:", order.id);
//   return new Response("Already processed", { status: 200 });
// }

// /* ===============================
//    BUY POINTS DETECTION
// =============================== */

// const pointsPurchase = order.line_items.find(
//   item => item.title.includes("Buy Loyalty Points")
// );

// if (pointsPurchase) {
//   const points =
//     Number(pointsPurchase.price) * pointsPurchase.quantity;

//   customer.totalpoints += points;
//   customer.availablePoints += points;

//   customer.order.push({
//     orderId: order.id,
//     pointsEarned: points,
//     date: new Date()
//   });

//   await customer.save();

//   console.log("Points purchased:", points);

//   return new Response("Points added", { status: 200 });
// }

// /* ===============================
//    REDEEM POINTS
// =============================== */

// /* ===============================
//    REDEEM POINTS
// =============================== */

// const discountCodes = order.discount_codes || [];

// // Look for your generated codes (which start with "LOYAL-")
// const loyaltyCode = discountCodes.find(d =>
//   d.code.startsWith("LOYAL-")
// );

// if (loyaltyCode) {
//   const appliedCodeString = loyaltyCode.code; // e.g., "LOYAL-WXEYQN"

//   // Find the matching pending redemption entry we stored during the checkout click
//   const pendingRewardIndex = customer.redeemed.findIndex(
//     r => r.code === appliedCodeString && r.status === "pending"
//   );

//   if (pendingRewardIndex !== -1) {
//     const pointsToDeduct = customer.redeemed[pendingRewardIndex].pointsUsed;

//     // Deduct the points now that payment is confirmed
//     customer.totalpoints -= pointsToDeduct;
//     customer.availablePoints -= pointsToDeduct;

//     // Update the pending entry so we link it to this final Order ID and mark it completed
//     customer.redeemed[pendingRewardIndex].orderId = order.id;
//     customer.redeemed[pendingRewardIndex].status = "completed";
//     customer.redeemed[pendingRewardIndex].date = new Date();

//     // Safety guard
//     if (customer.availablePoints < 0) customer.availablePoints = 0;
//     if (customer.totalpoints < 0) customer.totalpoints = 0;

//     await customer.save();

//     console.log(`[WEBHOOK REDEEM] Successfully deducted ${pointsToDeduct} points for code: ${appliedCodeString}`);
//     return new Response("Points deducted via pending code", { status: 200 });
//   } else {
//     console.log(`[WEBHOOK WARNING] Code ${appliedCodeString} found on order, but no matching pending database record exists.`);
//     // Fallback: If it's not found in pending, skip it or let it pass so it doesn't break the webhook handler
//   }
// }






// /* ===============================
//    NORMAL ORDER → EARN POINTS
// =============================== */

// const earnedPoints = Number(order.total_price);

// customer.totalpoints += earnedPoints;
// customer.availablePoints += earnedPoints;

// customer.order.push({
//   orderId: order.id,
//   pointsEarned: earnedPoints,
//   date: new Date()
// });

// await customer.save();

// console.log("Points earned:", earnedPoints);

// return new Response("Points earned", { status: 200 });

// } catch (error) {
// console.error("Webhook Error:", error);
// return new Response("Error", { status: 200 });
// }
// };



// new code adding here for the oddod one


import CustomerPoints from "../models/CustomerPoints.server";
import { updateOdooPoints } from "../lib/odoo.server"; 

export const loader = async () => {
  return new Response("Webhook active", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    console.log("WEBHOOK HIT");

    const shop = request.headers.get("x-shopify-shop-domain"); // e.g., "chizelle.myshopify.com"
    const order = await request.json();
    const email = order.customer?.email?.toLowerCase().trim();
    const orderRef = order.name || `#${order.id}`; // e.g., "#1002"

    if (!shop || !email) {
      return new Response("Missing data", { status: 200 });
    }

    /* ===============================
       FIND CUSTOMER (GLOBAL EMAIL)
    =============================== */
    let customer = await CustomerPoints.findOne({ email });

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
       PREVENT DUPLICATE PROCESSING
    =============================== */
    const alreadyProcessed =
      customer.order.some(o => o.orderId === order.id) ||
      customer.redeemed.some(r => r.orderId === order.id);

    if (alreadyProcessed) {
      console.log("Order already processed:", order.id);
      return new Response("Already processed", { status: 200 });
    }

    /* ===============================
       BUY POINTS DETECTION
    =============================== */
    const pointsPurchase = order.line_items.find(
      item => item.title.includes("Buy Loyalty Points")
    );

    if (pointsPurchase) {
      const points = Number(pointsPurchase.price) * pointsPurchase.quantity;

      // 🚀 SYNC TO ODOO (With Shop & Order Reference)
      await updateOdooPoints(email, points, shop, orderRef, "Purchased Loyalty Points");

      console.log("Points purchased and sent to Odoo:", points);
      return new Response("Points added", { status: 200 });
    }

    /* ===============================
       REDEEM POINTS
    =============================== */
    const discountCodes = order.discount_codes || [];
    const loyaltyCode = discountCodes.find(d => d.code.startsWith("LOYAL-"));

    if (loyaltyCode) {
      const appliedCodeString = loyaltyCode.code;

      const pendingRewardIndex = customer.redeemed.findIndex(
        r => r.code === appliedCodeString && r.status === "pending"
      );

      if (pendingRewardIndex !== -1) {
        const pointsToDeduct = customer.redeemed[pendingRewardIndex].pointsUsed;

        // 🚀 SYNC DESTRUCTION TO ODOO (Passing negative value, Shop, and Code)
        await updateOdooPoints(
          email, 
          -pointsToDeduct, 
          shop, 
          orderRef, 
          `Redeemed discount code: ${appliedCodeString}`
        );

        console.log(`[WEBHOOK REDEEM] Deducted ${pointsToDeduct} points in Odoo.`);
        return new Response("Points deducted via pending code", { status: 200 });
      } else {
        console.log(`[WEBHOOK WARNING] Code ${appliedCodeString} found, but no matching database record.`);
      }
    }

    /* ===============================
       NORMAL ORDER → EARN POINTS
    =============================== */
    const earnedPoints = Math.floor(Number(order.total_price));

    // 🚀 SYNC EARNED POINTS TO ODOO (With Shop & Order Reference)
    await updateOdooPoints(email, earnedPoints, shop, orderRef, "Points earned from purchase");

    console.log("Points earned and sent to Odoo:", earnedPoints);
    return new Response("Points earned", { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response("Error", { status: 200 });
  }
};