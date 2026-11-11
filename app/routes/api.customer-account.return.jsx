import { getAccountCustomer } from "../lib/customer-account.server";

export async function action({ request }) {
  const { admin, session, customerId, cors } = await getAccountCustomer(request);
  if (request.method !== "POST") return cors(new Response(null, { status: 405 }));
  const { orderId, reason } = await request.json();
  const reasons = { damaged: "Damaged product", wrong: "Wrong item", size: "Size issue" };
  if (!/^gid:\/\/shopify\/Order\/\d+$/.test(orderId || "") || !reasons[reason]) {
    return cors(Response.json({ error: "Choose an order and a return reason." }, { status: 400 }));
  }
  if (!session.scope?.split(",").includes("write_orders")) {
    return cors(Response.json({ error: "The store owner must approve order-update access before return requests can be submitted." }, { status: 403 }));
  }
  const lookup = await admin.graphql(`query ReturnOrder($id: ID!) {
    order(id: $id) { id note customer { id } }
  }`, { variables: { id: orderId } });
  const result = await lookup.json();
  if (!lookup.ok || result.errors?.length) {
    return cors(Response.json({ error: "Unable to verify this order." }, { status: 502 }));
  }
  const order = result.data?.order;
  if (!order || order.customer?.id !== customerId) {
    return cors(Response.json({ error: "This order is unavailable for your account." }, { status: 403 }));
  }
  const marker = `[Elcircle return request: ${reason}]`;
  if (order.note?.includes(marker)) return cors(Response.json({ success: true }));
  const note = [order.note, `${marker} ${reasons[reason]} — ${new Date().toISOString()}`].filter(Boolean).join("\n");
  const update = await admin.graphql(`mutation RequestReturn($input: OrderInput!) {
    orderUpdate(input: $input) { order { id } userErrors { message } }
  }`, { variables: { input: { id: orderId, note } } });
  const updated = await update.json();
  if (!update.ok || updated.errors?.length || updated.data?.orderUpdate?.userErrors?.length || !updated.data?.orderUpdate?.order) {
    return cors(Response.json({ error: "The return request could not be recorded. Please try again." }, { status: 502 }));
  }
  return cors(Response.json({ success: true }));
}

export async function loader({ request }) {
  const { cors } = await getAccountCustomer(request);
  return cors(new Response(null, { status: 405 }));
}
