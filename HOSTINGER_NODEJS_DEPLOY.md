# Marac Workers - Hostinger Node.js Backend Deployment

Use this guide to deploy or migrate the backend API to Hostinger Node.js (e.g. from Render).

## Hostinger Git & Build Settings

Connect your GitHub repository to Hostinger Node.js web app:

```txt
Repository: abusazid46-tech/maracworkers
Branch: main
Framework preset: Other
Root directory: ./
Node version: 20.x or 22.x
Package manager: pnpm
```

Use these build and entry settings in the Hostinger dashboard:

```txt
Build command:
corepack prepare pnpm@9.12.3 --activate && pnpm run hostinger:build

Output directory:
apps/api/dist

Entry file:
server.js
```

> **Note on Entry file**: If Hostinger resolves the entry file path relative to the repository root rather than the output directory, set:
> ```txt
> apps/api/dist/server.js
> ```

## Environment Variables

Configure these environment variables in your Hostinger Node.js control panel before starting the application:

```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret_at_least_24_characters
CORS_ORIGIN=https://maracworkers.onrender.com,https://the-wings-group1.vercel.app,https://the-wings-group-admin.vercel.app
LOG_LEVEL=info
GOOGLE_CLIENT_ID=your_google_client_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_GRAPH_VERSION=v20.0
WHATSAPP_ADMIN_PHONE=9774887803
```

> Do not manually set `PORT` unless specifically required by Hostinger; the application automatically reads `process.env.PORT` provided by the hosting environment.

## Database Migrations

Before or right after the initial deployment, apply database schema migrations:

```bash
# From local or Hostinger SSH terminal:
pnpm --filter @the-wings/api db:deploy
```

## After Deployment Verification

1. Test the API health check:
   ```bash
   curl -i https://your-hostinger-domain/health
   ```
   Expected response:
   ```json
   {"status":"ok","timestamp":"...","uptime":...}
   ```

2. Update the frontend and admin environment variable on Vercel:
   ```env
   NEXT_PUBLIC_API_URL=https://your-hostinger-domain
   ```
   Then trigger a redeploy for both `apps/web` and `apps/admin`.

## Custom Domain Setup (Optional)

Point your custom subdomain (e.g., `api.maracworkers.com` or `api.thewingsgroup.online`) to your Hostinger application via CNAME/A records as provided in Hostinger DNS settings. Once SSL is active, update `NEXT_PUBLIC_API_URL` to point to your custom domain.

## Local Build Verification

To verify that the Hostinger build bundle generates without issues before pushing:

```bash
pnpm run hostinger:build
```
This builds Prisma client definitions and compiles `apps/api/src` into `apps/api/dist`.
