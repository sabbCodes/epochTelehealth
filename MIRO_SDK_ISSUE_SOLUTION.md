# Miro SDK Loading Issue - Debug & Solution

## Problem Summary

The Miro BoardsPicker SDK script fails to load from the CDN. This is likely due to:

1. Miro API URL may have changed
2. CORS restrictions
3. Network/firewall issues
4. SDK availability at the time

## Quick Debug Steps

### Step 1: Check if token endpoint works

Open browser DevTools (F12) and run:

```javascript
fetch("/api/miro-token", { method: "POST" })
  .then((r) => r.json())
  .then((d) => console.log(d));
```

You should see:

```json
{
  "token": "eyJhbGci...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

If this works, the backend is fine. The issue is the Miro SDK loading.

### Step 2: Test Miro SDK Directly

In DevTools console, run:

```javascript
const script = document.createElement("script");
script.src = "https://miro.com/app/static/sdk/v2/miro.js";
script.onload = () => console.log("✅ SDK loaded");
script.onerror = () => console.log("❌ SDK failed");
document.head.appendChild(script);
```

If it fails, Miro SDK is not accessible from your network.

### Step 3: Check Network Tab

1. Click "Share" button → "Share Miro Board"
2. Open DevTools Network tab (F12)
3. Look for requests to `miro.com/app/static/`
4. Check the response - it should be JavaScript code
5. If you see 404 or blocked, the SDK URL is invalid or blocked

## Solutions

### Solution 1: Install Miro SDK via NPM (Recommended)

```bash
cd /home/sabb/epoch_telehealth/app
npm install @mirohq/sdk-js
```

Then update `WherebyVideoCall.tsx` to import it:

```tsx
import * as miro from "@mirohq/sdk-js";
```

### Solution 2: Use UNPKG CDN Fallback

Update the SDK loading in `WherebyVideoCall.tsx` useEffect:

```tsx
script.src = "https://unpkg.com/@mirohq/sdk-js@latest/dist/miro.min.js";
```

### Solution 3: Check Miro Status

Visit https://status.miro.com/ to see if their services are down.

### Solution 4: Update Redirect URI

Make sure your Miro app has the correct redirect URI:

- Development: http://localhost:3000
- Production: your actual domain

Go to: https://miro.com/app/settings/account/apps

## What to Try Now

1. **First**: Run the debug utils from the console

   - Import the debug file location
   - Run `testMiroIntegration()`

2. **Second**: Try the NPM package approach (Solution 1)

3. **Third**: If behind corporate firewall, check if `miro.com` is blocked

## Code Changes Needed

If we proceed with NPM package, I'll need to update:

1. `WherebyVideoCall.tsx` - Import and use the SDK directly
2. `package.json` - Add the dependency
3. Remove the script loading logic

Would you like me to proceed with Solution 1 (NPM package) or do you want to debug further first?

## Quick Test: Can You Reach Miro?

In browser console:

```javascript
fetch("https://miro.com/app/static/sdk/v2/miro.js", { method: "HEAD" })
  .then((r) => console.log("✅ Accessible, status:", r.status))
  .catch((e) => console.log("❌ Not accessible:", e.message));
```

Please run this and tell me what it says.
