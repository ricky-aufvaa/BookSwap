# Forgot Password Feature Setup Guide

## Overview
The forgot password feature has been successfully implemented with email-based reset codes. The system works in both development and production modes.

## Current Status
✅ **Backend Implementation Complete**
- Database schema updated with email field and password_resets table
- API endpoints: `/forgot-password`, `/verify-reset-code`, `/reset-password`
- Email service with professional HTML templates
- Security features: 15-minute expiration, one-time use codes

✅ **Frontend Implementation Complete**
- ForgotPasswordScreen, ResetPasswordScreen, ResetSuccessScreen
- Navigation properly configured
- Development mode support

✅ **Database Migration Applied**
- Email column added to users table
- Password resets table created

## Testing the Feature

### Development Mode (Current Setup)
Since email service is not configured, the system runs in development mode:

1. **Test User Available:**
   - Email: `guys99style@gmail.com`
   - Password: `password123`

2. **Testing Steps:**
   1. Go to Login screen → Click "Forgot Password?"
   2. Enter email: `guys99style@gmail.com`
   3. Click "Send Reset Code"
   4. The reset code will be displayed in the alert (development mode)
   5. Use the displayed code on the Reset Password screen
   6. Enter new password and confirm
   7. Password will be reset successfully

### Production Mode Setup
To enable email functionality in production:

1. **Configure Environment Variables:**
```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=BookSwap
RESET_CODE_EXPIRE_MINUTES=15
ENVIRONMENT=production
```

2. **Gmail Setup (Recommended):**
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an App Password: Google Account → Security → App passwords
   - Use the App Password as `SMTP_PASSWORD`

3. **Alternative Email Providers:**
   - **Outlook/Hotmail:** `smtp-mail.outlook.com:587`
   - **Yahoo:** `smtp.mail.yahoo.com:587`
   - **SendGrid:** `smtp.sendgrid.net:587`

## Feature Flow

### User Experience
1. **Forgot Password Request**
   - User enters email address
   - System generates 6-digit code
   - Code sent via email (or shown in development)

2. **Password Reset**
   - User enters code and new password
   - System validates code and expiration
   - Password updated, all tokens invalidated
   - User redirected to success screen

### Security Features
- **Email Privacy:** System doesn't reveal if email exists
- **Code Expiration:** 15-minute automatic expiration
- **One-time Use:** Codes cannot be reused
- **Token Invalidation:** Forces re-login after password reset
- **Rate Limiting Ready:** Infrastructure for preventing abuse

## Email Template
The system sends professional HTML emails with:
- BookSwap branding
- Clear reset code display
- Security warnings
- Expiration notice
- Plain text fallback

## Troubleshooting

### Common Issues
1. **"Email service not configured"**
   - Add SMTP environment variables
   - Restart backend server

2. **"Invalid or expired reset code"**
   - Code expired (15 minutes)
   - Code already used
   - Check for typos

3. **Email not received**
   - Check spam folder
   - Verify SMTP credentials
   - Check server logs

### Development Testing
- Reset codes are logged to console
- Development mode shows codes in UI
- No actual email sending required

## Next Steps
1. **For Development:** Feature is ready to test with existing setup
2. **For Production:** Configure SMTP credentials and set `ENVIRONMENT=production`
3. **Optional Enhancements:**
   - Rate limiting implementation
   - Email template customization
   - SMS-based reset codes
   - Admin reset functionality

## API Endpoints

### POST /api/v1/forgot-password
```json
{
  "email": "user@example.com"
}
```

### POST /api/v1/verify-reset-code (Optional)
```json
{
  "email": "user@example.com",
  "reset_code": "123456"
}
```

### POST /api/v1/reset-password
```json
{
  "email": "user@example.com",
  "reset_code": "123456",
  "new_password": "newpassword123"
}
```

The forgot password feature is now fully functional and ready for use!
