# Lux Engine web application

Lux Engine is a Next.js application for real-estate agents to synchronize
listings, generate listing narratives, publish property microsites, manage
leads, and configure brokerage accounts.

## Local development

Requirements: Node.js 22+, npm, a Convex project, and a Clerk application.

```bash
npm ci
Copy-Item .env.example .env.local
npx convex dev
npm run dev:frontend
```

On macOS or Linux, use `cp .env.example .env.local`.

Configure the Clerk Convex JWT template and set
`CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard. Browser-visible values go
in `.env.local`; secrets used by Convex actions belong in the Convex dashboard,
as listed in `.env.example`.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
npx playwright test
```

## Production

Deploy the backend first with `npx convex deploy`, use its production URL for
`NEXT_PUBLIC_CONVEX_URL`, then build and run the Next.js application:

```bash
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

The application must sit behind an HTTPS reverse proxy. See
`../deploy/hostinger-kvm2.md` for the complete Hostinger VPS setup, service
units, environment variables, firewall rules, Nginx configuration, and
verification steps.

Custom-domain routing is implemented in the application, but every customer
domain also needs a valid TLS certificate at the reverse proxy. Do not enable
custom domains publicly until automated certificate issuance is configured.
