import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Purge legacy demo cache from browser storage (preserves login authentication)
(function purgeLegacyDemoCache() {
  const CLEAN_VERSION = 'pixx_clean_v1';
  if (localStorage.getItem('pixx_cache_version') !== CLEAN_VERSION) {
    const keysToRemove = [
      'pixx_landlords_data',
      'pixx_properties_list',
      'pixx_units_list',
      'pixx_customers_list',
      'pixx_agreements_list',
      'pixx_payment_schedules_list',
      'pixx_recorded_payments_list',
      'landlordvision_expense_payments',
      'landlordvision_income_payments',
      'landlordvision_income_invoices',
      'landlordvision_tenants_records',
      'pixx_dashboard_cache',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('pixx_cache_version', CLEAN_VERSION);
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
