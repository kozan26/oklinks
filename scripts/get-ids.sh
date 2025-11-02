#!/bin/bash
# Helper script to get Cloudflare resource IDs for wrangler.toml

echo "Getting D1 Database ID..."
echo "Run: npx wrangler d1 list"
echo ""
npx wrangler d1 list | grep oklinks-db || echo "Database 'oklinks-db' not found. Create it first with: npx wrangler d1 create oklinks-db"

echo ""
echo "Getting KV Namespace ID..."
echo "Run: npx wrangler kv namespace list"
echo ""
npx wrangler kv namespace list | grep CACHE || echo "KV namespace 'CACHE' not found. Create it first with: npx wrangler kv namespace create CACHE"

echo ""
echo "Copy the IDs above and update wrangler.toml:"
echo "- Replace 'your-database-id-here' with the D1 database ID"
echo "- Replace 'your-kv-namespace-id-here' with the KV namespace ID"

