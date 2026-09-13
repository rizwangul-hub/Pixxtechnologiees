// src/utils/formatters.ts

/**
 * Formats a number or numeric string as GBP currency with locale-aware separators.
 * Returns a string like "£1,250.00". Handles null/undefined/invalid values gracefully.
 */
export const formatCurrencyGBP = (value?: number | string): string => {
  if (value === null || value === undefined) return "£0.00";
  const num = Number(value);
  if (isNaN(num)) return "£0.00";
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num);
};

/**
 * Formats an ISO date string (or any parsable date) to UK format DD/MM/YYYY.
 * Returns empty string for null/undefined/invalid dates.
 */
export const formatDateUK = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
