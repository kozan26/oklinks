#!/usr/bin/env node

/**
 * Generate a SHA-256 hash for the admin password
 * Usage: node scripts/generate-admin-password.js "your-password-here"
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-admin-password.js "your-password-here"');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\nAdmin Password Hash:');
console.log(hash);
console.log('\nAdd this to your Cloudflare Pages environment variables:');
console.log('Variable name: ADMIN_PASSWORD_HASH');
console.log(`Variable value: ${hash}\n`);

