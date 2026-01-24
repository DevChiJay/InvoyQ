import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from_email = settings.SMTP_FROM_EMAIL
        self.smtp_from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS
        self.use_ssl = settings.SMTP_USE_SSL
    
    def _send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send an email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            msg['To'] = to_email
            
            # Add plain text version if provided
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send email using SSL or TLS
            if self.use_ssl:
                # Use SSL (port 465)
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                # Use TLS (port 587)
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    if self.use_tls:
                        server.starttls()
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            raise  # Re-raise to provide better error feedback
    
    def send_verification_email(self, to_email: str, verification_url: str, full_name: Optional[str] = None) -> bool:
        """Send email verification link to user"""
        display_name = full_name or to_email
        
        subject = "Verify your InvoYQ account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background-color: #4F46E5; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to InvoYQ!</h1>
                </div>
                <div class="content">
                    <h2>Hi {display_name},</h2>
                    <p>Thank you for signing up for InvoYQ. To complete your registration, please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button" style="color: white;">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4F46E5;">{verification_url}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create an account with InvoYQ, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 InvoYQ. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to InvoYQ!
        
        Hi {display_name},
        
        Thank you for signing up for InvoYQ. To complete your registration, please verify your email address by visiting this link:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with InvoYQ, you can safely ignore this email.
        
        © 2025 InvoYQ. All rights reserved.
        """
        
        return self._send_email(to_email, subject, html_content, text_content)
    
    def send_password_reset_email(self, to_email: str, user_name: str, reset_url: str) -> bool:
        """Send password reset link to user"""
        subject = "Reset your InvoYQ password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background-color: #4F46E5; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hi {user_name},</h2>
                    <p>We received a request to reset your password for your InvoYQ account. Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button" style="color: white;">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4F46E5;">{reset_url}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 InvoYQ. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hi {user_name},
        
        We received a request to reset your password for your InvoYQ account. Visit this link to create a new password:
        
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        
        © 2025 InvoYQ. All rights reserved.
        """
        
        return self._send_email(to_email, subject, html_content, text_content)
    
    async def send_invoice_email(
        self,
        to_email: str,
        client_name: str,
        invoice_number: str,
        invoice_total: str,
        currency: str,
        due_date: str,
        user_name: str,
        company_name: Optional[str] = None
    ) -> bool:
        """Send invoice to client via email"""
        sender = company_name or user_name
        subject = f"Invoice {invoice_number} from {sender}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .invoice-details {{ 
                    background-color: white; 
                    border: 1px solid #e5e7eb; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 20px 0;
                }}
                .detail-row {{ 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 10px 0; 
                    border-bottom: 1px solid #f3f4f6;
                }}
                .detail-row:last-child {{ border-bottom: none; }}
                .detail-label {{ color: #6b7280; font-weight: 500; }}
                .detail-value {{ font-weight: 600; }}
                .total-row {{ 
                    background-color: #f9fafb; 
                    padding: 15px; 
                    margin-top: 10px; 
                    border-radius: 5px;
                    font-size: 18px;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Invoice</h1>
                </div>
                <div class="content">
                    <h2>Hi {client_name},</h2>
                    <p>{sender} has sent you an invoice for your review and payment.</p>
                    
                    <div class="invoice-details">
                        <div class="detail-row">
                            <span class="detail-label">Invoice Number</span>
                            <span class="detail-value">{invoice_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Due Date</span>
                            <span class="detail-value">{due_date}</span>
                        </div>
                        <div class="total-row">
                            <div style="display: flex; justify-content: space-between;">
                                <span class="detail-label">Total Amount</span>
                                <span class="detail-value" style="color: #4F46E5; font-size: 20px;">{currency} {invoice_total}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p>Please review the invoice details and arrange payment by the due date.</p>
                    <p>If you have any questions about this invoice, please contact {user_name}.</p>
                </div>
                <div class="footer">
                    <p>This invoice was sent via InvoYQ</p>
                    <p>&copy; 2025 InvoYQ. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        New Invoice from {sender}
        
        Hi {client_name},
        
        {sender} has sent you an invoice for your review and payment.
        
        Invoice Details:
        - Invoice Number: {invoice_number}
        - Due Date: {due_date}
        - Total Amount: {currency} {invoice_total}
        
        Please review the invoice details and arrange payment by the due date.
        
        If you have any questions about this invoice, please contact {user_name}.
        
        This invoice was sent via InvoYQ
        © 2025 InvoYQ. All rights reserved.
        """
        
        return self._send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()
