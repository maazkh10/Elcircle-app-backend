import { getAccountCustomer } from "../lib/customer-account.server";
import { getOdooPoints, getOdooMembership } from "../lib/odoo.server";

export async function loader({ request }) {
  const { email, cors } = await getAccountCustomer(request);
  try {
    const [balance, membership] = await Promise.all([
      getOdooPoints(email), getOdooMembership(email),
    ]);
    if (!membership) {
      return cors(Response.json({ success: false, error: "No Odoo membership is linked to this customer email yet." }, { status: 404, headers: { "Cache-Control": "no-store" } }));
    }
    return cors(Response.json({
      success: true,
      points: Number(balance?.totalpoints ?? balance?.availablePoints ?? 0),
      tier: membership?.tier || null,
      lifetimeSpend: Number(membership?.investmentAmount || 0),
      history: balance?.history || "",
    }, { headers: { "Cache-Control": "no-store" } }));
  } catch {
    if (!membership) {
      return cors(Response.json({ success: false, error: "No Odoo membership is linked to this customer email yet." }, { status: 404, headers: { "Cache-Control": "no-store" } }));
    }
    return cors(Response.json({ error: "Rewards are temporarily unavailable. Please try again." }, { status: 502 }));
  }
}
