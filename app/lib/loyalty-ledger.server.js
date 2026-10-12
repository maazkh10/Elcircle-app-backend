import prisma from "../db.server";

const PARTNER_MODEL = "res.partner";
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD;

const FIELD = {
  points: process.env.ODOO_POINTS_FIELD || "x_studio_loyalty_points_1",
  history: process.env.ODOO_HISTORY_FIELD || "x_studio_loyalty_history_1",
  tier: process.env.ODOO_MEMBERSHIP_TIER_FIELD || "x_studio_membership_tier_2",
  qualifyingSpend: process.env.ODOO_QUALIFYING_SPEND_FIELD || "x_studio_qualifying_spend_aed",
  storeCredit: process.env.ODOO_STORE_CREDIT_FIELD || "x_studio_store_credit_aed",
  infiniteApproved: process.env.ODOO_INFINITE_APPROVED_FIELD || "x_studio_infinite_invitation_approved",
};

const LEDGER = {
  model: process.env.ODOO_LOYALTY_LEDGER_MODEL || "x_res_partner_line_a24f8",
  partner: process.env.ODOO_LEDGER_PARTNER_FIELD || "x_res_partner_id",
  pointsDelta: process.env.ODOO_LEDGER_POINTS_DELTA_FIELD || "x_studio_points_delta",
  orderRef: process.env.ODOO_LEDGER_ORDER_REF_FIELD || "x_studio_shopify_order_ref",
  storeUrl: process.env.ODOO_LEDGER_STORE_URL_FIELD || "x_studio_store_url",
  creditDelta: process.env.ODOO_LEDGER_CREDIT_DELTA_FIELD || "x_studio_store_credit_delta_aed",
  spendDelta: process.env.ODOO_LEDGER_SPEND_DELTA_FIELD || "x_studio_qualifying_spend_delta_aed",
  transactionType: process.env.ODOO_LEDGER_TRANSACTION_TYPE_FIELD || "x_studio_transaction_type",
  status: process.env.ODOO_LEDGER_STATUS_FIELD || "x_studio_processing_status",
};

const TIER_CONFIG = [
  { tier: "Ruby", minimumSpend: 200000 },
  { tier: "Emerald", minimumSpend: 100000 },
  { tier: "Diamond", minimumSpend: 80000 },
  { tier: "Platinum", minimumSpend: 40000 },
  { tier: "Gold", minimumSpend: 20000 },
  { tier: "Silver", minimumSpend: 5000 },
];

function requireOdooConfig() {
  const missing = [
    ["ODOO_URL", ODOO_URL],
    ["ODOO_DB", ODOO_DB],
    ["ODOO_USERNAME", ODOO_USERNAME],
    ["ODOO_API_KEY (or ODOO_PASSWORD)", ODOO_PASSWORD],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Missing Odoo configuration: ${missing.join(", ")}`);
}

async function rpc(service, method, args) {
  const baseUrl = ODOO_URL.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args } }),
  });
  const raw = await response.text();
  if (!response.ok || raw.trim().startsWith("<")) {
    throw new Error(`Odoo RPC HTTP error (${response.status}). Verify ODOO_URL.`);
  }
  const body = JSON.parse(raw);
  if (body.error) throw new Error(`Odoo RPC failed: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function connectOdoo() {
  requireOdooConfig();
  const uid = await rpc("common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
  if (!uid) throw new Error("Odoo authentication failed.");
  return {
    call: (model, method, args, kwargs = {}) =>
      rpc("object", "execute_kw", [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs]),
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function tierForSpend(spend) {
  return TIER_CONFIG.find((tier) => spend >= tier.minimumSpend)?.tier || null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function noteAttribute(order, name) {
  const attrs = Array.isArray(order.note_attributes) ? order.note_attributes : [];
  return attrs.find((item) => String(item.name).toLowerCase() === name.toLowerCase())?.value;
}

function classifyOrder(order) {
  const flagged = String(noteAttribute(order, "is_points_purchase") || "").toLowerCase() === "true";
  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
  const titleLooksLikePoints = lineItems.some((item) => /buy loyalty points|buy .* points/i.test(String(item.title || "")));
  if (flagged || titleLooksLikePoints) {
    const fromAttribute = Number(noteAttribute(order, "points_to_add"));
    const fromTitle = lineItems.map((item) => String(item.title || "").match(/\((\d+)\s*Pts?\)/i)?.[1]).find(Boolean);
    const points = Number.isInteger(fromAttribute) && fromAttribute > 0 ? fromAttribute : Number(fromTitle);
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error("Points-purchase order is missing a valid points_to_add note attribute.");
    }
    return { type: "points_purchase", points };
  }
  return {
    type: "product_purchase",
    points: Math.max(0, Math.floor(Number(order.current_subtotal_price ?? order.subtotal_price ?? order.total_price) || 0)),
  };
}

async function getOfflineToken(shop) {
  let session = await prisma.session.findUnique({ where: { id: `offline_${shop}` } });
  if (!session?.accessToken) {
    session = await prisma.session.findFirst({
      where: { shop, isOnline: false },
      orderBy: { expires: "desc" },
    });
  }
  if (!session?.accessToken) throw new Error(`No offline Shopify access token for ${shop}.`);
  return session.accessToken;
}

async function grantShopifyStoreCredit({ shop, accessToken, customerId, amount }) {
  if (!customerId) throw new Error("Paid points order has no Shopify customer ID; cannot issue store credit.");
  if (amount <= 0) return null;

  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-04";
  const query = `
    mutation CreditElCircleStoreCredit($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
      storeCreditAccountCredit(id: $id, creditInput: $creditInput) {
        storeCreditAccountTransaction { id amount { amount currencyCode } }
        userErrors { field message }
      }
    }
  `;
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({
      query,
      variables: {
        id: `gid://shopify/Customer/${customerId}`,
        creditInput: { creditAmount: { amount: amount.toFixed(2), currencyCode: "AED" }, notify: false },
      },
    }),
  });
  const payload = await response.json();
  const result = payload.data?.storeCreditAccountCredit;
  if (!response.ok || payload.errors?.length || result?.userErrors?.length || !result?.storeCreditAccountTransaction) {
    throw new Error(`Shopify store-credit mutation failed: ${JSON.stringify(payload.errors || result?.userErrors || payload)}`);
  }
  return result.storeCreditAccountTransaction;
}

/**
 * Process a Shopify paid order once using an Odoo ledger row.
 *
 * A pending row is intentionally never retried automatically: Shopify's store
 * credit mutation and Odoo's database write cannot be one atomic transaction.
 * If a process crashes mid-flight, reconcile that row before replaying it.
 */
export async function processPaidLoyaltyOrder({ order, shop }) {
  const cleanShop = String(shop || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!cleanShop || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(cleanShop)) {
    throw new Error("Invalid Shopify shop domain on webhook.");
  }
  if (!order?.id) throw new Error("Shopify order ID is required.");
  if (String(order.financial_status || "").toLowerCase() !== "paid") {
    return { skipped: true, reason: "order_not_paid" };
  }

  const email = normalizeEmail(order.customer?.email || order.email);
  if (!email) throw new Error("Paid order has no customer email; cannot match Odoo contact.");
  const currency = String(order.currency || order.presentment_currency || "").toUpperCase();
  if (currency !== "AED") {
    throw new Error(`Expected AED order currency, received ${currency || "unknown"}; no loyalty transaction was applied.`);
  }

  const amount = roundMoney(order.current_subtotal_price ?? order.subtotal_price ?? order.total_price);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Order amount is invalid.");
  const classification = classifyOrder(order);
  const pointsDelta = classification.points;
  const storeCreditDelta = classification.type === "points_purchase" ? roundMoney(amount * 0.03) : 0;
  const spendDelta = amount;
  const orderKey = `shopify-order-${String(order.id)}`;

  const odoo = await connectOdoo();
  const partnerIds = await odoo.call(PARTNER_MODEL, "search", [[["email", "=", email]]], { limit: 2 });
  const partnerId = partnerIds?.[0];
  if (!partnerId) {
    // Do not create a second contact silently; an admin should link/create it first.
    throw new Error(`No Odoo Contact matches customer email ${email}. Create/link the contact before processing this order.`);
  }

  const existingIds = await odoo.call(LEDGER.model, "search", [[
    [LEDGER.orderRef, "=", orderKey],
    [LEDGER.storeUrl, "=", cleanShop],
  ]], { limit: 1 });
  if (existingIds?.length) {
    const rows = await odoo.call(LEDGER.model, "read", [existingIds, ["x_name", LEDGER.status]]);
    const status = String(rows?.[0]?.[LEDGER.status] || "").toLowerCase();
    if (status === "completed") return { duplicate: true, orderKey, partnerId };
    throw new Error(`LOYALTY_TRANSACTION_PENDING_RECONCILIATION: ${orderKey} exists with status "${status}". Do not replay until manually reconciled.`);
  }

  const partnerRows = await odoo.call(PARTNER_MODEL, "read", [[partnerId], [
    FIELD.points, FIELD.history, FIELD.qualifyingSpend, FIELD.storeCredit,
    FIELD.tier, FIELD.infiniteApproved,
  ]]);
  const partner = partnerRows?.[0];
  if (!partner) throw new Error("Could not read the Odoo customer record.");

  const currentPoints = Number(partner[FIELD.points] || 0);
  const currentSpend = Number(partner[FIELD.qualifyingSpend] || 0);
  const currentCredit = Number(partner[FIELD.storeCredit] || 0);
  const newSpend = roundMoney(currentSpend + spendDelta);
  const calculatedTier = tierForSpend(newSpend);
  const existingTier = String(partner[FIELD.tier] || "").trim().toLowerCase();
  const tier = existingTier === "infinite" && partner[FIELD.infiniteApproved] === true
    ? "Infinite"
    : calculatedTier;
  const now = new Date().toISOString();

  const ledgerValues = {
    x_name: `PENDING | ${classification.type} | ${orderKey}`,
    [LEDGER.partner]: partnerId,
    [LEDGER.pointsDelta]: pointsDelta,
    [LEDGER.orderRef]: orderKey,
    [LEDGER.storeUrl]: cleanShop,
    [LEDGER.creditDelta]: storeCreditDelta,
    [LEDGER.spendDelta]: spendDelta,
    [LEDGER.transactionType]: classification.type,
    [LEDGER.status]: "pending",
  };
  const ledgerId = await odoo.call(LEDGER.model, "create", [ledgerValues]);

  try {
    let creditTransaction = null;
    if (storeCreditDelta > 0) {
      const accessToken = await getOfflineToken(cleanShop);
      creditTransaction = await grantShopifyStoreCredit({
        shop: cleanShop,
        accessToken,
        customerId: order.customer?.id,
        amount: storeCreditDelta,
      });
    }

    const historyLine = [
      now,
      classification.type,
      `order=${orderKey}`,
      `points=+${pointsDelta}`,
      `storeCreditAED=+${storeCreditDelta.toFixed(2)}`,
      `spendAED=+${spendDelta.toFixed(2)}`,
      `shop=${cleanShop}`,
    ].join(" | ");
    const previousHistory = String(partner[FIELD.history] || "");
    const newHistory = previousHistory ? `${historyLine}\n${previousHistory}` : historyLine;
    const partnerUpdate = {
      [FIELD.points]: currentPoints + pointsDelta,
      [FIELD.qualifyingSpend]: newSpend,
      [FIELD.storeCredit]: roundMoney(currentCredit + storeCreditDelta),
      [FIELD.history]: newHistory,
    };
    if (tier) partnerUpdate[FIELD.tier] = tier;

    await odoo.call(PARTNER_MODEL, "write", [[partnerId], partnerUpdate]);
    await odoo.call(LEDGER.model, "write", [[ledgerId], {
      x_name: `COMPLETED | ${classification.type} | ${orderKey}`,
      [LEDGER.status]: "completed",
    }]);

    return {
      success: true,
      partnerId,
      orderKey,
      transactionType: classification.type,
      pointsAdded: pointsDelta,
      storeCreditAddedAED: storeCreditDelta,
      qualifyingSpendAddedAED: spendDelta,
      qualifyingSpendTotalAED: newSpend,
      tier,
      shopifyStoreCreditTransactionId: creditTransaction?.id || null,
    };
  } catch (error) {
    try {
      await odoo.call(LEDGER.model, "write", [[ledgerId], {
        x_name: `NEEDS REVIEW | ${classification.type} | ${orderKey}`,
        [LEDGER.status]: "needs_review",
      }]);
    } catch (ledgerError) {
      console.error("[Loyalty] Could not mark transaction for review:", ledgerError);
    }
    throw error;
  }
}
