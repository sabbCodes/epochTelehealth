# Miro Integration Setup Guide

## Overview

This guide walks you through setting up Miro BoardsPicker integration for collaborative whiteboarding during video calls in the Epoch Telehealth platform.

## What's Been Implemented

### 1. Frontend Components

- **WherebyVideoCall.tsx**: Updated with Miro BoardsPicker integration
  - New state for managing Miro embed HTML
  - `openMiroBoardsPicker()` function to handle board selection
  - Integrated dropdown menu with "Share Miro Board" option
  - Automatic Miro SDK loading on component mount

### 2. Backend API

- **`/api/miro-token`** (POST endpoint): Generates JWT tokens for Miro authentication
  - Secure token generation using `jsonwebtoken`
  - 1-hour token expiration for security
  - No-cache headers to prevent token caching
  - Error handling and logging

### 3. Configuration File

- **`lib/miro-config.ts`**: Centralized Miro configuration and documentation

## Setup Instructions

### Step 1: Create a Miro App

1. Go to [Miro App Settings](https://miro.com/app/settings/account/apps)
2. Click "Create new app"
3. Choose "OAuth 2.0" as the authentication type
4. Fill in the following details:
   - **App name**: Epoch Telehealth
   - **App description**: Real-time collaborative whiteboarding during telemedicine calls
   - **Redirect URI**:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`

### Step 2: Configure Permissions

In your Miro App settings, ensure these scopes are enabled:

- `boards:read` - Allow reading board information
- `boards:write` - Allow creating and modifying boards
- `identity:read` - Allow reading user identity information

### Step 3: Set Environment Variables

Add the following to `/home/sabb/epoch_telehealth/app/.env.local`:

```env
# Miro OAuth Configuration
NEXT_PUBLIC_MIRO_CLIENT_ID=your_client_id_here
MIRO_CLIENT_SECRET=your_client_secret_here

# Optional: Miro API Configuration
MIRO_API_URL=https://api.miro.com/v2
```

**Where to find these values:**

1. Go to your Miro App in [Settings](https://miro.com/app/settings/account/apps)
2. Click on your app
3. Copy the **Client ID** and **Client secret** from the App Credentials section

### Step 4: Restart Your Application

```bash
cd /home/sabb/epoch_telehealth/app
npm run dev
```

## How It Works

### User Flow

1. **During a video call**, users click the "Share" button (monitor icon with dropdown)
2. **Two options appear**:
   - Share Screen: Activates standard screen sharing
   - Share Miro Board: Opens Miro BoardsPicker
3. **Clicking "Share Miro Board"**:
   - Frontend calls `/api/miro-token` to get a JWT token
   - Miro BoardsPicker opens with authentication
   - User selects or creates a board
   - Selected board HTML is embedded in the call interface
4. **Participants** can see the shared board and collaborate in real-time

### Technical Flow

```
Frontend Request
    ↓
/api/miro-token Endpoint
    ├─ Validates environment variables
    ├─ Creates JWT payload with Miro Client ID
    ├─ Signs with Client Secret
    └─ Returns token with 1-hour expiration
    ↓
Frontend receives token
    ├─ Loads Miro SDK (boardsPicker.js)
    ├─ Opens picker with token
    ├─ User selects board
    └─ Receives board data and embed HTML
    ↓
Embed HTML rendered in call interface
    ↓
Participants collaborate on shared board
```

## File Locations

```
app/
├── app/
│   ├── api/
│   │   └── miro-token/
│   │       └── route.ts          # JWT token generation endpoint
│   └── video-call/
│       ├── WherebyVideoCall.tsx   # Updated with Miro integration
│       └── WherebyVideoView.tsx
├── lib/
│   └── miro-config.ts            # Configuration documentation
├── package.json                  # Updated with jsonwebtoken dependency
└── .env.local                    # Add your Miro credentials here
```

## Environment Variables Reference

| Variable                     | Required | Type   | Description                                          |
| ---------------------------- | -------- | ------ | ---------------------------------------------------- |
| `NEXT_PUBLIC_MIRO_CLIENT_ID` | ✅ Yes   | String | Public Miro Client ID from your app                  |
| `MIRO_CLIENT_SECRET`         | ✅ Yes   | String | Secret key for JWT signing (NEVER share)             |
| `MIRO_API_URL`               | ❌ No    | String | Miro API base URL (default: https://api.miro.com/v2) |
| `MIRO_API_KEY`               | ❌ No    | String | Optional API key for advanced features               |

## Security Considerations

1. **Never commit secrets to Git**:

   - `.env.local` is already in `.gitignore`
   - Keep `MIRO_CLIENT_SECRET` confidential

2. **Token Management**:

   - Tokens expire after 1 hour
   - Requests include no-cache headers
   - Backend validates environment variables before generating tokens

3. **HTTPS in Production**:

   - Always use HTTPS for production deployments
   - Update redirect URIs in Miro App settings for production domain

4. **Scope Limitations**:
   - Only request necessary Miro scopes
   - Monitor API usage in Miro dashboard

## Testing

### Local Testing

1. Ensure environment variables are set in `.env.local`
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Navigate to a video call
4. Click the Share button and select "Share Miro Board"
5. The Miro BoardsPicker should open

### Troubleshooting

**Issue**: `Missing Miro configuration` error

- **Solution**: Check that `NEXT_PUBLIC_MIRO_CLIENT_ID` and `MIRO_CLIENT_SECRET` are set in `.env.local`
- **Action**: Restart the dev server after adding variables

**Issue**: Miro BoardsPicker won't open

- **Solution**: Verify your Miro app credentials are correct
- **Action**: Check the browser console for error messages

**Issue**: CORS errors

- **Solution**: Ensure your redirect URI matches in Miro App settings
- **Action**: Update Miro App settings if domain has changed

**Issue**: Token generation fails

- **Solution**: Verify both environment variables are set correctly
- **Action**: Check server logs for detailed error messages

## Additional Resources

- [Miro Developers Documentation](https://developers.miro.com/)
- [Miro BoardsPicker API](https://developers.miro.com/docs/web-sdk-boards-picker)
- [JWT Documentation](https://jwt.io/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Notes for Developers

### Dependencies Added

- `jsonwebtoken`: ^9.x.x - For JWT token generation
- `@types/jsonwebtoken`: ^9.x.x - TypeScript types (installed automatically)

### Future Enhancements

- Implement board history and caching
- Add support for multiple simultaneous boards
- Store board embeddings in database for call records
- Implement user permissions management
- Add analytics for board usage

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify environment variables in `.env.local`
3. Review Miro App settings and scopes
4. Check that your Miro app is active and not in draft mode
5. Ensure token expiration hasn't been exceeded

For Miro-specific issues, visit the [Miro Developer Community](https://community.miro.com/)
