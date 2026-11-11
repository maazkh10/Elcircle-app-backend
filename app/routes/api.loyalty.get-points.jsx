import { getOdooPoints } from "../lib/odoo.server";
import { getAuthenticatedStorefrontCustomer } from "../lib/storefront-customer.server";

export async function loader({ request }) {
  const { email } = await getAuthenticatedStorefrontCustomer(request);
  try {
    const balance = await getOdooPoints(email);
    return Response.json(
      { points: balance?.availablePoints ?? 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Points lookup failed" }, { status: 502 });
  }
}
