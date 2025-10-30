# teleHealthSol Setup Guide

## 1. Supabase Project Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Database Schema

### Create User Profiles Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    user_type TEXT CHECK (user_type IN ('patient', 'doctor', 'pharmacy', 'admin')),
    wallet_address TEXT,
    wallet_public_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 3. Google OAuth Setup

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for development)
7. Copy the Client ID and Client Secret

### Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable Google provider
4. Add your Google Client ID and Client Secret
5. Set the callback URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

## 4. Email Templates

### Email Verification Template

In your Supabase dashboard, go to "Authentication" → "Email Templates" → "Confirm signup" and replace the content with:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your teleHealthSol Account</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8fafc;
      }
      .container {
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }
      .logo svg {
        width: 30px;
        height: 30px;
        color: white;
      }
      h1 {
        color: #1f2937;
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 10px 0;
      }
      .subtitle {
        color: #6b7280;
        font-size: 16px;
        margin: 0;
      }
      .content {
        margin: 30px 0;
      }
      .message {
        font-size: 16px;
        line-height: 1.7;
        color: #374151;
        margin-bottom: 25px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6, #10b981);
        color: white;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        margin: 20px 0;
        transition: all 0.2s ease;
      }
      .button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }
      .security-note {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        font-size: 14px;
        color: #0369a1;
      }
      .warning {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        font-size: 14px;
        color: #92400e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <svg
            width="80"
            height="80"
            viewBox="0 0 105 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19.7778 81.7907H15C9.47716 81.7907 5 77.3135 5 71.7907V48.5581C5 43.0353 9.47715 38.5581 15 38.5581H22.1429C27.6657 38.5581 32.1429 34.081 32.1429 28.5581V15C32.1429 9.47715 36.62 5 42.1429 5H62.8571C68.38 5 72.8571 9.47715 72.8571 15V47C72.8571 52.5228 68.38 57 62.8571 57H47.2698C41.747 57 37.2698 61.4772 37.2698 67V99C37.2698 104.523 41.747 109 47.2698 109H62.8571C68.38 109 72.8571 104.523 72.8571 99V91.7907C72.8571 86.2679 77.3343 81.7907 82.8571 81.7907H90C95.5229 81.7907 100 77.3135 100 71.7907V52.6895C100 47.1667 95.5229 42.6895 90 42.6895H85.8254"
              stroke="#004DFF"
              stroke-width="10"
            />
          </svg>
        </div>
        <h1>Welcome to teleHealthSol!</h1>
        <p class="subtitle">Your account has been created successfully</p>
      </div>

      <div class="content">
        <p class="message">
          Thank you for joining teleHealthSol! We're excited to have you as part
          of our community revolutionizing healthcare access through blockchain
          technology.
        </p>

        <p class="message">
          To complete your registration and start accessing our services, please
          verify your email address by clicking the button below:
        </p>

        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Verify Email Address
          </a>
        </div>

        <div class="security-note">
          <strong>🔒 Security Note:</strong> This verification link will expire
          in 24 hours for your security. If you don't verify within this time,
          you'll need to request a new verification email.
        </div>

        <div class="warning">
          <strong>⚠️ Important:</strong> If you didn't create an account with
          teleHealthSol, please ignore this email. Your account will not be
          activated without verification.
        </div>

        <p class="message">Once verified, you'll be able to:</p>
        <ul style="color: #374151; line-height: 1.7;">
          <li>Connect with world-class doctors globally</li>
          <li>Access secure video consultations</li>
          <li>Store medical records on blockchain</li>
          <li>Get medications delivered to your doorstep</li>
        </ul>
      </div>

      <div class="footer">
        <p>
          <strong>teleHealthSol</strong><br />
          Revolutionizing healthcare access through blockchain technology<br />
          <a href="https://telehealthsol.health" style="color: #3b82f6;"
            >telehealthsol.health</a
          >
        </p>
        <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
          This email was sent to {{ .Email }}. If you have any questions, please
          contact our support team.
        </p>
      </div>
    </div>
  </body>
</html>
```

### Password Reset Template

For the "Reset password" template, use this professional version:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your teleHealthSol Password</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8fafc;
      }
      .container {
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }
      .logo svg {
        width: 30px;
        height: 30px;
        color: white;
      }
      h1 {
        color: #1f2937;
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 10px 0;
      }
      .subtitle {
        color: #6b7280;
        font-size: 16px;
        margin: 0;
      }
      .content {
        margin: 30px 0;
      }
      .message {
        font-size: 16px;
        line-height: 1.7;
        color: #374151;
        margin-bottom: 25px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6, #10b981);
        color: white;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        margin: 20px 0;
        transition: all 0.2s ease;
      }
      .button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }
      .security-note {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        font-size: 14px;
        color: #0369a1;
      }
      .warning {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        font-size: 14px;
        color: #92400e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <svg
            width="60"
            height="60"
            viewBox="0 0 105 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19.7778 81.7907H15C9.47716 81.7907 5 77.3135 5 71.7907V48.5581C5 43.0353 9.47715 38.5581 15 38.5581H22.1429C27.6657 38.5581 32.1429 34.081 32.1429 28.5581V15C32.1429 9.47715 36.62 5 42.1429 5H62.8571C68.38 5 72.8571 9.47715 72.8571 15V47C72.8571 52.5228 68.38 57 62.8571 57H47.2698C41.747 57 37.2698 61.4772 37.2698 67V99C37.2698 104.523 41.747 109 47.2698 109H62.8571C68.38 109 72.8571 104.523 72.8571 99V91.7907C72.8571 86.2679 77.3343 81.7907 82.8571 81.7907H90C95.5229 81.7907 100 77.3135 100 71.7907V52.6895C100 47.1667 95.5229 42.6895 90 42.6895H85.8254"
              stroke="#004DFF"
              stroke-width="10"
            />
          </svg>
        </div>
        <h1>Reset Your Password</h1>
        <p class="subtitle">
          We received a request to reset your teleHealthSol password
        </p>
      </div>

      <div class="content">
        <p class="message">
          Hello! We received a request to reset the password for your
          teleHealthSol account. If you made this request, please click the
          button below to create a new password:
        </p>

        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button"> Reset Password </a>
        </div>

        <div class="security-note">
          <strong>🔒 Security Note:</strong> This password reset link will
          expire in 1 hour for your security. If you don't reset your password
          within this time, you'll need to request a new reset link.
        </div>

        <div class="warning">
          <strong>⚠️ Important:</strong> If you didn't request a password reset,
          please ignore this email. Your password will remain unchanged.
        </div>

        <p class="message">
          For your security, this link can only be used once. After resetting
          your password, you'll be able to sign in to your account with your new
          password.
        </p>
      </div>

      <div class="footer">
        <p>
          <strong>teleHealthSol</strong><br />
          Revolutionizing healthcare access through blockchain technology<br />
          <a href="https://telehealthsol.health" style="color: #3b82f6;"
            >telehealthsol.health</a
          >
        </p>
        <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
          This email was sent to {{ .Email }}. If you have any questions, please
          contact our support team.
        </p>
      </div>
    </div>
  </body>
</html>
```

## 5. Testing

### Test Email Verification

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/signin`
3. Create a new account with email/password
4. Check your email for the verification link
5. Click the verification link
6. You should be redirected back to your app and signed in

### Test Google OAuth

1. Click "Sign in with Google" on the signin page
2. Complete the Google OAuth flow
3. You should be redirected back to your app and signed in

## 6. Next Steps

After setting up authentication:

1. Implement user profile creation flow
2. Add Circle wallet integration
3. Build dashboard pages for different user types
4. Implement appointment booking system
5. Add payment processing
