/**
 * Reusable Currency Formatter Utility
 * Formats numeric values into currency strings (e.g. £188,231.21).
 *
 * @param {number|string} amount - The numeric amount to format.
 * @param {string} [currencyCode='GBP'] - ISO currency code ('GBP', 'USD', 'EUR', 'PKR').
 * @param {string} [locale='en-GB'] - Locale code for formatting rules.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(amount, currencyCode = 'GBP', locale = 'en-GB') {
  const numericAmount = Number(amount) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    // Graceful fallback
    return `£${numericAmount.toFixed(2)}`;
  }
}
