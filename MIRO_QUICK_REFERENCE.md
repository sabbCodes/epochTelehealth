# Miro Integration Quick Reference

## ✅ Status: FIXED (November 25, 2025)

The issue was using the wrong SDK - now using **Miro BoardsPicker** (`boardsPicker.js`) instead of Web SDK.

## Quick Setup (5 minutes)

```bash
# 1. Get your Miro app credentials at:
# https://miro.com/app/settings/account/apps

# 2. Add to .env.local:
NEXT_PUBLIC_MIRO_CLIENT_ID=your_client_id
MIRO_CLIENT_SECRET=your_client_secret

# 3. Dependencies already installed ✅
# (jsonwebtoken was added during implementation)

# 4. Start dev server
npm run dev

# 5. Test it!
# - Join a video call
# - Click Share → Share Miro Board
# - Miro picker should open
```

```bash
# 1. Get your Miro app credentials at:
# https://miro.com/app/settings/account/apps

# 2. Add to .env.local:
NEXT_PUBLIC_MIRO_CLIENT_ID=your_client_id
MIRO_CLIENT_SECRET=your_client_secret

# 3. Dependencies already installed ✅
# (jsonwebtoken was added during implementation)

# 4. Start dev server
npm run dev

# Done! 🎉
```

## API Endpoint

**Generate JWT Token**

```bash
POST /api/miro-token

Response:
{
  "token": "eyJhbGci...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

## Component Usage

```tsx
import { WherebyVideoCall } from "@/app/video-call/WherebyVideoCall";

// In your component:
<WherebyVideoCall
  roomUrl="https://appear.in/your-room"
  localUser={currentUser}
  remoteUser={otherParticipant}
  role="doctor" // or "patient"
/>;
```

## Feature: Share Miro Board

1. During a video call, click the **Share** button (monitor icon)
2. Select **"Share Miro Board"** from dropdown
3. Miro BoardsPicker opens automatically
4. Select or create a board
5. Board embeds in the call interface
6. Participants can collaborate in real-time

## Code Locations

| Component    | Path                                  | Purpose                                    |
| ------------ | ------------------------------------- | ------------------------------------------ |
| Video Call   | `app/video-call/WherebyVideoCall.tsx` | Main video component with Miro integration |
| API Endpoint | `app/api/miro-token/route.ts`         | JWT token generation                       |
| Config       | `lib/miro-config.ts`                  | Configuration reference                    |
| Docs         | `MIRO_INTEGRATION_SETUP.md`           | Full setup guide                           |

## Environment Variables

```env
# Required
NEXT_PUBLIC_MIRO_CLIENT_ID=<your_client_id>
MIRO_CLIENT_SECRET=<your_secret>

# Optional
MIRO_API_URL=https://api.miro.com/v2
MIRO_API_KEY=<your_api_key>
```

## Key Functions

```tsx
// In WherebyVideoCall.tsx

// Opens Miro BoardsPicker
openMiroBoardsPicker()

// Handles share type selection
handleShareTypeSelect(type: "screen" | "whiteboard")

// Dropdown automatically manages state
<DropdownMenu> {/* built-in open/close state */}
```

## Common Issues & Fixes

| Issue                        | Solution                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| "Missing Miro configuration" | Add `NEXT_PUBLIC_MIRO_CLIENT_ID` and `MIRO_CLIENT_SECRET` to `.env.local`, restart dev server |
| BoardsPicker won't open      | Verify credentials are correct, check browser console for errors                              |
| CORS errors                  | Update redirect URI in Miro App settings to match your domain                                 |
| Token generation fails       | Check both env vars are set, restart server                                                   |

## Security Notes

⚠️ **Never commit `.env.local`** - it's in `.gitignore`  
⚠️ **Keep `MIRO_CLIENT_SECRET` confidential**  
✅ Tokens expire after 1 hour  
✅ Use HTTPS in production  
✅ Requests include no-cache headers

## Testing the Integration

```tsx
// Test endpoint in browser console:
fetch("/api/miro-token", { method: "POST" })
  .then((r) => r.json())
  .then((data) => console.log("Token:", data.token));
```

## Links

- 🔗 [Miro Developers](https://developers.miro.com/)
- 🔗 [BoardsPicker API](https://developers.miro.com/docs/web-sdk-boards-picker)
- 🔗 [App Settings](https://miro.com/app/settings/account/apps)
- 📖 [Full Setup Guide](./MIRO_INTEGRATION_SETUP.md)
- 📖 [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Support Files

- **Setup Instructions**: `MIRO_INTEGRATION_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **This Reference**: `MIRO_QUICK_REFERENCE.md`

---

Need help? Check the setup guide or review the configuration file comments in `lib/miro-config.ts`
