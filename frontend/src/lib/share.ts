import type { Client, Invoice } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Normalises a phone number for wa.me links (digits only, international format).
 * Local Nigerian numbers such as 0803 123 4567 become 2348031234567.
 * Returns null when the number is too short to be valid.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

/** Plain-text invoice summary for WhatsApp or the native share sheet. */
export function invoiceShareText(invoice: Invoice, client?: Pick<Client, "name"> | null): string {
  const business = invoice.user_business_info?.company_name || invoice.user_business_info?.full_name;
  const lines = [
    `Hi${client?.name ? ` ${client.name}` : ""},`,
    "",
    `Here is invoice ${invoice.number ?? ""} for ${formatCurrency(invoice.total, invoice.currency)}${
      invoice.due_date ? `, due ${formatDate(invoice.due_date)}` : ""
    }.`,
  ];
  if (invoice.items?.length) {
    lines.push("");
    for (const item of invoice.items) {
      lines.push(`• ${item.description} × ${Number(item.quantity)}: ${formatCurrency(item.amount, invoice.currency)}`);
    }
  }
  if (invoice.notes) lines.push("", invoice.notes);
  if (invoice.payment_link) lines.push("", `Pay here: ${invoice.payment_link}`);
  lines.push("", "Thank you!");
  if (business) lines.push(business);
  return lines.join("\n");
}

/** wa.me link that opens WhatsApp with the summary, addressed to the client when their number is known. */
export function whatsAppShareUrl(invoice: Invoice, client?: Pick<Client, "name" | "phone"> | null): string {
  const number = toWhatsAppNumber(client?.phone);
  const text = encodeURIComponent(invoiceShareText(invoice, client));
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
