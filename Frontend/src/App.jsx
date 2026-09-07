import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

/**
 * ProtectedRoute Wrapper
 * Redirects unauthenticated users to /login page first.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

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

          {/* Main Authenticated Application Routes (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Property Manager Routes (Protected) */}
          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <PropertiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/create"
            element={
              <ProtectedRoute>
                <CreatePropertyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:propertyId"
            element={
              <ProtectedRoute>
                <PropertyDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/create"
            element={
              <ProtectedRoute>
                <CreateExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/repeating/create"
            element={
              <ProtectedRoute>
                <CreateRepeatingExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/credit-note/create"
            element={
              <ProtectedRoute>
                <CreateCreditNotePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/summary"
            element={
              <ProtectedRoute>
                <ExpensesSummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/:expenseId"
            element={
              <ProtectedRoute>
                <ExpenseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:supplierId"
            element={
              <ProtectedRoute>
                <SupplierDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/income/create"
            element={
              <ProtectedRoute>
                <AddIncomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />

          {/* Management & Auxiliary Routes (Protected) */}
          <Route
            path="/tenants"
            element={
              <ProtectedRoute>
                <TenantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <PortfoliosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenancies/create"
            element={
              <ProtectedRoute>
                <CreateTenancyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Payment & Financial Detail Routes (Protected) */}
          <Route
            path="/payments/overdue"
            element={
              <ProtectedRoute>
                <OverduePaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/overdue"
            element={
              <ProtectedRoute>
                <OverdueExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/upcoming"
            element={
              <ProtectedRoute>
                <UpcomingPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/upcoming"
            element={
              <ProtectedRoute>
                <UpcomingExpensesPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirection to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
