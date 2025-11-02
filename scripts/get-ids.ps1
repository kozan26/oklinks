# PowerShell helper script to get Cloudflare resource IDs for wrangler.toml

Write-Host "Getting D1 Database ID..." -ForegroundColor Cyan
Write-Host "Run: npx wrangler d1 list" -ForegroundColor Yellow
Write-Host ""
npx wrangler d1 list | Select-String "oklinks-db"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database 'oklinks-db' not found. Create it first with: npx wrangler d1 create oklinks-db" -ForegroundColor Red
}

Write-Host ""
Write-Host "Getting KV Namespace ID..." -ForegroundColor Cyan
Write-Host "Run: npx wrangler kv namespace list" -ForegroundColor Yellow
Write-Host ""
npx wrangler kv namespace list | Select-String "CACHE"
if ($LASTEXITCODE -ne 0) {
    Write-Host "KV namespace 'CACHE' not found. Create it first with: npx wrangler kv namespace create CACHE" -ForegroundColor Red
}

Write-Host ""
Write-Host "Copy the IDs above and update wrangler.toml:" -ForegroundColor Green
Write-Host "- Replace 'your-database-id-here' with the D1 database ID"
Write-Host "- Replace 'your-kv-namespace-id-here' with the KV namespace ID"

