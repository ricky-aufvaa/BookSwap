# utils/email_service.py
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional
from config.settings import settings

class EmailService:
    def __init__(self):
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', self.smtp_username)
        self.from_name = getattr(settings, 'FROM_NAME', 'BookSwap')
    
    def generate_reset_code(self) -> str:
        """Generate a secure 6-digit reset code"""
        return str(secrets.randbelow(900000) + 100000)
    
    def create_reset_email_content(self, username: str, reset_code: str) -> tuple[str, str, str]:
        """Create email content for password reset"""
        subject = "BookSwap - Password Reset Code"
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - BookSwap</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📚 BookSwap</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2 style="color: #333; margin-top: 0;">Hi {username}! 👋</h2>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                    We received a request to reset your password for your BookSwap account. 
                    Use the code below to reset your password:
                </p>
                
                <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                    <h1 style="margin: 10px 0; font-size: 36px; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', monospace;">{reset_code}</h1>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        ⏰ <strong>Important:</strong> This code will expire in 15 minutes for security reasons.
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 25px;">
                    If you didn't request this password reset, please ignore this email. 
                    Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                    This email was sent by BookSwap. If you have any questions, please contact our support team.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text content (fallback)
        text_content = f"""
        BookSwap - Password Reset Code
        
        Hi {username}!
        
        We received a request to reset your password for your BookSwap account.
        
        Your password reset code is: {reset_code}
        
        This code will expire in 15 minutes.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        BookSwap Team
        """
        
        return subject, html_content, text_content
    
    async def send_reset_code_email(self, email: str, username: str, reset_code: str) -> bool:
        """Send password reset code via email"""
        try:
            subject, html_content, text_content = self.create_reset_email_content(username, reset_code)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = email
            
            # Add both plain text and HTML versions
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Password reset email sent successfully to {email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {email}: {str(e)}")
            return False
    
    def is_email_configured(self) -> bool:
        """Check if email service is properly configured"""
        return bool(self.smtp_username and self.smtp_password)

# Global email service instance
email_service = EmailService()
