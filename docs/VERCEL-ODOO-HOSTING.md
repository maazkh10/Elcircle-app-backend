# Permanent Elcircle backend hosting

Production project: `elcircle-app-backend-ee6d` on Vercel.

Production branch: `codex/elcircle-office-setup`.

Backend URL: `https://elcircle-app-backend-ee6d.vercel.app`.

Vercel builds each push to the production branch. Local file edits alone do not
update the hosted backend; commit and push them to that branch.

## Odoo-only storage

Production sets `SHOPIFY_SESSION_STORAGE=odoo`. Business data remains in Odoo.
Shopify sessions are encrypted with AES-256-GCM before being stored as isolated
Odoo system parameters under `elcircle.shopify.<app-id>.session.*`.
The encryption key is derived from the Shopify app secret. The server needs
the existing Odoo URL, database, username and API key, plus Shopify app
credentials and scopes, in Vercel's protected Production environment variables.

No Supabase, PostgreSQL service, or local MongoDB connection is required by
this production session configuration. Local SQLite remains available when
`SHOPIFY_SESSION_STORAGE` is unset for a separate development app.

`/api/health` reports whether the session store can reach Odoo. It does not
return business records, tokens, credentials, or connection details.

## Shopify configuration and development

The Shopify app URL, OAuth redirect, and customer-account extension backend
URL must point to the stable backend URL. Backend Git pushes deploy via Vercel;
changes to Shopify extensions still require a Shopify app deployment.

Set `ELCIRCLE_PRODUCTION_URL=https://elcircle-app-backend-ee6d.vercel.app` in the
laptop's private `.env.r2ev3h-um` to prevent the old development launcher from
replacing the hosted app URL with a temporary tunnel. A separate development
Shopify app should be used for future tunnel-based work.

If the Shopify app secret is rotated, existing encrypted session records cannot
be decrypted with the replacement secret. Plan a reauthentication of the app
and an encrypted-session migration before rotating it.
