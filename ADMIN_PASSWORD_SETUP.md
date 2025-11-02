# Admin Password Setup Guide

To protect the admin page with a password, you need to set the `ADMIN_PASSWORD_HASH` environment variable in Cloudflare Pages.

## Step 1: Generate Your Password Hash

You need to generate a SHA-256 hash of your password. Here are three ways to do it:

### Option A: Using Node.js (Recommended)

1. Open your terminal in the project directory
2. Run this command (replace `your-password` with your actual password):

```bash
node scripts/generate-admin-password.js "your-password"
```

Example:
```bash
node scripts/generate-admin-password.js "MySecurePassword123!"
```

3. Copy the hash that is displayed

### Option B: Using Online Tool (Less Secure)

1. Go to https://www.sha256online.com/
2. Enter your password
3. Copy the SHA-256 hash

### Option C: Using PowerShell (Windows)

1. Open PowerShell
2. Run this command (replace `your-password` with your actual password):

```powershell
$password = "your-password"; $bytes = [System.Text.Encoding]::UTF8.GetBytes($password); $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes); [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
```

## Step 2: Add to Cloudflare Pages

**IMPORTANT**: You need to paste the **HASH** (not your password) into Cloudflare Pages!

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → Your project (`oklinks`)
3. Click **Settings** → **Environment Variables**
4. Click **Add variable**
5. Add:
   - **Variable name**: `ADMIN_PASSWORD_HASH`
   - **Variable value**: Paste the **HASH** (the long string) from Step 1
     - ✅ DO: Paste the hash like `ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae`
     - ❌ DON'T: Paste your actual password like `MyPassword123`
6. Make sure to set it for **Production** (and **Preview** if you want)
7. Click **Save**

## Step 3: Redeploy

After adding the environment variable, you need to trigger a new deployment:

1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment, OR
3. Make a small change (like a comment) and push to trigger a new build

## Step 4: Test

1. Go to your admin page: `https://your-domain.pages.dev/admin`
2. You should see a login screen
3. Enter your **actual password** (the one you typed in Step 1, NOT the hash)
   - Example: If you ran `node scripts/generate-admin-password.js "MyPassword123"`, type `MyPassword123`
4. You should now be able to access the admin panel

## Important Notes

- **Never share your password hash publicly**
- The hash is one-way - you can't get your password back from it
- If you forget your password, generate a new hash and update the environment variable
- The session lasts 24 hours before you need to log in again

## Troubleshooting

- **"Admin not configured" error**: Make sure `ADMIN_PASSWORD_HASH` is set in Cloudflare Pages environment variables
- **"Invalid password" error**: Double-check you're entering the exact password you hashed
- **Login doesn't work after deployment**: Make sure the environment variable is set for Production and trigger a new deployment

