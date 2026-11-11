import { authenticate, unauthenticated } from "../shopify.server";

export async function getAccountCustomer(request) {
  const { sessionToken, cors } = await authenticate.public.customerAccount(request);
  const destination = String(sessionToken.dest || "").replace(/^https:\/\//, "").replace(/\/$/, "");
  if (sessionToken.aud !== process.env.SHOPIFY_API_KEY || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(destination) ||
      !/^gid:\/\/shopify\/Customer\/\d+$/.test(sessionToken.sub || "")) {
    throw cors(Response.json({ error: "Please sign in to your customer account." }, { status: 401 }));
  }
  const { admin, session } = await unauthenticated.admin(destination);
  const response = await admin.graphql(`query AccountCustomer($id: ID!) {
    customer(id: $id) { id email }
  }`, { variables: { id: sessionToken.sub } });
  const result = await response.json();
  const email = result.data?.customer?.email?.trim().toLowerCase();
  if (!response.ok || result.errors?.length || !email) {
    throw cors(Response.json({ error: "Customer information is unavailable." }, { status: 502 }));
  }
  return { admin, session, customerId: sessionToken.sub, email, cors };
}
