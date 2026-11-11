// import { authenticate } from "../shopify.server";
// import { processPaidLoyaltyOrder } from "../lib/loyalty-ledger.server";

// function textResponse(message, status = 200) {
//   return new Response(message, {
//     status,
//     headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
//   });
// }

// export const loader = async () => textResponse("El Circle paid-order loyalty webhook is active.");

// export const action = async ({ request }) => {
//   try {
//     // Verifies Shopify's webhook HMAC and parses the signed payload.
//     const { shop, topic, payload } = await authenticate.webhook(request);
//     const normalizedTopic = String(topic || "").toLowerCase();

//     if (normalizedTopic && normalizedTopic !== "orders/paid" && normalizedTopic !== "orders_paid") {
//       return textResponse(`Ignored webhook topic: ${topic}`);
//     }

//     const result = await processPaidLoyaltyOrder({ order: payload, shop });

//     if (result.skipped) return textResponse(`Skipped: ${result.reason}`);
//     if (result.duplicate) return textResponse(`Duplicate ignored: ${result.orderKey}`);

//     console.info("[El Circle Loyalty] Paid order processed", {
//       shop,
//       orderKey: result.orderKey,
//       transactionType: result.transactionType,
//       pointsAdded: result.pointsAdded,
//       storeCreditAddedAED: result.storeCreditAddedAED,
//       tier: result.tier,
//     });
//     return textResponse("Loyalty transaction completed.");
//   } catch (error) {
//     const message = String(error?.message || error);
//     console.error("[El Circle Loyalty] Paid-order webhook failed:", message);

//     // A pending ledger entry means the external credit may already have been
//     // issued. Do not ask Shopify to retry and risk issuing monetary credit twice.
//     if (message.includes("LOYALTY_TRANSACTION_PENDING_RECONCILIATION")) {
//       return textResponse("Transaction requires manual reconciliation; automatic replay stopped.", 200);
//     }

//     return textResponse("Loyalty processing failed. Shopify may retry this webhook.", 500);
//   }
// };




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

export const loader = async () => {
  return textResponse("El Circle paid-order loyalty webhook is active.");
};

export const action = async ({ request }) => {
  try {
    // Verify Shopify's webhook signature and read the payload.
    const { shop, topic, payload } = await authenticate.webhook(request);

    const normalizedTopic = String(topic || "").toLowerCase();

    if (
      normalizedTopic &&
      normalizedTopic !== "orders/paid" &&
      normalizedTopic !== "orders_paid"
    ) {
      return textResponse(`Ignored webhook topic: ${topic}`);
    }

    // Process the paid order through the loyalty service.
    const result = await processPaidLoyaltyOrder({
      order: payload,
      shop,
    });

    if (result.skipped) {
      return textResponse(`Skipped: ${result.reason}`);
    }

    if (result.duplicate) {
      return textResponse(`Duplicate ignored: ${result.orderKey}`);
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
    // Shopify authentication may throw a Response instead of an Error.
    if (error instanceof Response) {
      let responseBody = "";

      try {
        responseBody = await error.clone().text();
      } catch {
        // The response body may not be readable.
      }

      console.error("[Paid webhook] Response thrown", {
        status: error.status,
        statusText: error.statusText,
        body: responseBody,
      });

      // Preserve the original HTTP status for diagnosis.
      return textResponse(
        "Paid-order webhook authentication or processing failed.",
        error.status || 500
      );
    }

    console.error("[Paid webhook] Error thrown", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });

    // Avoid logging secrets or the complete webhook payload.
    const message = String(error?.message || error);

    if (message.includes("LOYALTY_TRANSACTION_PENDING_RECONCILIATION")) {
      return textResponse(
        "Transaction requires manual reconciliation. Automatic replay stopped.",
        200
      );
    }

    return textResponse(
      "Paid-order loyalty processing failed. Check local server logs.",
      500
    );
  }
};
