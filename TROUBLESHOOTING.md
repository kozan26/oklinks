# Troubleshooting Guide

## Short Links Not Working (Error 1101: Worker threw exception)

### Quick Checklist

1. **Verify Project Type:**
   - ✅ Should be **Cloudflare Pages** (not Workers)
   - In dashboard: **Workers & Pages** → **Pages** → Your project
   - The URL should be `*.pages.dev` (not a Workers subdomain)

2. **Verify Build Configuration:**
   - Go to: **Settings** → **Builds & deployments**
   - **Build command:** `pnpm install && cd apps/web && pnpm build`
   - **Build output directory:** `apps/web/dist`
   - **Root directory:** `/` (leave empty or set to repository root)

3. **Verify Functions Directory:**
   - Functions should be in: `functions/` folder at repository root
   - The catch-all handler: `functions/[[path]].ts` must exist
   - API handlers: `functions/api/links.ts` and `functions/api/links_[id].ts`

4. **Verify Database Binding:**
   - Go to: **Settings** → **Functions** → **Bindings**
   - Must have **D1 Database** binding named `DB`
   - Database: Select `oklinks-db`

5. **Verify Database Schema:**
   - Database schema must be applied
   - Check: **Workers & Pages** → **D1** → `oklinks-db` → **Console**
   - Run: `SELECT name FROM sqlite_master WHERE type='table';`
   - Should show `links` and `click_daily` tables

6. **Check Build Logs:**
   - Go to: **Deployments** → Click on latest deployment
   - Verify build completed successfully
   - Check that `apps/web/dist` folder contains `index.html` and `admin/index.html`

7. **Check Function Logs:**
   - Go to: **Deployments** → Latest deployment → **Functions** tab
   - Or: **Settings** → **Functions** → **Logs**
   - Look for error messages related to your short link

### Common Issues

**Issue: "Database not configured"**
- Solution: Add `DB` binding in Pages Settings → Functions → Bindings

**Issue: "Database schema not applied"**
- Solution: Run SQL schema in D1 Console (see README.md step 3)

**Issue: Static files not found**
- Solution: Verify build output directory is `apps/web/dist`
- Check build logs to ensure Astro build completed

**Issue: Short links return Error 1101**
- Solution: Check Workers Logs for exact error
- Verify database binding is configured
- Verify database schema is applied

### Testing Locally

```bash
# Install dependencies
pnpm install

# Build the Astro app
cd apps/web && pnpm build

# Verify build output
ls -la apps/web/dist
# Should see: index.html, admin/index.html, _assets/

# Test with Wrangler (requires wrangler.toml for local dev)
cd ../..
pnpm dev:pages
```

### Need More Help?

1. Check **Workers Logs** in Cloudflare Dashboard for exact error messages
2. Verify all settings match the README.md instructions
3. Try creating a new link and accessing it to see the error

