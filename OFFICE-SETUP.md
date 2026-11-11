# Run El Circle 88 on another Windows laptop

Use Node.js 24 LTS and Git. Both repositories use the branch `codex/elcircle-office-setup`.

## First setup

Clone both repositories into the same parent folder with their default names:

```cmd
git clone --branch codex/elcircle-office-setup https://github.com/maazkh10/Elcircle-app-backend.git
git clone --branch codex/elcircle-office-setup https://github.com/maazkh10/Elcircle-app-frontend-theme-and-app.git
cd Elcircle-app-backend
npm install
npx shopify auth login
```

Sign in as the Shopify user who has access to the existing Elcircle Loyalty app and El Circle 88 store.

Securely copy these two private files from the personal laptop's backend folder into the office laptop's `Elcircle-app-backend` folder:

- `.env` — existing Odoo connection and field mappings
- `.env.r2ev3h-um` — existing Elcircle Loyalty app credentials and scopes

Do not commit these files, paste their contents into chat, or put them in a public location. Credential-free `.example` files are included to show the expected structure. The examples alone do not contain working credentials.

Then install the companion project:

```cmd
cd ..\Elcircle-app-frontend-theme-and-app
npm install
```

## Run

Stop the runner on the personal laptop first. Only one laptop should publish the development tunnel URL for this Shopify app at a time.

Run this from either repository:

```cmd
npm run dev
```

One server runs the combined backend and all migrated extensions on port 43190. Running it from the frontend repository delegates to the adjacent backend. Its Liquid, JavaScript and CSS sources synchronize with the combined theme extension. Wait for extension deployment to finish, then refresh the Shopify editor.

The first startup creates a fresh local Shopify-session database and updates the temporary tunnel URL. Open the Shopify app when prompted so it can create a session for this laptop. Odoo data remains in the existing Odoo service and is not stored in Git.

The launcher uses the Shopify CLI installed by `npm install`. On Windows it downloads Cloudflare Tunnel from Cloudflare's official GitHub release if no local executable is available. This executable stays in the ignored `.cache` folder. If company policy blocks downloads, install Cloudflare Tunnel through your office's approved process and set `ELCIRCLE_CLOUDFLARED_PATH` in the private environment file.

Default repository names and the original personal-laptop folder arrangement are both supported. For a different arrangement, set `ELCIRCLE_BACKEND_ROOT` and `ELCIRCLE_ADMIN_ROOT` to the appropriate absolute project paths before starting.

## Later updates

Run in each repository:

```cmd
git switch codex/elcircle-office-setup
git pull --ff-only
npm install
```

Then run `npm run dev` once. Preserve the two private environment files between updates.

This is a laptop development setup. The laptop and terminal must remain running for the APIs. Permanent hosting is separate. Theme block availability does not establish that purchases, redemption, return requests or order-triggered crediting have passed end-to-end transaction tests.
