# oklinks

Dark tactical personal URL shortener built for Cloudflare Pages + Functions with D1 storage, KV caching, Turnstile protection, and Queue-based analytics.

## Stack
- Cloudflare Pages with Pages Functions (TypeScript)
- Cloudflare D1 (SQLite) for links + aggregates
- Cloudflare KV for hot cache
- Optional: Cloudflare Queues for async click logging → Worker consumer fallback to direct D1 writes
- Astro + Tailwind UI, Vitest, ESLint, Prettier, pnpm, Wrangler v3

## One-shot setup
1. `pnpm install`
2. `npx wrangler d1 create oklinks-db`
3. `npx wrangler kv namespace create CACHE`
4. _(Optional)_ `npx wrangler queues create oklinks-clicks`
5. `pnpm db:apply`
6. Add generated IDs to `wrangler.toml` & `workers/click-consumer/wrangler.toml`, set `TURNSTILE_SECRET`, `PUBLIC_TURNSTILE_SITE_KEY`, optional `ACCESS_AUD`
7. Local run: `pnpm dev:pages`

> Tip: run the queue consumer locally with `wrangler dev --config workers/click-consumer/wrangler.toml` if you want live aggregation during development.

## Local development
- Pages Functions + UI: `pnpm dev:pages`
- Astro only (faster UI iteration): `pnpm dev:web`
- Apply schema: `pnpm db:apply`
- Typecheck / lint / test: `pnpm typecheck`, `pnpm lint`, `pnpm test`

Create a `.env` based on `.env.sample` with your Turnstile keys. When using `wrangler pages dev`, the env vars in `.env` are automatically loaded.

## Cloudflare Pages deployment
1. Push to a Git repository and connect it in the Cloudflare Pages dashboard.
2. Set Build command `pnpm --filter oklinks-web build`, Output directory `apps/web/dist`.
3. Enable Functions for the project; Wrangler config already points to the output directory.
4. Configure bindings (Pages → Settings → Functions):
   - D1: binding `DB`, choose previously created database `oklinks-db`.
   - KV Namespace: binding `CACHE`.
   - Queue Producer: binding `CLICK_QUEUE`, queue name `oklinks-clicks` (optional; skip if you did not create a queue).
   - Environment variable `TURNSTILE_SECRET` (and optional `ACCESS_AUD`).
   - Provide `PUBLIC_TURNSTILE_SITE_KEY` in Pages → Settings → Environment Variables (mark as public binding in new UI).
5. (Optional) Deploy the queue consumer worker: `wrangler deploy workers/click-consumer --config workers/click-consumer/wrangler.toml` and ensure it consumes `oklinks-clicks`.
6. Protect `/admin/*` with a Cloudflare Access policy (e.g., email allowlist) and optionally configure JWT audience as `ACCESS_AUD`.
7. Add a custom domain such as `okl.ink` via Pages.

## API examples
```bash
# Create a link
curl -X POST https://oklinks.example/api/links \
  -H 'content-type: application/json' \
  -d '{"target":"https://example.com","alias":"docs","turnstileToken":"<token>"}'

# Retrieve by ID
curl https://oklinks.example/api/links/<id>

# Delete by ID
curl -X DELETE https://oklinks.example/api/links/<id>
```

POST accepts optional fields:
- `alias` (sanitised to `[a-z0-9-_]`, random Base62(6) fallback)
- `expiresAt` (ISO string or epoch seconds)
- `password` (hashed server-side, future support)
- `turnstileToken` (required when `TURNSTILE_SECRET` set)

Responses:
- `200 { id, alias, target }`
- `409 { error: "alias_taken" }`
- `400` on invalid target, Turnstile failure, or missing input

## Behaviour notes
- KV cache keys `a:<alias>` hold `{ target, expiresAt, isActive }` with 1 hour TTL; redirects refresh cache after D1 hits.
- Expired or inactive links stop redirecting; cached entries honour expiry windows.
- Queue messages `{ alias, ts, ua, ref, ip }` are batched by the consumer Worker into `click_daily` and `links.clicks_total`. When no queue is configured, redirects update these metrics inline via D1.
- Admin UI fetches `/api/links?limit=50`, shows alias, target, click totals, expiry, and allows deletions (remember to guard with Cloudflare Access).
- Turnstile site key is exposed via `PUBLIC_TURNSTILE_SITE_KEY`; secret stays server-side. Leave the variables empty to skip Turnstile locally.

## Database schema
`db/schema.sql` defines:
- `links` table with alias uniqueness, optional expiry, password hash placeholder, `clicks_total` counter.
- `click_daily` aggregated counts keyed by alias + day (`YYYY-MM-DD`).

Apply migrations with `pnpm db:apply` using Wrangler D1 execute.

## Testing & quality
- `pnpm test` runs Vitest covering alias sanitisation, Base62 generator, and alias resolution cache/D1 behaviour.
- `pnpm lint` applies ESLint with TypeScript rules; `.astro` files are currently lint-excluded.
- `pnpm typecheck` validates Cloudflare worker + utility TypeScript under strict settings.

## Roadmap ideas
- Custom domains per user / tenant routing
- Enforce password-protected links at redirect time
- UTM parameter capture + enrichment before redirect
- Inline analytics charts on admin dashboard (daily + referrers)
- Real QR code encoder (swap out the placeholder SVG generator)

## Repository layout
```
oklinks/
  apps/web/        Astro UI (landing + admin)
  functions/       Pages Functions (create, manage, redirect)
  workers/         Queue consumer Worker
  db/schema.sql    D1 schema
  _headers         Security headers applied by Pages
  wrangler.toml    Project bindings
```

Happy shortening.
