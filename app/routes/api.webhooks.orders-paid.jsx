
import { authenticate } from "../shopify.server";
import { processPaidLoyaltyOrder } from "../lib/loyalty-ledger.server";

function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const loader = async () =>
  textResponse("Paid-order webhook route is active.");

export const action = async ({ request }) => {
  try {
    const { shop, topic, payload } =
      await authenticate.webhook(request);

    const normalizedTopic = String(topic || "").toLowerCase();

    if (
      normalizedTopic &&
      normalizedTopic !== "orders/paid" &&
      normalizedTopic !== "orders_paid"
    ) {
      return textResponse(`Ignored webhook topic: ${topic}`);
    }

    const result = await processPaidLoyaltyOrder({
      order: payload,
      shop,
    });

    if (result.skipped) {
      return textResponse(`Skipped: ${result.reason}`);
    }

    if (result.duplicate) {
      return textResponse(
        `Duplicate ignored: ${result.orderKey}`
      );
    }

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
    console.error("[El Circle Loyalty] Paid-order webhook failed:", {
      status: error?.status,
      statusText: error?.statusText,
      message: error?.message,
    });

    if (error instanceof Response) {
      return textResponse(
        "Webhook authentication or processing failed.",
        error.status || 500
      );
    }

    return textResponse("Loyalty processing failed.", 500);
  }
};
