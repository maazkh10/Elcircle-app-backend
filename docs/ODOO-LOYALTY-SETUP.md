# El Circle loyalty setup (Shopify + Odoo)

This feature branch adds a paid-order loyalty processor. Do not enable it on the live store until the Odoo fields below exist and development-store tests pass.

## Rules implemented

- Currency must be AED. The handler refuses unknown/non-AED orders instead of mixing currencies.
- Product order: 1 point per AED 1 of qualifying subtotal (floored); no store credit.
- Points purchase: points come from the paid order's `note_attributes` (`is_points_purchase=true`, `points_to_add`); 3% of the paid AED subtotal is issued as actual Shopify store credit.
- Qualifying spend accumulates from product orders and points purchases, so buying points can advance a tier.
- Tier thresholds: Silver 5,000; Gold 20,000; Platinum 40,000; Diamond 80,000; Emerald 100,000; Ruby 200,000 AED. Infinite remains invitation-only and requires its Odoo approval checkbox.
- Odoo records each order in the loyalty ledger before balance changes. A duplicate completed order is ignored. Pending/needs-review rows stop automatic replay because Shopify credit and Odoo writes cannot share a database transaction.
- Existing-customer history import and the one-time tier welcome credit are not automatically granted on page refresh in this implementation. Historic spend must be imported/reconciled before any one-time legacy benefit is issued.

## Odoo Contacts (`res.partner`)

Already created:
- Membership Tier: `x_studio_membership_tier_2` (Selection: Silver, Gold, Platinum, Diamond, Emerald, Ruby, Infinite)
- Investment Amount (AED): `x_studio_investment_amount_aed`
- Infinite Invitation Approved: `x_studio_infinite_invitation_approved` (Boolean)

Existing loyalty fields expected by current app:
- Points: `x_studio_loyalty_points_1`
- History: `x_studio_loyalty_history_1`

Create these additional Contact fields in Odoo Studio:
1. `x_studio_qualifying_spend_aed` — Decimal, default 0. This is the canonical accumulated qualifying spend used for tier calculation.
2. `x_studio_store_credit_aed` — Decimal, default 0. This mirrors Shopify's store-credit balance; Shopify itself is where the actual credit is issued.
Optional for the next phase (not required for the paid-order webhook): `x_studio_initial_tier_credit_issued` — Checkbox, default unchecked. Reserved for controlled legacy-customer migration.

Use Decimal fields to avoid the current INR currency field accidentally changing AED amounts. We can fix the Monetary field currency separately.

## Odoo transaction ledger

The current integration already references model `x_res_partner_line_a24f8` and fields `x_res_partner_id`, `x_studio_points_delta`, `x_studio_shopify_order_ref`, `x_studio_store_url`, and `x_name`.

In Odoo Studio, open the existing `x_loyalty_history` menu/model (verify it is model `x_res_partner_line_a24f8`) and add:
1. `x_studio_store_credit_delta_aed` — Decimal, default 0.
2. `x_studio_qualifying_spend_delta_aed` — Decimal, default 0.
3. `x_studio_transaction_type` — Selection with values `product_purchase` and `points_purchase`.
4. `x_studio_processing_status` — Selection with values `pending`, `completed`, and `needs_review`.

If Odoo generates different technical names, set the matching environment variable below. Do not rename existing working fields.

## Environment variables

Put these in local `.env` (same folder as package.json) and later in the deployment environment. Never commit real credentials.

```env
ODOO_URL=https://your-odoo-instance.odoo.com
ODOO_DB=your_database
ODOO_USERNAME=your-odoo-login
ODOO_API_KEY=your_odoo_api_key

ODOO_POINTS_FIELD=x_studio_loyalty_points_1
ODOO_HISTORY_FIELD=x_studio_loyalty_history_1
ODOO_MEMBERSHIP_TIER_FIELD=x_studio_membership_tier_2
ODOO_INVESTMENT_AMOUNT_FIELD=x_studio_investment_amount_aed
ODOO_INFINITE_APPROVED_FIELD=x_studio_infinite_invitation_approved
ODOO_QUALIFYING_SPEND_FIELD=x_studio_qualifying_spend_aed
ODOO_STORE_CREDIT_FIELD=x_studio_store_credit_aed

ODOO_LOYALTY_LEDGER_MODEL=x_res_partner_line_a24f8
ODOO_LEDGER_PARTNER_FIELD=x_res_partner_id
ODOO_LEDGER_POINTS_DELTA_FIELD=x_studio_points_delta
ODOO_LEDGER_ORDER_REF_FIELD=x_studio_shopify_order_ref
ODOO_LEDGER_STORE_URL_FIELD=x_studio_store_url
ODOO_LEDGER_CREDIT_DELTA_FIELD=x_studio_store_credit_delta_aed
ODOO_LEDGER_SPEND_DELTA_FIELD=x_studio_qualifying_spend_delta_aed
ODOO_LEDGER_TRANSACTION_TYPE_FIELD=x_studio_transaction_type
ODOO_LEDGER_STATUS_FIELD=x_studio_processing_status
SHOPIFY_API_VERSION=2026-04
```

## Shopify configuration

- Add `write_store_credit_account_transactions` scope for actual store-credit issuance.
- Configure the `orders/paid` webhook to `/api/webhooks/orders-create` in the active `shopify.app*.toml` config.
- The webhook route verifies Shopify's HMAC via `authenticate.webhook`.
- After changing scopes/webhook configuration, run the Shopify CLI dev flow and approve/reinstall the development app if prompted.
- Shopify docs: https://shopify.dev/docs/api/admin-graphql/2026-04/mutations/storeCreditAccountCredit

## Testing

1. Use a development store and a test Odoo contact.
2. Create the fields/model above before starting the webhook handler.
3. Paid product order in AED: points + spend delta, no store credit.
4. Paid points draft order: points from `points_to_add`, 3% real Shopify store credit, and spend delta.
5. Deliver the same webhook again: completed ledger entry should no-op.
6. If a ledger row is pending/needs_review, inspect Shopify's store-credit transaction before replaying. Never delete it blindly.
7. Verify actual store credit in Shopify Admin; Odoo's store-credit field is a mirror only.

### Production limitation

Odoo Studio does not provide a database-level unique constraint for the order key. This implementation has a duplicate check and a durable pending row, but concurrent duplicate deliveries can still race. For strict financial-grade idempotency, add a custom Odoo module with a SQL unique constraint or a separate durable idempotency store before production rollout.
