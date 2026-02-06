"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatSimpleDate } from "@/lib/format";
import type { Invoice, Client } from "@/types/api";

interface InvoicePreviewProps {
  invoice: Invoice;
  client?: Client;
}

export function InvoicePreview({ invoice, client }: InvoicePreviewProps) {
  // Use business info from invoice (with fallbacks)
  const userInfo = invoice.user_business_info;
  const companyName = userInfo?.company_name || userInfo?.full_name || "InvoYQ";
  const companyEmail = userInfo?.email || "hello@invoyq.com";
  const companyPhone = userInfo?.phone;
  const companyAddress = userInfo?.company_address;
  const companyLogoUrl = userInfo?.company_logo_url;
  const taxId = userInfo?.tax_id;

  const getStatusBadge = (status: string) => {
    return (
      <Badge className="text-sm font-bold text-black uppercase bg-gray-200 border-0 px-3 py-1">
        {status}
      </Badge>
    );
  };

  // Convert string values to numbers for calculations
  const subtotal =
    invoice.subtotal !== null && invoice.subtotal !== undefined
      ? parseFloat(invoice.subtotal)
      : invoice.items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const discount =
    invoice.discount !== null && invoice.discount !== undefined
      ? parseFloat(invoice.discount)
      : 0;
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxValue =
    invoice.tax !== null && invoice.tax !== undefined
      ? parseFloat(invoice.tax)
      : 0;
  const taxAmount = (subtotalAfterDiscount * taxValue) / 100;
  const total =
    invoice.total !== null && invoice.total !== undefined
      ? parseFloat(invoice.total)
      : subtotalAfterDiscount + taxAmount;

  return (
    <Card className="shadow-lg border-[3px] border-black">
      <CardContent className="p-6 sm:p-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6 pb-5 border-b-[3px] border-black">
          {/* Company Info with Logo */}
          <div className="flex items-start gap-4 flex-1">
            {companyLogoUrl && (
              <div className="w-16 h-16 shrink-0">
                <img
                  src={companyLogoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-black mb-2">
                {companyName}
              </h1>
              <div className="text-[15px] text-black space-y-0.5 font-normal">
                {companyAddress && (
                  <p className="whitespace-pre-line">{companyAddress}</p>
                )}
                {companyPhone && <p>Phone: {companyPhone}</p>}
                {companyEmail && <p>Email: {companyEmail}</p>}
                {taxId && <p>Tax ID: {taxId}</p>}
              </div>
            </div>
          </div>

          {/* Invoice Title & Status */}
          <div className="text-left sm:text-right shrink-0">
            <h2 className="text-[22px] font-bold text-black mb-2">
              INVOICE {invoice.number ?? "DRAFT"}
            </h2>
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        {/* Bill To & Dates - Side by Side */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-6 py-5 border-y-2 border-black">
          {/* Bill To */}
          {client && (
            <div className="flex-1">
              <h3 className="text-base font-bold text-black uppercase tracking-wider mb-2">
                Bill To
              </h3>
              <div className="space-y-0.5">
                <p className="font-semibold text-black text-[17px]">
                  {client.name}
                </p>
                {client.email && (
                  <p className="text-[16px] text-black">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-[16px] text-black">{client.phone}</p>
                )}
                {client.address && (
                  <p className="text-[16px] text-black whitespace-pre-line mt-1">
                    {client.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Invoice Dates */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {invoice.issued_date && (
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm font-bold text-black uppercase whitespace-nowrap">
                  Issue Date:
                </span>
                <span className="text-base font-semibold text-black">
                  {formatSimpleDate(invoice.issued_date)}
                </span>
              </div>
            )}
            {invoice.due_date && (
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm font-bold text-black uppercase whitespace-nowrap">
                  Due Date:
                </span>
                <span className="text-base font-semibold text-black">
                  {formatSimpleDate(invoice.due_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <div className="overflow-x-auto border-2 border-black rounded-none">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr className="border-b-[3px] border-black">
                  <th className="text-left py-3 px-2 text-sm font-bold text-black uppercase tracking-wider border-r-2 border-black">
                    Description
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-black uppercase tracking-wider w-20 border-r-2 border-black">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-black uppercase tracking-wider w-28 border-r-2 border-black">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-black uppercase tracking-wider w-20 border-r-2 border-black">
                    Tax
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-black uppercase tracking-wider w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b-2 border-gray-300">
                    <td className="py-3 px-2 text-[13px] font-bold text-black border-r-2 border-gray-300">
                      {item.description}
                    </td>
                    <td className="py-3 px-2 text-[13px] font-bold text-black text-right border-r-2 border-gray-300">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-3 px-2 text-[13px] font-bold text-black text-right border-r-2 border-gray-300">
                      {formatCurrency(
                        parseFloat(item.unit_price),
                        invoice.currency ?? "NGN",
                      )}
                    </td>
                    <td className="py-3 px-2 text-[13px] font-bold text-black text-right border-r-2 border-gray-300">
                      {item.tax_rate}%
                    </td>
                    <td className="py-3 px-2 text-[13px] font-bold text-black text-right">
                      {formatCurrency(
                        parseFloat(item.amount),
                        invoice.currency ?? "NGN",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-5">
          <div className="w-full sm:w-80 space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-base font-bold text-black">Subtotal</span>
              <span className="text-base font-semibold text-black">
                {formatCurrency(subtotal, invoice.currency ?? "NGN")}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-base font-bold text-black">
                  Discount ({discount}%)
                </span>
                <span className="text-base font-bold text-red-600">
                  -{formatCurrency(discountAmount, invoice.currency ?? "NGN")}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-base font-bold text-black">Tax</span>
              <span className="text-base font-semibold text-black">
                {formatCurrency(taxAmount, invoice.currency ?? "NGN")}
              </span>
            </div>
            <div className="flex justify-between py-3 px-0 border-t-[3px] border-black pt-3 mt-2">
              <span className="text-lg font-bold text-black">Total</span>
              <span className="text-2xl font-bold text-black">
                {formatCurrency(total, invoice.currency ?? "NGN")}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-2 border-black rounded-lg p-5 mb-5">
            <h3 className="text-base font-bold text-black uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-base font-semibold text-black whitespace-pre-wrap leading-relaxed">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-5 border-t-2 border-black">
          <p className="text-sm font-semibold text-black">
            Thank you for your business!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
