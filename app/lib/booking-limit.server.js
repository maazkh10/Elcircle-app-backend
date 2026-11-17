import { createHash } from "node:crypto";
import { OdooSessionStorage } from "./odoo-session-storage.server.js";

const odoo = new OdooSessionStorage();

export async function allowBookingRequest(customer, requestId) {
  const customerKey = createHash("sha256")
    .update(`${customer.shop}/${customer.customerId}`)
    .digest("hex");

  const windowNumber = Math.floor(Date.now() / (5 * 60 * 1000));

  const key =
    `elcircle.booking.limit.${customerKey}.${windowNumber}`;

  try {
    // Odoo's unique parameter key prevents simultaneous requests
    // from creating separate claims for the same window.
    await odoo.execute("create", [{
      key,
      value: requestId,
    }]);

    return true;
  } catch (error) {
    const existingRequestId = await odoo.execute(
      "get_param",
      [key, false],
    );

    // A connection/storage failure must not silently bypass the limit.
    if (!existingRequestId) throw error;

    // Allow retrying the same request.
    // Resend's existing idempotency key prevents duplicate emails.
    return existingRequestId === requestId;
  }
}