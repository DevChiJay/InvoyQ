/**
 * Free-plan allowances, used by marketing and legal copy so the numbers stay in one place.
 * They mirror the backend defaults (FREE_INVOICES_PER_MONTH / FREE_EXTRACTIONS_PER_MONTH);
 * inside the app the live numbers come from GET /v1/usage.
 */
export const FREE_INVOICES_PER_MONTH = 100;
export const FREE_EXTRACTIONS_PER_MONTH = 10;
/** The no-account invoice generator is limited per visitor, separately from the Free plan. */
export const ANONYMOUS_GENERATIONS_PER_DAY = 3;

/** "100 free invoices and 10 AI extractions a month" */
export const FREE_PLAN_SUMMARY = `${FREE_INVOICES_PER_MONTH} free invoices and ${FREE_EXTRACTIONS_PER_MONTH} AI extractions a month`;

/** Where the upgrade options live. */
export const BILLING_HREF = "/dashboard/settings/billing";
