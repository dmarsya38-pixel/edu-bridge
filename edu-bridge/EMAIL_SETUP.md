# Resend.com Email Setup Guide for EduBridge

## Overview
This guide will help you configure Resend.com for sending emails from your EduBridge application. Resend provides a modern, reliable email API with excellent deliverability and developer experience.

## Prerequisites
- A Resend.com account
- Verified domain or use the default Resend domain (onboarding@resend.dev)

## Step 1: Get Your Resend API Key

1. Sign up or log in to [Resend.com](https://resend.com)
2. Navigate to the API Keys section
3. Click "Create API Key"
4. Give it a descriptive name (e.g., "EduBridge Development")
5. Copy the API key - it starts with `re_`

## Step 2: Update Environment Variables

In your `.env.local` file, add the following configuration:

```bash
# Resend Email Configuration
RESEND_API_KEY=your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace the placeholder values:**
- `your_api_key_here` - Your Resend API key (starts with `re_`)
- `onboarding@resend.dev` - For development/testing
- For production, use your verified domain email

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
await sendTestEmail('your-email@example.com');
```

## Environment Variables Required

```bash
# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_sender_email
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Production Setup

### Domain Verification (Recommended for Production)
1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as provided by Resend
4. Wait for domain verification
5. Update `RESEND_FROM_EMAIL` to use your verified domain

### Production Environment Variables
```bash
# Production Resend Configuration
RESEND_API_KEY=re_your_production_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Email Features

Once configured, the email system will:
- Send comment notifications when users comment on materials
- Send approval/rejection notifications for material submissions
- Provide HTML-formatted emails with professional styling
- Include direct links to view and interact with content
- Handle errors gracefully with helpful debugging information

## Troubleshooting

### Common Issues and Solutions

#### "API key is invalid"
- Double-check your Resend API key
- Ensure it starts with `re_`
- Check if the API key is active in your Resend dashboard

#### "Domain not verified"
- Verify your domain in Resend dashboard first
- Or use `onboarding@resend.dev` for testing
- Production requires a verified domain

#### Connection timeout errors
- Check your internet connection
- Verify your API key is correct
- Check Resend status page for any service issues

#### Emails not arriving
- Check your spam/junk folder
- Verify the recipient email address is correct
- Check your Resend dashboard for email logs
- Ensure your domain is verified (for production)

## Email Templates

The system includes professional HTML email templates for:

### Comment Notifications
- Material information (title, subject, programme)
- Comment content with preview
- Direct link to view and reply to comments
- Responsive design for mobile devices

### Approval Notifications
- Approval/rejection status with color-coded headers
- Material information and reviewer details
- Rejection reasons (if applicable)
- Direct links to view approved materials

## Testing Your Email System

### Quick Test
```javascript
// Test configuration only
await checkEmailConfiguration();

// Send test email
await sendTestEmail('test@example.com');

// Full system debug
await debugEmailSystem();
```

### Monitor Email Delivery
- Check Resend dashboard for email logs
- Monitor both browser console and server terminal
- Use the built-in debug tools for troubleshooting

## Security Notes

- Keep your Resend API key secure and never commit it to version control
- Use environment variables for all configuration
- For production, always use a verified domain
- Regularly rotate your API keys

## Integration Points

The email system is automatically triggered when:
- Users comment on materials (if they have notifications enabled)
- Materials are approved or rejected by administrators
- Test emails are sent via the debug panel

## Next Steps

1. **Configure your Resend account** and get API keys
2. **Set up environment variables** in your `.env.local`
3. **Test the configuration** using the debug panel
4. **Verify your domain** for production use
5. **Monitor email delivery** through Resend dashboard
6. **Enable user notifications** in user preferences

The email system is now configured with Resend.com! 🎉