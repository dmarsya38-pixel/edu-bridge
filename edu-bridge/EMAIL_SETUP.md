# Gmail SMTP Setup Guide for EduBridge

## Overview
This guide will help you configure Gmail SMTP for sending emails from your EduBridge application. Gmail SMTP is simple, reliable, and free to use with your existing Gmail account.

## Prerequisites
- A Gmail account
- Enable "Less secure app access" OR generate an App Password

## Step 1: Enable Gmail SMTP Access

### Option A: Enable Less Secure App Access (Recommended for testing)
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Scroll down to "Less secure app access"
4. Turn ON "Allow less secure apps"
5. Note: This option is only available if 2-Factor Authentication is OFF

### Option B: Use App Password (More Secure)
If you have 2-Factor Authentication enabled:
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security"
3. Under "Signing in to Google," click on "2-Step Verification"
4. Scroll down and click on "App passwords"
5. Select "Mail" for the app
6. Select "Other (Custom name)" and enter "EduBridge"
7. Click "Generate"
8. Copy the 16-character password (this is your app password)

## Step 2: Update Environment Variables

In your `.env.local` file, add the following configuration:

```bash
# Gmail SMTP Configuration
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-password-or-app-password
GMAIL_FROM=Your Name <your-email@gmail.com>
```

**Replace the placeholder values:**
- `your-email@gmail.com` - Your Gmail address
- `your-password-or-app-password` - Your Gmail password or the 16-character app password
- `Your Name` - Your preferred sender name

## Step 3: Test Your Configuration

### Using the Debug Panel
1. Add the `EmailDebugPanel` component to any page
2. Use your email address in the test email field
3. Run the tests to verify everything works

### Using Browser Console
```javascript
// Run comprehensive debug
await debugEmailSystem();

// Send test email
await sendTestEmail('your-email@gmail.com');
```

## Environment Variables Required

```bash
# Gmail SMTP Configuration
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-password-or-app-password
GMAIL_FROM=Your Name <your-email@gmail.com>
```

## Troubleshooting

### Common Issues and Solutions

#### "Username and Password not accepted"
- Double-check your email and password
- If using 2FA, make sure you're using an App Password, not your regular password
- Enable "Less secure app access" if not using 2FA

#### "Please log in via your web browser"
- Google is blocking the sign-in attempt
- Enable "Less secure app access" in your Google Account settings
- Or use an App Password instead

#### Connection timeout errors
- Check your internet connection
- Verify the host is `smtp.gmail.com` and port is `587`
- Make sure your firewall allows SMTP connections

#### Emails not arriving
- Check your spam/junk folder
- Verify the recipient email address is correct
- Wait a few minutes - emails can sometimes be delayed

## Security Notes

### For Development/Testing
- Enabling "Less secure app access" is fine for development
- Use your regular Gmail password

### For Production
- Use an App Password instead of your regular password
- Consider creating a dedicated Gmail account for the app
- Enable 2-Factor Authentication for better security

## Email Features

Once configured, the email system will:
- Send comment notifications when users comment on materials
- Provide HTML-formatted emails with professional styling
- Include direct links to view and reply to comments
- Handle errors gracefully with helpful debugging information

## Next Steps

1. **Test the configuration** using the debug panel
2. **Enable email notifications** in user preferences
3. **Test comment functionality** to trigger email notifications
4. **Monitor logs** for any email delivery issues

The email system is now configured with Gmail SMTP! 🎉