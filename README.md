# Marac Workers Platform

Full-stack monorepo for Marac Workers skilled trade and home services platform.

## Apps

- `apps/web` - Next.js customer website with modern worker network design, search, live booking, cart, and authentication.
- `apps/admin` - Next.js admin CRM and operations dashboard for bookings, services, worker leads, and analytics.
- `apps/api` - Express + Prisma backend with PostgreSQL database.
- `apps/mobile` - Expo React Native mobile application for Android and iOS.

## Shared Packages

- `packages/types` - Shared TypeScript domain types.
- `packages/validation` - Shared Zod validation schemas.
- `packages/api-client` - Typed API client with fallback endpoints.
- `packages/ui` - Shared design tokens.
