import { Resend } from "resend";


const rooms = {
    atelier: {
      name: "The Atelier",
      price: 1000,
      duration: "1 hour",
    },
    salon: {
      name: "The Salon",
      price: 1500,
      duration: "1.5 hours",
    },
    majlis: {
      name: "The Majlis",
      price: 2500,
      duration: "2.5 hours",
    },
  };


  export async function sendBookingRequestEmail(booking) {
    const room = Object.hasOwn(rooms, booking.roomId)
    ? rooms[booking.roomId]
    : null;

    if (!room) {
        throw new Error("INvalid room selction")
    }

    const {
        RESEND_API_KEY , 
        BOOKING_FROM_EMAIL,
        BOOKING_NOTIFY_EMAIL
    } = process.env;


    if (!RESEND_API_KEY || !BOOKING_FROM_EMAIL || !BOOKING_NOTIFY_EMAIL) {
        throw new Error("Booking email settings are missing.");
    }

    const resend = new Resend(RESEND_API_KEY)

    const {data , error} = await resend.emails.send(
        {
            from: BOOKING_FROM_EMAIL,
            to: [BOOKING_NOTIFY_EMAIL],
            replyTo: booking.email,
            subject: `New booking request — ${room.name}`,
            text: [
              "New private-room booking request",
              "",
              `Customer: ${booking.firstName} ${booking.lastName}`,
              `Email: ${booking.email}`,
              `Phone: ${booking.phone}`,
              `Room: ${room.name}`,
              `Price: AED ${room.price}`,
              `Duration: ${room.duration}`,
              `Requested date: ${booking.date}`,
              `Requested start time: ${booking.time}`,
              `Notes: ${booking.notes || "None"}`,
              "",
              "Availability and payment are not confirmed.",
            ].join("\n"),
          },
          {
            idempotencyKey: `booking-request/${booking.id}`,
          },
    );
    if (error) {
        throw new Error("booking errorr")
    }
    return data;
  }