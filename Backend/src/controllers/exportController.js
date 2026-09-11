const Property = require('../models/Property');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Landlord = require('../models/Landlord');
const Agent = require('../models/Agent');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const Mortgage = require('../models/Mortgage');
const { convertToCSV, convertToExcelBuffer } = require('../utils/exportHelper');
const { getMonthName } = require('../services/paymentGeneratorService');

const mongoose = require('mongoose');

/**
 * EXPORT PAYMENTS (CSV & Excel)
 */
exports.exportPayments = async (req, res) => {
  try {
    const { fromDate, toDate, property, customer, status, format } = req.query;

    const filter = {};
    if (property && property !== 'All' && property !== 'all' && mongoose.Types.ObjectId.isValid(property)) filter.propertyId = property;
    if (customer && customer !== 'All' && customer !== 'all' && mongoose.Types.ObjectId.isValid(customer)) filter.customerId = customer;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.dueDate = {};
      if (fromDate) filter.dueDate.$gte = fromDate;
      if (toDate) filter.dueDate.$lte = toDate;
    }

    const payments = await Payment.find(filter)
      .populate('customerId', 'name fullName')
      .populate('propertyId', 'name propertyName')
      .sort({ dueDate: -1 });

    const rows = payments.map((p) => ({
      Customer: p.customerId?.fullName || p.customerId?.name || 'N/A',
      Property: p.propertyId?.propertyName || p.propertyId?.name || 'N/A',
      'Billing Month': getMonthName(p.billingMonth),
      'Billing Year': p.billingYear,
      'Rent Amount': p.amount || 0,
      'Paid Amount': p.paidAmount || 0,
      'Remaining Amount': p.remainingAmount || 0,
      'Due Date': p.dueDate || '',
      'Paid Date': p.paidDate || '',
      Status: p.status || 'Pending',
      'Payment Method': p.paymentMethod || '',
      Reference: p.reference || '',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Payments');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Payments_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Payments_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export payments', errors: [error.message] });
  }
};

/**
 * EXPORT PROPERTIES (CSV & Excel)
 */
exports.exportProperties = async (req, res) => {
  try {
    const { status, type, format } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const properties = await Property.find(filter).populate('landlordId', 'fullName').sort({ name: 1 });

    const rows = properties.map((p) => ({
      'Property Name': p.name || p.propertyName,
      Type: p.type || 'Shop',
      Landlord: p.landlordId?.fullName || 'N/A',
      Address: p.address || '',
      City: p.city || '',
      Postcode: p.postcode || '',
      'Monthly Rent (£)': p.monthlyRent || p.price || 0,
      Status: p.status || 'Available',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Properties');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Properties_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Properties_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export properties', errors: [error.message] });
  }
};

/**
 * EXPORT CUSTOMERS / TENANTS (CSV & Excel)
 */
exports.exportCustomers = async (req, res) => {
  try {
    const { status, type, format } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const customers = await Customer.find(filter).sort({ name: 1 });

    const rows = await Promise.all(
      customers.map(async (c) => {
        const activeTenancy = await Tenancy.findOne({ customerId: c._id, status: 'Active' })
          .populate('propertyId', 'name propertyName');

        const payments = await Payment.find({ customerId: c._id });
        const totalBilled = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const outstanding = totalBilled - totalPaid;

        return {
          'Tenant Name': c.fullName || c.name || '',
          Type: c.type || 'Individual',
          Phone: c.phone || '',
          Email: c.email || '',
          Property: activeTenancy?.propertyId?.propertyName || activeTenancy?.propertyId?.name || 'Unassigned',
          'Start Date': activeTenancy?.startDate || '',
          'Monthly Rent (£)': activeTenancy?.monthlyRent || 0,
          'Security Deposit (£)': activeTenancy?.securityDeposit || 0,
          'Total Paid (£)': totalPaid,
          'Outstanding Arrears (£)': Math.max(0, outstanding),
          Status: c.status || 'Active',
        };
      })
    );

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Tenants');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Tenants_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Tenants_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export tenants', errors: [error.message] });
  }
};

/**
 * EXPORT TENANCIES (CSV & Excel)
 */
exports.exportTenancies = async (req, res) => {
  try {
    const { status, property, customer, format } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (property && property !== 'All' && property !== 'all' && mongoose.Types.ObjectId.isValid(property)) filter.propertyId = property;
    if (customer && customer !== 'All' && customer !== 'all' && mongoose.Types.ObjectId.isValid(customer)) filter.customerId = customer;

    const tenancies = await Tenancy.find(filter)
      .populate('customerId', 'name fullName')
      .populate('propertyId', 'name propertyName')
      .sort({ createdAt: -1 });

    const rows = tenancies.map((t) => ({
      Customer: t.customerId?.fullName || t.customerId?.name || 'N/A',
      Property: t.propertyId?.propertyName || t.propertyId?.name || 'N/A',
      'Start Date': t.startDate || '',
      'End Date': t.endDate || 'Ongoing',
      'Monthly Rent': t.monthlyRent || 0,
      'Payment Due Day': t.paymentDueDay || 1,
      'Security Deposit': t.securityDeposit || 0,
      Status: t.status || 'Active',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Tenancies');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Tenancies_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Tenancies_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export tenancies', errors: [error.message] });
  }
};

/**
 * EXPORT EXPENSES (CSV & Excel)
 */
exports.exportExpenses = async (req, res) => {
  try {
    const { fromDate, toDate, property, category, status, format } = req.query;
    const filter = {};
    if (property && property !== 'All' && property !== 'all' && mongoose.Types.ObjectId.isValid(property)) filter.propertyId = property;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    const expenses = await Expense.find(filter)
      .populate('propertyId', 'name propertyName')
      .sort({ date: -1 });

    const rows = expenses.map((e) => ({
      Property: e.propertyId?.propertyName || e.propertyId?.name || 'N/A',
      Supplier: e.supplier || '',
      Description: e.description || '',
      Category: e.category || 'Maintenance',
      Amount: e.amount || 0,
      'Paid Amount': e.paidAmount || 0,
      'Remaining Amount': e.remainingAmount || 0,
      Date: e.date || '',
      'Due Date': e.dueDate || '',
      Status: e.status || 'Pending',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Expenses');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Expenses_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Expenses_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export expenses', errors: [error.message] });
  }
};

/**
 * EXPORT LANDLORDS (CSV & Excel)
 */
exports.exportLandlords = async (req, res) => {
  try {
    const { search, format } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const landlords = await Landlord.find(filter).sort({ fullName: 1 });

    const rows = await Promise.all(
      landlords.map(async (l) => {
        const propertiesCount = await Property.countDocuments({ landlordId: l._id });
        return {
          'Full Name': l.fullName || '',
          Email: l.email || '',
          Phone: l.phone || '',
          Address: l.address || '',
          Country: l.country || '',
          Region: l.region || '',
          'Properties Owned': propertiesCount,
          Notes: l.notes || '',
        };
      })
    );

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Landlords');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Landlords_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Landlords_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export landlords', errors: [error.message] });
  }
};

/**
 * EXPORT AGENTS (CSV & Excel)
 */
exports.exportAgents = async (req, res) => {
  try {
    const { search, format } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
      ];
    }

    const agents = await Agent.find(filter).sort({ fullName: 1 });

    const rows = await Promise.all(
      agents.map(async (agent) => {
        const activeTenancies = await Tenancy.find({ agentId: agent._id, status: 'Active' });
        const monthlyAmount = activeTenancies.reduce((sum, t) => sum + (t.companyMonthlyAmount || 0), 0);

        const payments = await AgentPayment.find({ agentId: agent._id });
        const totalReceived = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalExpenses = payments.reduce((sum, p) => sum + (p.expenseAmount || 0), 0);
        const netAmount = payments.reduce((sum, p) => sum + (p.netAmount || 0), 0);
        const pendingAmount = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

        return {
          'Agent Name': agent.fullName || '',
          Phone: agent.phone || '',
          Email: agent.email || '',
          Address: agent.address || '',
          Country: agent.country || '',
          Region: agent.region || '',
          'Assigned Units': activeTenancies.length,
          'Company Monthly Amount': monthlyAmount,
          'Total Received': totalReceived,
          'Total Agent Expenses': totalExpenses,
          'Net Amount': netAmount,
          'Pending Amount': pendingAmount,
          Status: agent.status || 'Active',
        };
      })
    );

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Agents');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Agents_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Agents_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export agents', errors: [error.message] });
  }
};

/**
 * EXPORT AGENT PAYMENTS (CSV & Excel)
 */
exports.exportAgentPayments = async (req, res) => {
  try {
    const { agentId, propertyId, status, format } = req.query;

    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;

    const payments = await AgentPayment.find(filter)
      .populate('agentId', 'fullName phone')
      .populate('propertyId', 'propertyName name')
      .populate('tenantId', 'fullName name')
      .sort({ billingYear: -1, billingMonth: -1 });

    const rows = payments.map((p) => ({
      Agent: p.agentId?.fullName || 'N/A',
      Property: p.propertyId?.propertyName || p.propertyId?.name || 'N/A',
      Tenant: p.tenantId?.fullName || p.tenantId?.name || 'N/A',
      'Billing Month': getMonthName(p.billingMonth),
      'Billing Year': p.billingYear,
      'Expected Amount': p.expectedAmount || 0,
      'Agent Expenses': p.expenseAmount || 0,
      'Net Amount': p.netAmount || 0,
      'Paid Amount': p.paidAmount || 0,
      'Remaining Amount': p.remainingAmount || 0,
      'Due Date': p.dueDate || '',
      'Paid Date': p.paidDate || '',
      Status: p.status || 'Pending',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Agent Payments');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Agent_Payments_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Agent_Payments_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export agent payments', errors: [error.message] });
  }
};

/**
 * EXPORT AGENT EXPENSES (CSV & Excel)
 */
exports.exportAgentExpenses = async (req, res) => {
  try {
    const { agentId, propertyId, category, status, format } = req.query;

    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (propertyId) filter.propertyId = propertyId;
    if (category) filter.expenseCategory = category;
    if (status) filter.status = status;

    const expenses = await AgentExpense.find(filter)
      .populate('agentId', 'fullName phone')
      .populate('propertyId', 'propertyName name')
      .populate('tenantId', 'fullName name')
      .sort({ date: -1 });

    const rows = expenses.map((e) => ({
      Date: e.date || '',
      Agent: e.agentId?.fullName || 'N/A',
      Property: e.propertyId?.propertyName || e.propertyId?.name || 'N/A',
      Tenant: e.tenantId?.fullName || e.tenantId?.name || 'N/A',
      Category: e.expenseCategory || '',
      Description: e.description || '',
      Amount: e.amount || 0,
      Status: e.status || 'Approved',
    }));

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Agent Expenses');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Agent_Expenses_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Agent_Expenses_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export agent expenses', errors: [error.message] });
  }
};

/**
 * EXPORT MORTGAGES (CSV & Excel)
 */
exports.exportMortgages = async (req, res) => {
  try {
    const { propertyId, landlordId, status, format } = req.query;

    const filter = {};
    if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(propertyId)) {
        const pObjId = new mongoose.Types.ObjectId(propertyId);
        filter.$or = [{ propertyId: pObjId }, { 'properties.propertyId': pObjId }];
      }
    }
    if (landlordId && landlordId !== 'All' && landlordId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(landlordId)) filter.landlordId = landlordId;
    }
    if (status && status !== 'All') filter.status = status;

    const mortgages = await Mortgage.find(filter)
      .populate('propertyId', 'name address')
      .populate('properties.propertyId', 'name address')
      .populate('landlordId', 'fullName email')
      .sort({ createdAt: -1 });

    const rows = mortgages.map((m) => {
      const securedProps = (m.properties && m.properties.length > 0)
        ? m.properties.map((p) => p.propertyId?.name || 'Property').filter(Boolean)
        : [m.propertyId?.name || 'Property'];

      return {
        'Mortgage Reference': m.mortgageReference || m.mortgageAccountNumber || '-',
        'Mortgage Type': m.mortgageType || 'Individual Property',
        Landlord: m.landlordId?.fullName || 'N/A',
        Lender: m.lenderName || '',
        'Secured Properties Count': securedProps.length,
        'Secured Properties': securedProps.join(', '),
        'Original Facility Amount (£)': m.originalLoanAmount || 0,
        'Outstanding Balance (£)': m.currentOutstandingBalance || 0,
        'Monthly Payment (£)': m.monthlyPayment || 0,
        'Interest Rate (%)': m.interestRate || 0,
        'Start Date': m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '',
        'Next Payment Date': m.nextPaymentDate ? new Date(m.nextPaymentDate).toISOString().split('T')[0] : '',
        Status: m.status || 'Active',
      };
    });

    const isExcel = format === 'excel' || req.path.includes('/excel');

    if (isExcel) {
      const buffer = await convertToExcelBuffer(rows, 'Mortgages');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Mortgages_Export_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      const csvStr = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=Mortgages_Export_${Date.now()}.csv`);
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export mortgages', errors: [error.message] });
  }
};
