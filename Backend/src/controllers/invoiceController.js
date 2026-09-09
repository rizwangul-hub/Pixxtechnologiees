const Invoice = require('../models/Invoice');

/**
 * GET /api/invoices
 */
exports.getInvoices = async (req, res) => {
  try {
    const { property, unit, customer, status } = req.query;
    const filter = {};
    if (property) filter.propertyId = property;
    if (unit) filter.unitId = unit;
    if (customer) filter.customerId = customer;
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'fullName phone email tenantName contactNumber')
      .populate('propertyId', 'propertyName propertyType address')
      .populate('unitId', 'unitName unitNumber monthlyRent')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoices', error: error.message });
  }
};

/**
 * GET /api/invoices/:id
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('propertyId')
      .populate('unitId')
      .populate('paymentId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: error.message });
  }
};

/**
 * POST /api/invoices
 */
exports.createInvoice = async (req, res) => {
  try {
    const { customerId, propertyId, unitId, tenancyId, billingPeriod, amount, dueDate, status } = req.body;

    const count = await Invoice.countDocuments();
    const billingYear = new Date().getFullYear();
    const invoiceNumber = `INV-${billingYear}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      customerId,
      propertyId,
      unitId,
      tenancyId,
      billingPeriod,
      amount,
      dueDate,
      status: status || 'Pending',
    });

    res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create invoice', error: error.message });
  }
};

/**
 * PUT /api/invoices/:id
 */
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, message: 'Invoice updated successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update invoice', error: error.message });
  }
};
