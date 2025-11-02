# oklinks

A production-ready personal URL shortener built on Cloudflare Pages with Pages Functions. Features include D1 database, KV caching, async click tracking via Queues (optional - paid plan), Turnstile anti-abuse protection (optional), and Cloudflare Access for admin routes.

**Short. Smart. Yours.**

**Works on free plan!** Only Queues require a paid plan. All core features work without it.

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
   
   You can create these either via command line OR manually in the dashboard:
   
   **Option A: Command Line (Faster)**
   ```bash
   npx wrangler d1 create oklinks-db
   npx wrangler kv namespace create CACHE
   npx wrangler queues create oklinks-clicks
   ```
   
   **Option B: Manual (Dashboard)**
   
   **Create D1 Database:**
   1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   2. Click **Workers & Pages** in the left sidebar
   3. Click **D1** in the submenu
   4. Click **"Create database"** button
   5. Database name: `oklinks-db`
   6. Click **"Create"**
   
   **Create KV Namespace:**
   1. In Cloudflare Dashboard, click **Workers & Pages** → **KV**
   2. Click **"Create a namespace"** button
   3. Namespace name: `CACHE`
   4. Click **"Add"**
   
   **Create Queue (Optional - requires paid plan):**
   1. In Cloudflare Dashboard, click **Workers & Pages** → **Queues**
   2. Click **"Create queue"** button
   3. Queue name: `oklinks-clicks`
   4. Click **"Create queue"**
   
   **Note:** Queues require a paid Cloudflare plan. The app works fine without it - you just won't get click tracking analytics. Skip this if you're on the free plan.

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
   
   Steps:
   1. Go to your Pages project in Cloudflare Dashboard
   2. Click **Settings** tab
   3. Click **Functions** in the left sidebar
   4. Scroll down to **Bindings** section
   
   **Add D1 Database Binding:**
   - Click **"Add binding"** → Select **"D1 database"**
   - Variable name: `DB`
   - D1 database: Select `oklinks-db` from dropdown
   - Click **"Save"**
   
   **Add KV Namespace Binding:**
   - Click **"Add binding"** → Select **"KV namespace"**
   - Variable name: `CACHE`
   - KV namespace: Select `CACHE` from dropdown
   - Click **"Save"**
   
   **Add Queue Binding (Optional - requires paid plan):**
   - Click **"Add binding"** → Select **"Queue"**
   - Variable name: `CLICK_QUEUE`
   - Queue: Select `oklinks-clicks` from dropdown
   - Click **"Save"**
   
   **Note:** Queues are optional - skip this if you don't have a paid plan. The app will work without click tracking.
   
   **Tip:** If a resource doesn't appear in the dropdown, wait a minute and refresh the page - it may take a moment to sync.

5. **Deploy:** Click "Save and Deploy"

### Click Consumer Worker (Optional - requires paid plan)

**Note:** This is only needed if you have Queues set up (requires paid plan). Skip this if you're on the free plan.

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

