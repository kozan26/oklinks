# oklinks

A production-ready personal URL shortener built on Cloudflare Pages with Pages Functions. Features include D1 database, KV caching, async click tracking via Queues, Turnstile anti-abuse protection, and Cloudflare Access for admin routes.

**Short. Smart. Yours.**

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- Cloudflare account with Wrangler CLI
- Turnstile (optional - only if you want anti-abuse protection)

### One-Shot Setup

1. **Install dependencies:**
   ```bash
   pnpm i
   ```

2. **Create Cloudflare resources (REQUIRED before deploying):**
   
   **Create D1 database:**
   ```bash
   npx wrangler d1 create oklinks-db
   ```
   The database will be created and visible in Cloudflare Dashboard → D1
   
   **Create KV namespace:**
   ```bash
   npx wrangler kv namespace create CACHE
   ```
   The namespace will be created and visible in Cloudflare Dashboard → KV
   
   **Create Queue:**
   ```bash
   npx wrangler queues create oklinks-clicks
   ```
   The queue will be created and visible in Cloudflare Dashboard → Queues

3. **Apply database schema:**
   ```bash
   pnpm db:apply
   ```
   
   **Note:** If this fails, you may need to create a `wrangler.toml` file temporarily for local development:
   ```toml
   name = "oklinks"
   compatibility_date = "2024-11-22"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "oklinks-db"
   database_id = "your-database-id-here"  # Get from: npx wrangler d1 list
   ```

4. **Run locally (optional - for testing):**
   ```bash
   pnpm dev:pages
   ```

## Cloudflare Pages Deployment

### Initial Setup

1. **Connect Repository:**
   - Go to Cloudflare Dashboard > Pages
   - Click "Create a project" > "Connect to Git"
   - Select your repository and branch

2. **Build Configuration:**
   - Framework preset: None (or Astro)
   - Build command: `pnpm install && cd apps/web && pnpm build`
   - Build output directory: `apps/web/dist`
   - Root directory: `/` (repository root)
   
   **Note:** We don't use `wrangler.toml` for Pages deployment - bindings are configured in the dashboard instead.

3. **Environment Variables:**
   - (Optional) Add `TURNSTILE_SECRET` if you want anti-abuse protection (from Turnstile dashboard)
   - (Optional) Add `ACCESS_AUD` for JWT validation

4. **Configure Bindings (in Pages Dashboard):**
   
   **IMPORTANT:** You must create the resources first (see step 2 above) before they'll appear in the dropdown!
   
   - Go to your Pages project → **Settings** → **Functions**
   - Click **"Add binding"** for each:
     - **D1 Database:** 
       - Variable name = `DB`
       - Select `oklinks-db` from dropdown (it will appear after you create it)
     - **KV Namespace:** 
       - Variable name = `CACHE`
       - Select `CACHE` from dropdown
     - **Queue:** 
       - Variable name = `CLICK_QUEUE`
       - Select `oklinks-clicks` from dropdown
   - Click **Save** after adding each binding

5. **Deploy:** Click "Save and Deploy"

### Click Consumer Worker

Deploy the click consumer worker separately:

```bash
cd workers/click-consumer
npx wrangler deploy
```

Or configure it in the Pages project settings as a Worker integration that consumes the `oklinks-clicks` queue.

### Custom Domain

1. In Pages project settings, go to "Custom domains"
2. Add your domain (e.g., `oklinks.link` or `okl.ink`)
3. Follow DNS configuration instructions
4. SSL will be provisioned automatically

### Cloudflare Access Setup (Admin Protection)

1. **Create Access Policy:**
   - Go to Cloudflare Dashboard > Zero Trust > Access > Applications
   - Click "Add an application"
   - Application name: `oklinks-admin`
   - Application domain: `your-domain.com/admin/*`
   - Policy: Add a rule with email allowlist (your emails)

2. **Optional JWT Validation:**
   - If `ACCESS_AUD` is set in environment variables, the admin API can validate the `CF-Access-Jwt-Assertion` header
   - This is non-blocking if the variable is not set

## API Reference

### Create Link

```bash
POST /api/links
Content-Type: application/json

{
  "target": "https://example.com",
  "alias": "my-link",  # optional
  "expiresAt": 1735689600000,  # optional, Unix timestamp in ms
  "password": "secret",  # optional
  "turnstileToken": "..."  # optional, only if TURNSTILE_SECRET is configured
}
```

**Response (200):**
```json
{
  "id": "abc123...",
  "alias": "my-link",
  "target": "https://example.com"
}
```

**Error (409):**
```json
{
  "error": "Alias already taken",
  "alias_taken": true
}
```

### Get Link

```bash
GET /api/links/:id
```

**Response (200):**
```json
{
  "id": "abc123...",
  "alias": "my-link",
  "target": "https://example.com",
  "created_at": 1705276800,
  "expires_at": null,
  "is_active": 1,
  "clicks_total": 42,
  "created_by": "192.0.2.1"
}
```

### List Links (Admin)

```bash
GET /api/links?limit=50
```

**Response (200):**
```json
[
  { "id": "...", "alias": "...", ... },
  ...
]
```

### Delete Link

```bash
DELETE /api/links/:id
```

**Response (200):**
```json
{
  "deleted": true
}
```

### Redirect

Access a short link: `GET /:alias`

- Resolves alias from KV cache (miss → D1)
- Checks `is_active` and `expires_at`
- Enqueues click event to `CLICK_QUEUE`
- Returns 302 redirect or 404

### QR Code

```bash
GET /qr/:alias
```

Returns an SVG QR code for the resolved target URL.

## Limits & Constraints

- **Alias format:** Lowercase letters, numbers, hyphens, underscores only (max 50 chars)
- **Default alias length:** 6 Base62 characters if not provided
- **KV cache TTL:** 3600 seconds (1 hour)
- **Expiry:** Unix timestamp in seconds (stored in D1)
- **Click aggregation:** Daily aggregates in `click_daily` table
- **Admin list:** Default limit of 50 links (configurable via `?limit=`)

## Architecture

- **Frontend:** Astro app with Tailwind CSS (dark "Tactical Noir" theme)
- **Backend:** Cloudflare Pages Functions (edge runtime)
- **Database:** D1 (SQLite) for persistent storage
- **Cache:** KV for fast alias resolution
- **Queue:** Async click logging and aggregation
- **Security:** Turnstile CAPTCHA, Cloudflare Access, security headers

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests
pnpm test

# Local development (Pages Functions)
pnpm dev:pages

# Local development (Astro only)
pnpm dev:web
```

## Roadmap

- [ ] Custom domains per user
- [ ] Password-protected links (server-side validation)
- [ ] UTM parameter capture and forwarding
- [ ] Analytics charts (click trends, referrers, geolocation)
- [ ] Bulk import/export
- [ ] API authentication tokens
- [ ] Webhook notifications
- [ ] Advanced QR code options (colors, sizes, formats)

## License

MIT

