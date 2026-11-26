import { createBookingCheckout } from "../lib/booking-checkout.server.js";
import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";
import { allowBookingRequest } from "../lib/booking-limit.server";
export async function action({ request }) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed." },
      { status: 405 },
    );
  }

  // Verify the signed-in Shopify customer.
  const customer = await getAuthenticatedStorefrontCustomer(request);

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const validText = (value, max) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max;

  if (
    !body ||
    !/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
  .test(body.requestId || "") ||
    !["atelier", "salon", "majlis"].includes(body.roomId) ||
    !validText(body.firstName, 100) ||
    !validText(body.lastName, 100) ||
    !validText(body.phone, 40) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time || "") ||
    (body.notes != null &&
      (typeof body.notes !== "string" || body.notes.length > 2000))
  ) {
    return Response.json(
      { error: "Please check your booking details." },
      { status: 400 },
    );
  }




// / Appointment times are interpreted as Dubai time (UTC+4).




const calenderDate = new Date(`${body.date}T00:00:00Z`);
const AppointmentStart = new Date(
    `${body.date}T${body.time}:00+04:00`,
);

const validCalenderDate = 
// Number.isFinite(calenderDate.getDate())
Number.isFinite(calenderDate.getTime())
&& 
calenderDate.toISOString().slice(0,10) === body.date;


const futureAppointment = 
Number.isFinite(AppointmentStart.getTime()) &&
AppointmentStart.getTime() > Date.now();

if (!validCalenderDate || !futureAppointment) {
    return Response.json(
        {error: "Please choose a valid future appointmenr date and time"},
        {status: 400}
    )
}

  try {
    if (!await allowBookingRequest(customer, body.requestId)) {
      return Response.json({error: "Please wait five minutes before starting another appointment checkout."}, {status: 429});
    }
    const checkoutUrl = await createBookingCheckout(customer, body);
    return Response.json({success: true, checkoutUrl});
  } catch {
    console.error("[Booking checkout] Unable to create Shopify checkout");
    return Response.json({error: "Unable to open checkout. Please try again."}, {status: 502});
  }
}
