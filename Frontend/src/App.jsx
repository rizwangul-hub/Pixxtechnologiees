import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { PrivacyNoticePage } from './pages/PrivacyNoticePage';
import { TermsPage } from './pages/TermsPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { CreatePropertyPage } from './pages/CreatePropertyPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
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
import { AddExpensePaymentPage } from './pages/AddExpensePaymentPage';
import { AddIncomePaymentPage } from './pages/AddIncomePaymentPage';
import CustomersPage from './pages/CustomersPage';
import CreateCustomerPage from './pages/CreateCustomerPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import PaymentSchedulesPage from './pages/PaymentSchedulesPage';
import { TenantManagerTenantsPage } from './pages/tenant-manager/TenantManagerTenantsPage';
import { AddTenantPage } from './pages/tenant-manager/AddTenantPage';
import { TenanciesPage } from './pages/tenant-manager/TenanciesPage';
import { TenantInvoicesPage } from './pages/tenant-manager/TenantInvoicesPage';
import { AgentsFeesPage } from './pages/tenant-manager/AgentsFeesPage';
import { TenantPaymentsPage } from './pages/tenant-manager/TenantPaymentsPage';
import LandlordsPage from './pages/LandlordsPage';
import CreateLandlordPage from './pages/CreateLandlordPage';
import LandlordDetailPage from './pages/LandlordDetailPage';
import AgentsPage from './pages/AgentsPage';
import CreateAgentPage from './pages/CreateAgentPage';
import AgentDetailPage from './pages/AgentDetailPage';
import AgentPaymentsPage from './pages/AgentPaymentsPage';
import AgentExpensesPage from './pages/AgentExpensesPage';
import { MortgagesPage } from './pages/MortgagesPage';
import { MortgageDetailPage } from './pages/MortgageDetailPage';

/**
 * ProtectedRoute Wrapper
 * Redirects unauthenticated users to /login.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * PublicRoute Wrapper
 * Redirects already authenticated users to /dashboard.
 */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* Redirect /register to /login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Compliance Info Routes */}
          <Route path="/privacy-notice" element={<PrivacyNoticePage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />

          {/* Core Authenticated Management Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
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
            path="/properties/:propertyId/edit"
            element={
              <ProtectedRoute>
                <CreatePropertyPage />
              </ProtectedRoute>
            }
          />

          {/* Mortgage Management Routes */}
          <Route
            path="/mortgages"
            element={
              <ProtectedRoute>
                <MortgagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mortgages/:mortgageId"
            element={
              <ProtectedRoute>
                <MortgageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Landlord Management Routes */}
          <Route
            path="/landlords"
            element={
              <ProtectedRoute>
                <LandlordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlords/create"
            element={
              <ProtectedRoute>
                <CreateLandlordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlords/:landlordId"
            element={
              <ProtectedRoute>
                <LandlordDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlords/:landlordId/edit"
            element={
              <ProtectedRoute>
                <CreateLandlordPage />
              </ProtectedRoute>
            }
          />

          {/* Agent Management Routes */}
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <AgentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/create"
            element={
              <ProtectedRoute>
                <CreateAgentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/:agentId"
            element={
              <ProtectedRoute>
                <AgentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/:agentId/edit"
            element={
              <ProtectedRoute>
                <CreateAgentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/payments"
            element={
              <ProtectedRoute>
                <AgentPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/expenses"
            element={
              <ProtectedRoute>
                <AgentExpensesPage />
              </ProtectedRoute>
            }
          />

          {/* Tenants & Customers Unit Assignment Routes */}
          <Route
            path="/tenants"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/create"
            element={
              <ProtectedRoute>
                <CreateCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/:customerId"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/:customerId/edit"
            element={
              <ProtectedRoute>
                <CreateCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/create"
            element={
              <ProtectedRoute>
                <CreateCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId/edit"
            element={
              <ProtectedRoute>
                <CreateCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/schedules"
            element={
              <ProtectedRoute>
                <PaymentSchedulesPage />
              </ProtectedRoute>
            }
          />

          {/* Payments & Expenses Routes */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/expenses/create"
            element={
              <ProtectedRoute>
                <AddExpensePaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/income/create"
            element={
              <ProtectedRoute>
                <AddIncomePaymentPage />
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

          {/* Reports & Settings */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
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
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsPage />
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
          <Route
            path="/payments/overdue"
            element={
              <ProtectedRoute>
                <OverduePaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/tenant-manager/tenants" element={<ProtectedRoute><TenantManagerTenantsPage /></ProtectedRoute>} />
          <Route path="/tenant-manager/tenants/create" element={<ProtectedRoute><AddTenantPage /></ProtectedRoute>} />
          <Route path="/tenant-manager/tenancies" element={<ProtectedRoute><TenanciesPage /></ProtectedRoute>} />
          <Route path="/tenant-manager/invoices" element={<ProtectedRoute><TenantInvoicesPage /></ProtectedRoute>} />
          <Route path="/tenant-manager/payments" element={<ProtectedRoute><TenantPaymentsPage /></ProtectedRoute>} />
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

          {/* Default Route Redirection */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
