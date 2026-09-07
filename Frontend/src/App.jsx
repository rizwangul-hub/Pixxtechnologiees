import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyNoticePage } from './pages/PrivacyNoticePage';
import { TermsPage } from './pages/TermsPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { CreatePropertyPage } from './pages/CreatePropertyPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { TenantsPage } from './pages/TenantsPage';
import { AccountsPage } from './pages/AccountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { HelpPage } from './pages/HelpPage';
import { CreateTenancyPage } from './pages/CreateTenancyPage';
import { ProfilePage } from './pages/ProfilePage';
import { OverduePaymentsPage } from './pages/OverduePaymentsPage';
import { OverdueExpensesPage } from './pages/OverdueExpensesPage';
import { UpcomingPaymentsPage } from './pages/UpcomingPaymentsPage';
import { UpcomingExpensesPage } from './pages/UpcomingExpensesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CreateExpensePage } from './pages/CreateExpensePage';
import { CreateRepeatingExpensePage } from './pages/CreateRepeatingExpensePage';
import { CreateCreditNotePage } from './pages/CreateCreditNotePage';
import { ExpensesSummaryPage } from './pages/ExpensesSummaryPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { SupplierDetailPage } from './pages/SupplierDetailPage';
import { IncomePage } from './pages/IncomePage';
import { AddIncomePage } from './pages/AddIncomePage';
import { PaymentsPage } from './pages/PaymentsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication & Compliance Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy-notice" element={<PrivacyNoticePage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />

          {/* Main Authenticated Application Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Property Manager Routes */}
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/create" element={<CreatePropertyPage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/create" element={<CreateExpensePage />} />
          <Route path="/expenses/repeating/create" element={<CreateRepeatingExpensePage />} />
          <Route path="/expenses/credit-note/create" element={<CreateCreditNotePage />} />
          <Route path="/expenses/summary" element={<ExpensesSummaryPage />} />
          <Route path="/expenses/:expenseId" element={<ExpenseDetailPage />} />
          <Route path="/suppliers/:supplierId" element={<SupplierDetailPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/income/create" element={<AddIncomePage />} />
          <Route path="/payments" element={<PaymentsPage />} />

          {/* Management & Auxiliary Routes */}
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/portfolios" element={<PortfoliosPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/tenancies/create" element={<CreateTenancyPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Payment & Financial Detail Routes */}
          <Route path="/payments/overdue" element={<OverduePaymentsPage />} />
          <Route path="/expenses/overdue" element={<OverdueExpensesPage />} />
          <Route path="/payments/upcoming" element={<UpcomingPaymentsPage />} />
          <Route path="/expenses/upcoming" element={<UpcomingExpensesPage />} />

          {/* Default Redirection */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
