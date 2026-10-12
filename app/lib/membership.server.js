/**
 * app/lib/membership.server.js
 *
 * Central membership rules for Elcircle.
 * Odoo is the source of truth; protected routes must check membership here.
 */
import { getOdooMembership } from "./odoo.server";

export const MEMBERSHIP_TIERS = Object.freeze({
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  DIAMOND: "Diamond",
  EMERALD: "Emerald",
  RUBY: "Ruby",
  INFINITE: "Infinite",
});

// Keep benefit values as metadata only until the business defines whether
// they represent points, cash, discounts, or purchase allowances.
export const TIER_CONFIG = Object.freeze({
  Silver:   { minimumInvestment: 5000,   benefitAmount: 150 },
  Gold:     { minimumInvestment: 20000,  benefitAmount: 600 },
  Platinum: { minimumInvestment: 40000,  benefitAmount: 1200 },
  Diamond:  { minimumInvestment: 80000,  benefitAmount: 2400 },
  Emerald:  { minimumInvestment: 100000, benefitAmount: 3000 },
  Ruby:     { minimumInvestment: 200000, benefitAmount: 6000 },
  Infinite: { minimumInvestment: null,  benefitAmount: null, invitationOnly: true },
});

const TIER_ORDER = [
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Emerald",
  "Ruby",
];

export function calculateTierFromInvestment(investmentAmount) {
  const amount = Number(investmentAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Investment amount must be a valid non-negative number.");
  }

  // Infinite is invitation-only and is intentionally never calculated here.
  let tier = amount >= 5000 ? "Silver" : null;
  for (const candidate of TIER_ORDER) {
    if (amount >= TIER_CONFIG[candidate].minimumInvestment) tier = candidate;
  }
  return tier;
}

export function normalizeTier(rawTier) {
  if (!rawTier || typeof rawTier !== "string") return null;
  const match = Object.keys(TIER_CONFIG).find(
    (tier) => tier.toLowerCase() === rawTier.trim().toLowerCase()
  );
  return match || null;
}

export function getTierRank(tier) {
  const normalized = normalizeTier(tier);
  if (!normalized) return 0;
  if (normalized === "Infinite") return 7;
  return TIER_ORDER.indexOf(normalized) + 1;
}

/**
 * Returns true if a member tier meets the minimum feature tier.
 * Unknown/missing tiers do not receive protected access.
 */
export function hasMinimumTier(customerTier, requiredTier) {
  const customerRank = getTierRank(customerTier);
  const requiredRank = getTierRank(requiredTier);
  return customerRank > 0 && requiredRank > 0 && customerRank >= requiredRank;
}

/**
 * Fetches a customer's tier from Odoo and provides reusable feature checks.
 * Odoo failures are deliberately propagated: protected features fail closed.
 */
export async function getCustomerMembership(email) {
  if (!email || typeof email !== "string") {
    throw new Error("A customer email is required.");
  }

  const record = await getOdooMembership(email.trim().toLowerCase());
  if (!record) {
    return {
      found: false,
      email: email.trim().toLowerCase(),
      tier: null,
      investmentAmount: 0,
      infiniteApproved: false,
      benefits: null,
      access: {
        designerLookbook: false,
        tier: null,
      },
    };
  }

  const investmentAmount = Number(record.investmentAmount || 0);
  let tier = normalizeTier(record.tier);

  // Calculate standard tiers using investment if no tier is manually set.
  // Explicit Infinite tier is honored only when the separate approval flag is true.
  if (tier === "Infinite" && record.infiniteApproved !== true) {
    tier = calculateTierFromInvestment(investmentAmount);
  } else if (!tier) {
    tier = calculateTierFromInvestment(investmentAmount);
  }

  const benefits = tier ? TIER_CONFIG[tier] : null;

  return {
    found: true,
    email: email.trim().toLowerCase(),
    tier,
    investmentAmount,
    infiniteApproved: record.infiniteApproved === true,
    benefits,
    access: {
      // Example policy: designer lookbook is available to Gold and higher.
      designerLookbook: hasMinimumTier(tier, "Gold"),
      tier,
    },
  };
}

export function requireMinimumTier(membership, requiredTier) {
  if (!membership?.found) {
    return {
      allowed: false,
      status: 403,
      reason: "No matching Odoo membership record was found.",
    };
  }

  if (!hasMinimumTier(membership.tier, requiredTier)) {
    return {
      allowed: false,
      status: 403,
      reason: `This feature requires ${requiredTier} membership or higher.`,
    };
  }

  return { allowed: true, status: 200, reason: null };
}
