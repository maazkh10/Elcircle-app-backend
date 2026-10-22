import { authenticate } from "../shopify.server";
import { processPaidLoyaltyOrder } from "../lib/loyalty-ledger.server";

function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const loader = async () => textResponse("El Circle paid-order loyalty webhook is active.");

export const action = async ({ request }) => {
  try {
    // Verifies Shopify's webhook HMAC and parses the signed payload.
    const { shop, topic, payload } = await authenticate.webhook(request);
    const normalizedTopic = String(topic || "").toLowerCase();

    if (normalizedTopic && normalizedTopic !== "orders/paid" && normalizedTopic !== "orders_paid") {
      return textResponse(`Ignored webhook topic: ${topic}`);
    }

    const result = await processPaidLoyaltyOrder({ order: payload, shop });

    if (result.skipped) return textResponse(`Skipped: ${result.reason}`);
    if (result.duplicate) return textResponse(`Duplicate ignored: ${result.orderKey}`);

    console.info("[El Circle Loyalty] Paid order processed", {
      shop,
      orderKey: result.orderKey,
      transactionType: result.transactionType,
      pointsAdded: result.pointsAdded,
      storeCreditAddedAED: result.storeCreditAddedAED,
      tier: result.tier,
    });
    return textResponse("Loyalty transaction completed.");
  } catch (error) {
    const message = String(error?.message || error);
    console.error("[El Circle Loyalty] Paid-order webhook failed:", message);

    // A pending ledger entry means the external credit may already have been
    // issued. Do not ask Shopify to retry and risk issuing monetary credit twice.
    if (message.includes("LOYALTY_TRANSACTION_PENDING_RECONCILIATION")) {
      return textResponse("Transaction requires manual reconciliation; automatic replay stopped.", 200);
    }

    return textResponse("Loyalty processing failed. Shopify may retry this webhook.", 500);
  }
};
