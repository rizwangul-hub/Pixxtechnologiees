const express = require('express');
const router = express.Router();
const {
  exportPayments,
  exportProperties,
  exportCustomers,
  exportTenancies,
  exportExpenses,
  exportLandlords,
  exportAgents,
  exportAgentPayments,
  exportAgentExpenses,
  exportMortgages,
} = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

// Payments export routes
router.get('/payments', protect, exportPayments);
router.get('/payments/excel', protect, exportPayments);

// Properties export routes
router.get('/properties', protect, exportProperties);
router.get('/properties/excel', protect, exportProperties);

// Customers export routes
router.get('/customers', protect, exportCustomers);
router.get('/customers/excel', protect, exportCustomers);

// Tenancies export routes
router.get('/tenancies', protect, exportTenancies);
router.get('/tenancies/excel', protect, exportTenancies);

// Expenses export routes
router.get('/expenses', protect, exportExpenses);
router.get('/expenses/excel', protect, exportExpenses);

// Landlords export routes
router.get('/landlords', protect, exportLandlords);
router.get('/landlords/excel', protect, exportLandlords);

// Agents export routes
router.get('/agents', protect, exportAgents);
router.get('/agents/excel', protect, exportAgents);

// Agent Payments export routes
router.get('/agent-payments', protect, exportAgentPayments);
router.get('/agent-payments/excel', protect, exportAgentPayments);

// Agent Expenses export routes
router.get('/agent-expenses', protect, exportAgentExpenses);
router.get('/agent-expenses/excel', protect, exportAgentExpenses);

// Mortgage export routes
router.get('/mortgages', protect, exportMortgages);
router.get('/mortgages/excel', protect, exportMortgages);

module.exports = router;
