# VPN Control Center

A small full-stack control center for KeenVPN. Customers can create an account, activate or change a demo plan, review subscription state, search available VPN locations, and persist a preferred server. Administrators can manage locations, inspect operational activity, and review a read-only directory of users and subscription history.

The project models control-plane behavior only. It does not create a VPN tunnel or communicate with VPN infrastructure.

## Stack

- Next.js App Router, React, and TypeScript
- PostgreSQL with Prisma ORM and committed migrations
- Zod request validation
- Database-backed opaque sessions and `bcryptjs` password hashes
- Tailwind CSS and shadcn/ui with Radix primitives (Nova preset)
- Sonner accessible toast notifications
- Vitest and React Testing Library
- Docker Compose and GitHub Actions

## Quick start with Docker

The only prerequisites are Docker and Docker Compose.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The application container waits for PostgreSQL, applies migrations, idempotently seeds demo data, and then starts Next.js. PostgreSQL is exposed on host port `5433` to avoid collisions with a common local PostgreSQL installation; containers communicate on the standard internal port `5432`.

To stop the application:

```bash
docker compose down
```

The named PostgreSQL volume preserves data across restarts. `docker compose down -v` also deletes that local data.

## Local development

Node.js 22 and PostgreSQL are recommended.

```bash
cp .env.example .env
npm ci
docker compose up -d db
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). If using your own PostgreSQL instance, update `DATABASE_URL` and skip the Compose database command.

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:studio
```

Use `npm run db:migrate -- --name <change-name>` while developing a new Prisma schema migration. Use `npm run db:migrate:deploy` to apply committed migrations in CI and production.

## Demo accounts

| Account | Email | Password | Subscription |
| --- | --- | --- | --- |
| Active customer | `active@keenvpn.demo` | `DemoPass123!` | Active / Keen Plus |
| Trial customer | `trial@keenvpn.demo` | `DemoPass123!` | Trial / Keen Trial |
| Expired customer | `expired@keenvpn.demo` | `DemoPass123!` | Expired / Keen Plus |
| No subscription | `none@keenvpn.demo` | `DemoPass123!` | No subscription |
| Administrator | `admin@keenvpn.demo` | `AdminPass123!` | No subscription |

Registration is also available at `/signup`. A full name must contain at least two space-separated words, with two or more letters in every word. Self-registered accounts are always customers and begin with no subscription.

## Authentication and authorization

This exercise uses a deliberately small, self-contained email/password system:

1. Passwords are hashed with bcrypt using a cost factor of 12.
2. A successful login or registration creates 32 random bytes for an opaque session token.
3. Only the SHA-256 hash of that token is stored in PostgreSQL.
4. The raw token is sent in a 12-hour `HttpOnly`, `SameSite=Lax` cookie. `Secure` is enabled for HTTPS production origins; the documented local Docker HTTP origin intentionally omits it.
5. Every protected page and API request resolves the session from PostgreSQL and rejects missing or expired sessions.
6. Admin routes verify the `ADMIN` role in server-side services before any database mutation. Hiding admin navigation is only a user-interface convenience, not the authorization boundary.
7. State-changing requests reject cross-site fetch metadata and origins that do not match `APP_ORIGIN`.

Registration input has no role field; the server always writes `CUSTOMER`. Login errors do not reveal whether an email exists. Secrets are read from environment variables and no production secret is committed.

## Data model

- `User`: full name, email, role, password hash, and optional pinned server.
- `Session`: hashed token, user, and expiry.
- `Subscription`: plan, status, and current period end. No row represents “No subscription.”
- `SubscriptionHistory`: append-only plan/status snapshots, the prior state, period dates, and activation source.
- `Server`: country, city, unique hostname, availability, synthetic latency, and timestamps.
- `AdminAuditLog`: actor, action, affected server, before/after JSON, and timestamp.

Admin server mutations and their audit records run inside the same Prisma transaction. Admins manage the complete active/inactive inventory from `/servers`; customers see active locations only. Deleting a server is permanent, clears affected pinned preferences through the database relation, and retains a before-state audit snapshot. Disabling a pinned server does not erase the preference: the dashboard marks it unavailable and directs the customer to choose another active server.

When a customer already has a pinned location, choosing a different one opens a confirmation dialog identifying both locations and warning that the previous location will be disconnected. Cancelling sends no request; confirming keeps the existing optimistic update and rollback behavior.

The server-owned plan catalog contains Keen Essential, Keen Plus, and Keen Max. Every plan activates immediately for 30 days without pricing or a payment step, and tiers intentionally do not alter location access. Activation and its history row are committed in one database transaction. Active and Trial plans can be replaced immediately; reselecting the current active plan returns `409 PLAN_ALREADY_ACTIVE`.

Paginated server, user, and subscription-history screens share a browser-session in-memory cache. Keys include normalized search, filter, sorting, and page parameters. The cache deduplicates concurrent requests, retains at most 60 pages, preloads valid previous/next pages, renders cached navigation immediately, and revalidates in the background. Failed revalidation keeps the cached list visible.

## API

Success responses use `{ "data": ... }`. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fieldErrors": { "hostname": ["Enter a valid hostname."] }
  }
}
```

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Create a customer and session |
| `POST` | `/api/auth/login` | Public | Verify credentials and create a session |
| `POST` | `/api/auth/logout` | Signed in | Revoke the current session |
| `GET` | `/api/me` | Signed in | Account, subscription, and pinned server |
| `PATCH` | `/api/me/pinned-server` | Signed in | Pin or clear one active server |
| `GET` | `/api/plans` | Signed in | Server-owned plan catalog |
| `POST` | `/api/me/subscription/activate` | Customer | Activate or immediately replace a plan |
| `GET` | `/api/servers` | Signed in | Search, sort, and paginate active servers |
| `GET` | `/api/admin/overview` | Admin | Counts, database status, and recent activity |
| `GET` | `/api/admin/servers` | Admin | Search all active/inactive servers |
| `POST` | `/api/admin/servers` | Admin | Create a server and audit record |
| `PATCH` | `/api/admin/servers/:id` | Admin | Edit a server and audit record |
| `DELETE` | `/api/admin/servers/:id` | Admin | Permanently delete a server and retain an audit snapshot |
| `GET` | `/api/admin/audit-logs` | Admin | Paginated audit history |
| `GET` | `/api/admin/users` | Admin | Search/filter/sort the public user directory |
| `GET` | `/api/admin/users/:id` | Admin | Public account and current subscription details |
| `GET` | `/api/admin/users/:id/subscription-history` | Admin | Paginated append-only subscription history |
| `GET` | `/api/health` | Public | Lightweight database health probe |

Server listing parameters are `q`, `page`, `pageSize`, `sort`, and `order`; the admin inventory also accepts `status=all|active|inactive`. Supported sort keys are `latency`, `country`, `city`, and `createdAt`. Page size is capped at 50.

Expected status codes are `400` validation, `401` unauthenticated, `403` forbidden, `404` missing resource, `409` uniqueness or availability conflict, `500` unexpected failure, and `503` failed health probe.

## Testing and CI

Run the automated suite with:

```bash
npm test
```

Tests cover server-side role enforcement, atomic server audits and subscription history, plan validation/conflicts, registration normalization and forced customer roles, subscription presentation, plan confirmation, admin management visibility, pin-switch confirmation/cancellation, optimistic rollback, pagination cache isolation/deduplication/prefetching, and bounded eviction. The GitHub Actions workflow starts PostgreSQL and runs Prisma generation/migrations, linting, TypeScript checks, tests, and a production build.

The key manual acceptance flow is:

1. Sign in as `active@keenvpn.demo` and confirm the Active subscription.
2. Search active server locations, pin one, and refresh to verify persistence.
3. Sign in as `admin@keenvpn.demo`, create or edit a location, and disable it.
4. Return as the customer and confirm the disabled location is absent.
5. Submit an admin API request with the customer session and confirm HTTP `403`.
6. Visit `/plans`, confirm a plan selection, and inspect the new history entry from the admin user directory.

## Operational visibility

The admin view reports user and server counts, database health, and recent audit activity. `/api/health` performs a real PostgreSQL query and returns HTTP `503` when the dependency is unavailable. The endpoint intentionally avoids database names, connection strings, stack traces, or other sensitive internals.

## Trade-offs and Next Steps

- Replace custom demo authentication with a managed identity provider supporting email verification, password recovery, MFA, revocation across devices, and compromised-password checks.
- Add distributed login and mutation rate limits at a reverse proxy or shared store. The current same-origin and `SameSite` defenses reduce CSRF risk but are not a complete abuse-prevention system.
- Use a PostgreSQL search index or normalized country codes when the server catalog grows beyond a small inventory.
- Add Playwright browser tests for the complete customer/admin journey and axe-based accessibility checks.
- Introduce structured logs, request IDs, metrics, tracing, alerting, and real server-probe telemetry. Current latency values are synthetic.
- Define audit retention, export, access controls, and tamper-evidence policies. Audit records are append-only at the application level but retained indefinitely.
- Add subscription checkout, billing webhooks, invoices, proration, cancellation, and entitlement enforcement. The current plan flow deliberately models state transitions without payment.
- Move the in-memory page cache to a query library or persistent service-worker strategy if cross-tab or reload persistence becomes valuable.
- Run the production container behind a reverse proxy for TLS termination, request-size limits, rate limiting, and slow-client protection.
