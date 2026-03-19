import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Optional
from io import BytesIO
from decimal import Decimal
from datetime import date

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


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
    
    def _send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None, attachments: Optional[list] = None) -> bool:
        """Send an email using SMTP with optional attachments
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text fallback content
            attachments: List of tuples (filename, file_bytes)
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative') if not attachments else MIMEMultipart('mixed')
            msg['Subject'] = subject
            msg['From'] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            msg['To'] = to_email
            
            # Create alternative part for text/html
            if attachments:
                msg_alternative = MIMEMultipart('alternative')
                msg.attach(msg_alternative)
            else:
                msg_alternative = msg
            
            # Add plain text version if provided
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg_alternative.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            msg_alternative.attach(part2)
            
            # Add attachments if provided
            if attachments:
                for filename, file_bytes in attachments:
                    part = MIMEApplication(file_bytes, Name=filename)
                    part['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(part)
            
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
    
    def generate_invoice_pdf(self, invoice_data: dict, client_data: dict, user_business_info: dict) -> bytes:
        """Generate invoice PDF from HTML template using WeasyPrint
        
        Args:
            invoice_data: Invoice details including items, totals, dates
            client_data: Client information (name, email, phone, address)
            user_business_info: Business details (company name, address, tax ID, etc.)
            
        Returns:
            bytes: PDF file content
        """
        try:
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
        except ImportError:
            logger.error("WeasyPrint not installed. Install with: pip install weasyprint")
            raise
        
        # Extract data with safe defaults
        invoice_number = invoice_data.get('number', '')
        issued_date = invoice_data.get('issued_date', '')
        due_date = invoice_data.get('due_date', '')
        currency = invoice_data.get('currency', 'NGN')
        subtotal = invoice_data.get('subtotal', 0)
        discount = invoice_data.get('discount', 0)
        tax = invoice_data.get('tax', 0)
        total = invoice_data.get('total', 0)
        notes = invoice_data.get('notes', '')
        items = invoice_data.get('items', [])
        
        client_name = client_data.get('name', '')
        client_email = client_data.get('email', '')
        client_phone = client_data.get('phone', '')
        client_address = client_data.get('address', '')
        
        company_name = user_business_info.get('company_name', '')
        company_address = user_business_info.get('company_address', '')
        tax_id = user_business_info.get('tax_id', '')
        website = user_business_info.get('website', '')
        user_name = user_business_info.get('full_name', '')
        user_email = user_business_info.get('email', '')
        user_phone = user_business_info.get('phone', '')
        
        # Calculate discount amount if percentage
        discount_amount = (Decimal(str(subtotal)) * Decimal(str(discount)) / 100) if discount > 0 else 0
        
        # Build line items HTML
        items_html = ""
        for item in items:
            desc = item.get('description', '')
            qty = item.get('quantity', 0)
            unit_price = item.get('unit_price', 0)
            amount = item.get('amount', 0)
            tax_rate = item.get('tax_rate', 0)
            
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; margin-bottom: 4px;">{desc}</div>
                    {f'<div style="font-size: 12px; color: #6b7280;">Tax: {tax_rate}%</div>' if tax_rate > 0 else ''}
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">{qty}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">{currency} {unit_price}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600;">{currency} {amount}</td>
            </tr>
            """
        
        # Build PDF HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page {{
                    size: A4;
                    margin: 1cm;
                }}
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #4F46E5;
                }}
                .company-info {{
                    flex: 1;
                }}
                .invoice-title {{
                    flex: 1;
                    text-align: right;
                }}
                .invoice-title h1 {{
                    color: #4F46E5;
                    margin: 0;
                    font-size: 32px;
                }}
                .info-section {{
                    margin-bottom: 30px;
                }}
                .info-row {{
                    display: flex;
                    gap: 40px;
                    margin-bottom: 20px;
                }}
                .info-box {{
                    flex: 1;
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 5px;
                }}
                .info-box h3 {{
                    margin: 0 0 10px 0;
                    color: #4F46E5;
                    font-size: 14px;
                    text-transform: uppercase;
                }}
                .info-box p {{
                    margin: 5px 0;
                    font-size: 14px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                th {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }}
                .totals-table {{
                    width: 300px;
                    margin-left: auto;
                    margin-top: 20px;
                }}
                .totals-table td {{
                    padding: 8px;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .totals-table .total-row td {{
                    background-color: #f9fafb;
                    font-weight: 700;
                    font-size: 18px;
                    color: #4F46E5;
                    border-top: 2px solid #4F46E5;
                    border-bottom: 2px solid #4F46E5;
                }}
                .notes {{
                    margin-top: 30px;
                    padding: 15px;
                    background: #f9fafb;
                    border-left: 4px solid #4F46E5;
                }}
                .footer {{
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h2 style="margin: 0 0 10px 0;">{company_name or user_name}</h2>
                    {f'<p style="margin: 3px 0;">{company_address}</p>' if company_address else ''}
                    {f'<p style="margin: 3px 0;">Tax ID: {tax_id}</p>' if tax_id else ''}
                    {f'<p style="margin: 3px 0;">{user_email}</p>' if user_email else ''}
                    {f'<p style="margin: 3px 0;">{user_phone}</p>' if user_phone else ''}
                    {f'<p style="margin: 3px 0;">{website}</p>' if website else ''}
                </div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <p style="margin: 5px 0; font-size: 16px; font-weight: 600;">#{invoice_number}</p>
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <div class="info-box">
                        <h3>Bill To</h3>
                        <p style="font-weight: 600; font-size: 16px;">{client_name}</p>
                        {f'<p>{client_email}</p>' if client_email else ''}
                        {f'<p>{client_phone}</p>' if client_phone else ''}
                        {f'<p>{client_address}</p>' if client_address else ''}
                    </div>
                    <div class="info-box">
                        <h3>Invoice Details</h3>
                        <p><strong>Issue Date:</strong> {issued_date}</p>
                        {f'<p><strong>Due Date:</strong> {due_date}</p>' if due_date else ''}
                        <p><strong>Currency:</strong> {currency}</p>
                    </div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center; width: 80px;">Quantity</th>
                        <th style="text-align: right; width: 120px;">Unit Price</th>
                        <th style="text-align: right; width: 120px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <table class="totals-table">
                <tr>
                    <td>Subtotal</td>
                    <td style="text-align: right;">{currency} {subtotal}</td>
                </tr>
                {f'''<tr>
                    <td>Discount ({discount}%)</td>
                    <td style="text-align: right; color: #10b981;">-{currency} {discount_amount:.2f}</td>
                </tr>''' if discount > 0 else ''}
                {f'''<tr>
                    <td>Tax</td>
                    <td style="text-align: right;">{currency} {tax}</td>
                </tr>''' if tax > 0 else ''}
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td style="text-align: right;">{currency} {total}</td>
                </tr>
            </table>
            
            {f'''<div class="notes">
                <h3 style="margin: 0 0 10px 0;">Notes</h3>
                <p style="margin: 0;">{notes}</p>
            </div>''' if notes else ''}
            
            <div class="footer">
                <p>This invoice was generated via InvoYQ</p>
                <p>&copy; 2026 InvoYQ. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        # Generate PDF
        font_config = FontConfiguration()
        pdf_bytes = HTML(string=html_content).write_pdf(font_config=font_config)
        
        return pdf_bytes
    
    async def send_invoice_with_details(
        self,
        to_email: str,
        invoice_data: dict,
        client_data: dict,
        user_business_info: dict,
        attach_pdf: bool = True
    ) -> bool:
        """Send detailed invoice email with line items and optional PDF attachment
        
        Args:
            to_email: Recipient email address
            invoice_data: Complete invoice details including items, totals, dates
            client_data: Client information (name, email, phone, address)
            user_business_info: Business details (company name, address, tax ID, etc.)
            attach_pdf: Whether to attach PDF invoice (default True)
            
        Returns:
            bool: True if email sent successfully
        """
        # Extract data with safe defaults
        invoice_number = invoice_data.get('number', '')
        issued_date = invoice_data.get('issued_date', '')
        due_date = invoice_data.get('due_date', '')
        currency = invoice_data.get('currency', 'NGN')
        subtotal = invoice_data.get('subtotal', 0)
        discount = invoice_data.get('discount', 0)
        tax = invoice_data.get('tax', 0)
        total = invoice_data.get('total', 0)
        notes = invoice_data.get('notes', '')
        items = invoice_data.get('items', [])
        payment_link = invoice_data.get('payment_link', '')
        
        client_name = client_data.get('name', '')
        
        company_name = user_business_info.get('company_name', '')
        user_name = user_business_info.get('full_name', '')
        user_email = user_business_info.get('email', '')
        
        sender = company_name or user_name
        
        # Calculate discount amount if percentage
        discount_amount = (Decimal(str(subtotal)) * Decimal(str(discount)) / 100) if discount > 0 else 0
        
        # Build line items HTML for email
        items_html = ""
        for item in items:
            desc = item.get('description', '')
            qty = item.get('quantity', 0)
            unit_price = item.get('unit_price', 0)
            amount = item.get('amount', 0)
            tax_rate = item.get('tax_rate', 0)
            
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #1f2937;">{desc}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">
                        Qty: {qty} × {currency} {unit_price}
                        {f' | Tax: {tax_rate}%' if tax_rate > 0 else ''}
                    </div>
                </td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">
                    {currency} {amount}
                </td>
            </tr>
            """
        
        subject = f"Invoice {invoice_number} from {sender}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; }}
                .container {{ max-width: 650px; margin: 0 auto; background-color: white; }}
                .header {{ background-color: #4F46E5; color: white; padding: 30px 20px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; }}
                .content {{ padding: 30px; }}
                .greeting {{ font-size: 18px; color: #1f2937; margin-bottom: 20px; }}
                .invoice-info-box {{
                    background-color: #f9fafb;
                    border-left: 4px solid #4F46E5;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .invoice-info-box table {{
                    width: 100%;
                    border-collapse: collapse;
                }}
                .invoice-info-box td {{
                    padding: 8px 0;
                    color: #4b5563;
                }}
                .invoice-info-box td:first-child {{
                    font-weight: 600;
                    color: #1f2937;
                }}
                .items-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .items-table th {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }}
                .totals-section {{
                    background-color: #f9fafb;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                }}
                .totals-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    color: #4b5563;
                }}
                .totals-row.total {{
                    border-top: 2px solid #4F46E5;
                    margin-top: 10px;
                    padding-top: 15px;
                    font-size: 20px;
                    font-weight: 700;
                    color: #4F46E5;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 32px;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: 600;
                }}
                .notes-section {{
                    background-color: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                }}
                .footer {{
                    background-color: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 13px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📄 New Invoice</h1>
                </div>
                <div class="content">
                    <div class="greeting">
                        <strong>Hi {client_name},</strong>
                    </div>
                    <p>{sender} has sent you an invoice for your review and payment.</p>
                    
                    <div class="invoice-info-box">
                        <table>
                            <tr>
                                <td>Invoice Number:</td>
                                <td style="text-align: right; font-weight: 600; color: #4F46E5;">#{invoice_number}</td>
                            </tr>
                            <tr>
                                <td>Issue Date:</td>
                                <td style="text-align: right;">{issued_date}</td>
                            </tr>
                            {f'<tr><td>Due Date:</td><td style="text-align: right; color: #dc2626; font-weight: 600;">{due_date}</td></tr>' if due_date else ''}
                            <tr>
                                <td>Currency:</td>
                                <td style="text-align: right;">{currency}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <h3 style="color: #1f2937; margin-top: 30px;">Invoice Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right; width: 120px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div class="totals-section">
                        <div class="totals-row">
                            <span>Subtotal:</span>
                            <span>{currency} {subtotal}</span>
                        </div>
                        {f'''<div class="totals-row" style="color: #10b981;">
                            <span>Discount ({discount}%):</span>
                            <span>-{currency} {discount_amount:.2f}</span>
                        </div>''' if discount > 0 else ''}
                        {f'''<div class="totals-row">
                            <span>Tax:</span>
                            <span>{currency} {tax}</span>
                        </div>''' if tax > 0 else ''}
                        <div class="totals-row total">
                            <span>TOTAL:</span>
                            <span>{currency} {total}</span>
                        </div>
                    </div>
                    
                    {f'''<div class="notes-section">
                        <strong>Notes:</strong>
                        <p style="margin: 5px 0 0 0;">{notes}</p>
                    </div>''' if notes else ''}
                    
                    {f'<div style="text-align: center;"><a href="{payment_link}" class="button">Pay Invoice</a></div>' if payment_link else ''}
                    
                    <p style="margin-top: 30px; color: #6b7280;">
                        Please review the invoice details and arrange payment by the due date.
                        {f'If you have any questions, please contact {user_name} at {user_email}.' if user_email else ''}
                    </p>
                </div>
                <div class="footer">
                    <p>This invoice was sent via InvoYQ</p>
                    <p>&copy; 2026 InvoYQ. All rights reserved.</p>
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
        - Invoice Number: #{invoice_number}
        - Issue Date: {issued_date}
        {f'- Due Date: {due_date}' if due_date else ''}
        - Currency: {currency}
        
        Items:
        {chr(10).join([f"  • {item.get('description', '')} - {currency} {item.get('amount', 0)}" for item in items])}
        
        Subtotal: {currency} {subtotal}
        {f'Discount ({discount}%): -{currency} {discount_amount:.2f}' if discount > 0 else ''}
        {f'Tax: {currency} {tax}' if tax > 0 else ''}
        
        TOTAL: {currency} {total}
        
        {f'Notes: {notes}' if notes else ''}
        
        Please review the invoice details and arrange payment by the due date.
        {f'If you have any questions, please contact {user_name} at {user_email}.' if user_email else ''}
        
        This invoice was sent via InvoYQ
        © 2026 InvoYQ. All rights reserved.
        """
        
        # Generate PDF attachment if requested
        attachments = []
        if attach_pdf:
            try:
                pdf_bytes = self.generate_invoice_pdf(invoice_data, client_data, user_business_info)
                filename = f"Invoice_{invoice_number}.pdf"
                attachments.append((filename, pdf_bytes))
            except Exception as e:
                logger.error(f"Failed to generate PDF for invoice {invoice_number}: {str(e)}")
                # Continue sending email without PDF
        
        return self._send_email(to_email, subject, html_content, text_content, attachments if attachments else None)


# Create singleton instance
email_service = EmailService()
