import { InvoiceOut } from "@/types/invoice";
import { formatCurrency, formatDate } from "./formatters";

/**
 * Generates HTML content for printing an invoice
 * Supports multiple paper sizes including thermal printers
 */
export const generateInvoiceHTML = (invoice: InvoiceOut): string => {
  const statusColors: Record<string, string> = {
    draft: "#6B7280",
    sent: "#3B82F6",
    paid: "#10B981",
    overdue: "#EF4444",
    cancelled: "#9CA3AF",
  };

  const statusColor = statusColors[invoice.status] || "#6B7280";

  // Calculate totals with discount
  const subtotal = parseFloat(invoice.subtotal || "0");
  const discount = parseFloat(invoice.discount || "0");
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = parseFloat(invoice.tax || "0");
  const taxAmount = (subtotalAfterDiscount * tax) / 100;
  const total = parseFloat(invoice.total || "0");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1F2937;
            padding: 20px;
            line-height: 1.6;
          }
          
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border: 3px solid #000000;
            padding: 20px;
          }
          
          /* Support for A4 and Letter size */
          @media screen and (min-width: 600px) {
            body {
              padding: 40px 20px;
            }
            
            .invoice-container {
              max-width: 800px;
              padding: 30px;
            }
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #000000;
            flex-wrap: wrap;
            gap: 20px;
          }
          
          .business-info {
            flex: 1;
            min-width: 250px;
          }
          
          .logo-container {
            max-width: 150px;
            margin-bottom: 15px;
          }
          
          .logo-container img {
            max-width: 100%;
            height: auto;
            max-height: 80px;
            object-fit: contain;
          }
          
          .business-info h1 {
            font-size: 24px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 10px;
          }
          
          .business-info p {
            color: #000000;
            font-size: 20px;
            margin-bottom: 4px;
          }
          
          .invoice-details {
            text-align: right;
            flex-shrink: 0;
          }
          
          .invoice-number {
            font-size: 22px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 8px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            background-color: ${statusColor}20;
            color: #000000;
          }
          
          .client-section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .client-name {
            font-size: 22px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 4px;
          }
          
          .client-details {
            color: #000000;
            font-size: 21px;
          }
          
          .info-dates-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 30px;
            margin-bottom: 20px;
            padding: 15px 0;
            border-top: 2px solid #000000;
            border-bottom: 2px solid #000000;
          }
          
          .info-dates-container .client-section {
            flex: 1;
            margin-bottom: 0;
          }
          
          .dates-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 200px;
          }
          
          .date-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 15px;
          }
          
          .date-label {
            font-size: 14px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }
          
          .date-value {
            font-size: 18px;
            font-weight: 600;
            color: #000000;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 18px;
            border: 2px solid #000000;
          }
          
          .items-table thead {
            background-color: #E5E7EB;
          }
          
          .items-table th {
            text-align: left;
            padding: 8px 6px;
            font-size: 15px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 3px solid #000000;
            border-right: 2px solid #000000;
          }
          
          .items-table th:last-child,
          .items-table td:last-child {
            text-align: right;
            border-right: none;
          }
          
          .items-table tbody tr {
            border-bottom: 2px solid #CCCCCC;
          }
          
          .items-table td {
            padding: 8px 6px;
            color: #000000;
            font-size: 17px;
            font-weight: 700;
            border-right: 2px solid #CCCCCC;
          }
          
          .item-description {
            font-weight: 700;
            color: #000000;
          }
          
          .item-details {
            font-size: 16px;
            font-weight: 700;
            color: #000000;
            margin-top: 4px;
          }
          
          .totals-section {
            margin-left: auto;
            width: 100%;
            max-width: 300px;
            margin-bottom: 15px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 18px;
          }
          
          .total-label {
            font-weight: 700;
            color: #000000;
          }
          
          .total-value {
            font-weight: 600;
            color: #000000;
          }
          
          .grand-total {
            border-top: 3px solid #000000;
            margin-top: 8px;
            padding-top: 12px;
          }
          
          .grand-total .total-label {
            font-size: 20px;
            font-weight: 700;
            color: #000000;
          }
          
          .grand-total .total-value {
            font-size: 32px;
            font-weight: 700;
            color: #000000;
          }
          
          .notes-section {
            border: 2px solid #000000;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          
          .notes-title {
            font-size: 18px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 8px;
          }
          
          .notes-text {
            font-weight: 600;
            color: #000000;
            font-size: 18px;
            line-height: 1.6;
          }
          
          .footer {
            text-align: center;
            padding-top: 15px;
            border-top: 2px solid #000000;
            font-weight: 600;
            color: #000000;
            font-size: 16px;
          }
          
          /* Responsive text sizes for small paper */
          @media (max-width: 600px) {
            .invoice-container {
              padding: 15px;
            }
            
            .business-info h1 {
              font-size: 22px;
            }
            
            .business-info p {
              font-size: 17px;
            }
            
            .invoice-number {
              font-size: 20px;
            }
            
            .items-table {
              font-size: 15px;
            }
            
            .items-table th,
            .items-table td {
              padding: 8px 5px;
              font-size: 14px;
            }
            
            .totals-section {
              max-width: 100%;
            }
          }
          
          /* Thermal printer support (58mm, 80mm) */
          @media (max-width: 400px) {
            body {
              padding: 5px;
              font-size: 12px;
            }
            
            .invoice-container {
              padding: 10px;
              border-width: 2px;
            }
            
            .header {
              flex-direction: column;
              gap: 15px;
            }
            
            .invoice-details {
              text-align: left;
            }
            
            .info-dates-container {
              flex-direction: column;
              gap: 15px;
            }
            
            .dates-section {
              gap: 10px;
            }
            
            .items-table th,
            .items-table td {
              border-right-width: 1px;
            }
          }
          
          @media print {
            @page {
              size: auto;
              margin: 10mm;
            }
            
            body {
              padding: 0;
            }
            
            .invoice-container {
              box-shadow: none;
            }
            
            /* Prevent page breaks inside important sections */
            .header,
            .client-section,
            .totals-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="business-info">
              ${
                invoice.user_business_info?.company_logo_url
                  ? `
                <div class="logo-container">
                  <img src="${invoice.user_business_info.company_logo_url}" alt="Company Logo" />
                </div>
              `
                  : ""
              }
              <h1>${invoice.user_business_info?.company_name || invoice.user_business_info?.full_name || "Your Business"}</h1>
              ${invoice.user_business_info?.company_address ? `<p>${invoice.user_business_info.company_address}</p>` : ""}
              ${invoice.user_business_info?.phone ? `<p>Phone: ${invoice.user_business_info.phone}</p>` : ""}
              ${invoice.user_business_info?.email ? `<p>Email: ${invoice.user_business_info.email}</p>` : ""}
              ${invoice.user_business_info?.tax_id ? `<p>Tax ID: ${invoice.user_business_info.tax_id}</p>` : ""}
            </div>
            <div class="invoice-details">
              <div class="invoice-number">INVOICE ${invoice.number || "DRAFT"}</div>
              <span class="status-badge">${invoice.status}</span>
            </div>
          </div>
          
          <!-- Client Information and Dates -->
          <div class="info-dates-container">
            ${
              invoice.client
                ? `
            <div class="client-section">
              <div class="section-title">Bill To</div>
              <div class="client-name">${invoice.client.name}</div>
              <div class="client-details">
                ${invoice.client.email ? `<div>${invoice.client.email}</div>` : ""}
                ${invoice.client.phone ? `<div>${invoice.client.phone}</div>` : ""}
                ${invoice.client.address ? `<div>${invoice.client.address}</div>` : ""}
              </div>
            </div>
            `
                : ""
            }
            
            <div class="dates-section">
              ${
                invoice.issued_date
                  ? `
              <div class="date-item">
                <div class="date-label">Issue Date:</div>
                <div class="date-value">${formatDate(invoice.issued_date)}</div>
              </div>
              `
                  : ""
              }
              ${
                invoice.due_date
                  ? `
              <div class="date-item">
                <div class="date-label">Due Date:</div>
                <div class="date-value">${formatDate(invoice.due_date)}</div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
          
          <!-- Line Items -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 80px;">Quantity</th>
                <th style="width: 100px;">Unit Price</th>
                <th style="width: 80px;">Tax</th>
                <th style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div class="item-description">${item.description}</div>
                  </td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(parseFloat(item.unit_price), invoice.currency)}</td>
                  <td>${item.tax_rate}%</td>
                  <td>${formatCurrency(parseFloat(item.amount), invoice.currency)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            ${
              discount > 0
                ? `
            <div class="total-row">
              <span class="total-label">Discount (${discount}%)</span>
              <span class="total-value" style="color: #EF4444; font-weight: 700;">-${formatCurrency(discountAmount, invoice.currency)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row">
              <span class="total-label">Tax</span>
              <span class="total-value">${formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Total</span>
              <span class="total-value">${formatCurrency(total, invoice.currency)}</span>
            </div>
          </div>
          
          <!-- Notes -->
          ${
            invoice.notes
              ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-text">${invoice.notes.replace(/\n/g, "<br>")}</div>
          </div>
          `
              : ""
          }
          
          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
