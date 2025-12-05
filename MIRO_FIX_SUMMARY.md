# Miro BoardsPicker Fix - November 25, 2025

## Problem Identified

The code was trying to load the **Miro Web SDK** (`miro.js`) instead of the **Miro BoardsPicker SDK** (`boardsPicker.js`).

- ✗ `window.miro` - Full Web SDK (requires running inside Miro app environment)
- ✓ `window.miroBoardsPicker` - Standalone board picker widget (standalone, can be used anywhere)

## Root Cause

The console logs showed:

```
✅ Miro SDK script loaded successfully
🎨 window.miro available: true
```

But then:

```
SdkConnectionError: Miro SDK is not connected.
Ensure your app is running within the Miro environment.
```

And when trying to use BoardsPicker:

```
❌ Miro SDK failed to load after 5 seconds
```

This is because we loaded the wrong SDK!

## Solution Applied

### Changed SDK URL

**Before:**

```javascript
script.src = "https://miro.com/app/static/sdk/v2/miro.js";
```

**After:**

```javascript
script.src = "https://miro.com/app/static/boardsPicker.js";
```

### Updated Type Declarations

Removed `window.miro` since we don't need it - we only need `window.miroBoardsPicker`

### Improved Fallback Logic

Added retry mechanism in `openMiroBoardsPicker`:

- Waits for BoardsPicker to be available
- If still not available, tries to load the script again
- Better error messages

## What Should Happen Now

1. Component mounts → loads `boardsPicker.js` script ✓ (already happening)
2. User clicks "Share Miro Board" → calls `openMiroBoardsPicker()`
3. Backend generates JWT token ✓ (already working)
4. `window.miroBoardsPicker` should now be available ✓ (should be fixed)
5. Miro BoardsPicker opens with your token
6. User selects a board
7. Board HTML is embedded in the call

## Testing

1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Join a video call
3. Click the Share button → "Share Miro Board"
4. Look for this console sequence:

   ```
   🔄 handleShareTypeSelect called with type: whiteboard
   🎨 Opening Miro BoardsPicker...
   🎨 openMiroBoardsPicker: Starting...
   🎨 Checking window.miroBoardsPicker: false (initially)
   🔑 Fetching JWT token from /api/miro-token...
   📊 Token response status: 200
   ✅ JWT token received, length: 227
   ✅ Miro BoardsPicker is ready
   🎨 Opening Miro BoardsPicker with token...
   ```

5. Miro BoardsPicker dialog should open

## If It Still Doesn't Work

Check:

1. ✅ SDK is still accessible:

   ```javascript
   fetch("https://miro.com/app/static/boardsPicker.js", {
     method: "HEAD",
   }).then((r) => console.log("✅ Status:", r.status));
   ```

2. ✅ Token endpoint works:

   ```javascript
   fetch("/api/miro-token", { method: "POST" })
     .then((r) => r.json())
     .then((d) => console.log("Token:", d.token.slice(0, 20) + "..."));
   ```

3. ✅ Environment variables are set:
   - Check `.env.local` has both `NEXT_PUBLIC_MIRO_CLIENT_ID` and `MIRO_CLIENT_SECRET`
   - Restart dev server if you just added them

## Files Changed

- `/home/sabb/epoch_telehealth/app/app/video-call/WherebyVideoCall.tsx`
  - Line 152-189: Updated SDK loading in useEffect
  - Line 275-347: Improved `openMiroBoardsPicker` function
  - Line 38-44: Updated global type declarations

## Status

✅ Fixed - Ready to test!

---

**Key Takeaway**: Always load the specific SDK you need, not just the main SDK. BoardsPicker is a standalone widget SDK, while the Web SDK requires a Miro app environment.
