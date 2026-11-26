const rooms = {
  atelier: { name: "The Atelier", price: "1000.00", duration: "1 hour" },
  salon: { name: "The Salon", price: "1500.00", duration: "1.5 hours" },
  majlis: { name: "The Majlis", price: "2500.00", duration: "2.5 hours" },
};

export async function createBookingCheckout(customer, booking) {
  const room = rooms[booking.roomId];
  if (!room) throw new Error("Invalid room");
  const requestTag = `booking-${customer.customerId}-${booking.requestId}`;
  // Reuse an existing unpaid checkout after a network interruption.
  const existingResponse = await customer.admin.graphql(
    `query BookingCheckout($query: String!) {
      draftOrders(first: 1, query: $query) { nodes { invoiceUrl status } }
    }`,
    { variables: { query: `tag:${requestTag}` } },
  );
  const existing = await existingResponse.json();
  if (existing.errors?.length) throw new Error("Checkout lookup failed");
  const draft = existing.data?.draftOrders?.nodes?.[0];
  if (draft?.invoiceUrl && draft.status !== "COMPLETED") return draft.invoiceUrl;
  if (draft) throw new Error("Checkout already completed");

  const response = await customer.admin.graphql(
    `mutation BookingCheckoutCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { invoiceUrl }
        userErrors { field message }
      }
    }`,
    { variables: { input: {
      purchasingEntity: { customerId: `gid://shopify/Customer/${customer.customerId}` },
      email: customer.email,
      presentmentCurrencyCode: "AED",
      tags: ["elcircle-private-appointment", requestTag],
      note: "Private appointment checkout. Payment and availability must be confirmed separately.",
      customAttributes: [
        { key: "booking_request_id", value: booking.requestId },
        { key: "room", value: room.name },
        { key: "appointment_date", value: booking.date },
        { key: "appointment_time_dubai", value: booking.time },
        { key: "duration", value: room.duration },
        { key: "guest_name", value: `${booking.firstName.trim()} ${booking.lastName.trim()}` },
        { key: "guest_phone", value: booking.phone.trim() },
        { key: "notes", value: booking.notes || "None" },
      ],
      lineItems: [{
        title: `Private appointment — ${room.name}`,
        quantity: 1,
        requiresShipping: false,
        originalUnitPriceWithCurrency: { amount: room.price, currencyCode: "AED" },
      }],
    } } },
  );
  const payload = await response.json();
  const result = payload.data?.draftOrderCreate;
  if (!response.ok || payload.errors?.length || result?.userErrors?.length || !result?.draftOrder?.invoiceUrl) {
    console.error("[Booking checkout validation]", { ok: response.ok, hasDraft: Boolean(result?.draftOrder), hasUrl: Boolean(result?.draftOrder?.invoiceUrl), fields: result?.userErrors?.map(e => e.field), messages: result?.userErrors?.map(e => e.message) });
    throw new Error("Shopify rejected appointment checkout");
  }
  return result.draftOrder.invoiceUrl;
}
