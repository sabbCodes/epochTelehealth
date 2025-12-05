# Miro Integration Troubleshooting Guide - UPDATED

## ✅ ISSUE FIXED - November 25, 2025

### What Was Wrong

We were loading the **Miro Web SDK** (`miro.js`) instead of the **Miro BoardsPicker** SDK (`boardsPicker.js`).

- Web SDK (`miro.js`) - Requires running inside the Miro app environment
- BoardsPicker (`boardsPicker.js`) - Standalone widget that works anywhere ✓

### What Changed

Updated the SDK loading to use the correct BoardsPicker script:

```javascript
// Before (WRONG - Web SDK)
script.src = "https://miro.com/app/static/sdk/v2/miro.js";

// After (CORRECT - BoardsPicker SDK)
script.src = "https://miro.com/app/static/boardsPicker.js";
```

## Testing the Fix

1. **Hard refresh** your browser (Ctrl+Shift+R)
2. Open a video call
3. Click Share → "Share Miro Board"
4. Miro BoardsPicker should now open!

---

## Troubleshooting (if issues persist)

1. **CORS Policy Violation** - Miro CDN scripts blocked by browser CORS
2. **Incorrect Script URL** - Miro API endpoints may have changed
3. **Missing Configuration** - Environment variables not properly set
4. **Network Issues** - Firewall or proxy blocking Miro CDN

### Solutions

#### Step 1: Verify Environment Variables

Check that `.env.local` has:

```bash
NEXT_PUBLIC_MIRO_CLIENT_ID=3458764649721408892
MIRO_CLIENT_SECRET=iUz7YzJZp6WE48N3o32fV9WP5anc0p7y
```

Restart your dev server after adding:

```bash
npm run dev
```

#### Step 2: Check Miro App Configuration

1. Visit [Miro App Settings](https://miro.com/app/settings/account/apps)
2. Click on your "Epoch Telehealth" app
3. Verify:
   - ✅ OAuth 2.0 enabled
   - ✅ Scopes include: `boards:read`, `boards:write`, `identity:read`
   - ✅ Redirect URI matches your domain (http://localhost:3000 for dev)
   - ✅ App is ACTIVE (not in Draft mode)

#### Step 3: Check Browser Network

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Click "Share Miro Board"
4. Look for failed requests to:
   - `miro.com/app/static/boardsPicker.js`
   - `miro.com/app/static/sdk/v2/miro.js`
5. Check the response headers:
   - Should see `Content-Type: application/javascript`
   - Check for CORS headers

#### Step 4: Check API Token Endpoint

In DevTools Console:

```javascript
// Test if the token endpoint works
fetch("/api/miro-token", { method: "POST" })
  .then((r) => r.json())
  .then((data) => console.log("Token:", data))
  .catch((e) => console.error("Error:", e));
```

You should see a token response like:

```json
{
  "token": "eyJhbGci...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

#### Step 5: Check Console Logs

When you click "Share Miro Board", look for this sequence:

1. ✅ `🔄 handleShareTypeSelect called with type: whiteboard`
2. ✅ `🎨 Opening Miro BoardsPicker...`
3. ✅ `🎨 openMiroBoardsPicker: Starting...`
4. ✅ `🎨 Checking window.miroBoardsPicker: false` (initially)
5. ✅ `📒 Waiting for Miro SDK to load...`
6. ⏳ Wait 5 seconds...
7. ❌ If it says "Miro SDK failed to load after 5 seconds", continue to Step 6

#### Step 6: Clear Cache and Refresh

```bash
# Clear Next.js cache
rm -rf app/.next

# Restart dev server
npm run dev
```

Then:

1. Hard refresh in browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Try again

#### Step 7: Check Miro Status

Visit [Miro Status Page](https://status.miro.com/) to check if their services are operational.

### Alternative Solution: Use Miro Web SDK Directly

If the BoardsPicker continues to fail, we can integrate Miro's Web SDK directly:

```bash
npm install @mirohq/sdk-js
```

Then update the integration to use the direct SDK instead of BoardsPicker.

### Debug Mode: Enable Detailed Logging

The component now includes comprehensive logging. Check browser console for:

- 🎨 Miro operation logs (yellow/blue)
- 🔑 Token generation logs
- ❌ Error logs in red
- ✅ Success logs in green

Look for the full sequence to identify where it fails.

### Network Troubleshooting

If you're behind a corporate proxy/firewall:

1. **Check if Miro is blocked**:

   - Try visiting https://miro.com directly in a browser
   - If blocked, contact IT for allowlist

2. **Required Miro domains** (add to allowlist):

   - `miro.com`
   - `*.miro.com`
   - `app.miro.com`
   - `api.miro.com`

3. **CDN domains** (for SDK scripts):
   - `*.jsdelivr.net` (if using CDN fallback)
   - `unpkg.com` (if using unpkg CDN)

### Common Error Messages

#### "NEXT_PUBLIC_MIRO_CLIENT_ID is not configured"

**Solution**: Add `NEXT_PUBLIC_MIRO_CLIENT_ID=your_id` to `.env.local` and restart dev server

#### "Failed to get Miro token"

**Solution**:

- Check that `/api/miro-token` endpoint responds with 200
- Verify `MIRO_CLIENT_SECRET` is set correctly
- Check server logs for detailed error

#### "Miro SDK is not available. Please refresh the page"

**Solution**:

- Hard refresh the page (Ctrl+Shift+R)
- Check if Miro CDN is accessible
- Try in an incognito/private window
- Check if VPN/proxy is blocking Miro

#### "Token endpoint returned 500"

**Solution**:

- Check that both env vars are set:
  - `NEXT_PUBLIC_MIRO_CLIENT_ID`
  - `MIRO_CLIENT_SECRET`
- Restart dev server
- Check server logs: `npm run dev` output

### Testing Checklist

- [ ] Env vars are set in `.env.local`
- [ ] Dev server was restarted after adding env vars
- [ ] Browser was hard-refreshed (Ctrl+Shift+R)
- [ ] Miro app is ACTIVE (not Draft)
- [ ] Miro app has correct redirect URI
- [ ] Miro app has required scopes
- [ ] `/api/miro-token` endpoint returns 200
- [ ] Browser console shows no CORS errors
- [ ] Not behind corporate firewall blocking Miro
- [ ] Miro services are operational (check status page)

### Getting Help

If none of these steps work:

1. **Check Miro Documentation**: https://developers.miro.com/docs/web-sdk-boards-picker
2. **Miro Developer Community**: https://community.miro.com/
3. **Check Recent Miro API Changes**: https://developers.miro.com/changelog

### Temporary Workaround

While debugging, you can temporarily disable Miro Board sharing by removing the menu item:

In `WherebyVideoCall.tsx`, comment out:

```tsx
/*
<DropdownMenuItem onSelect={() => handleShareTypeSelect("whiteboard")}>
  <Square className="w-4 h-4 mr-2" />
  <span>Share Miro Board</span>
</DropdownMenuItem>
*/
```

This keeps the regular screen sharing functional while we fix the Miro integration.

---

## Updated Code Changes

### What's New

1. **Better SDK Loading**: Now tries two different SDK URLs with fallback
2. **Detailed Logging**: Every step is logged with emoji indicators
3. **Timeout Handling**: Waits up to 5 seconds for SDK to load
4. **Error Messages**: Clear, actionable error messages
5. **Env Var Checking**: Validates configuration before attempting load

### Key Improvements

- Removed inline script loading from `openMiroBoardsPicker`
- SDK now loads once on component mount via `useEffect`
- Added timeout and retry logic
- Better error handling and user feedback

---

**Last Updated**: November 25, 2025
**Status**: Investigating Miro SDK loading issues
