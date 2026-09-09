const Customer = require('../models/Customer');
const TenantDocument = require('../models/TenantDocument');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Get all customers with search, filter, and pagination
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const { name, phone, email, search, status, archived, includeArchived, page = 1, limit = 100 } = req.query;

    const filter = {};

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    } else {
      if (name) filter.name = { $regex: name, $options: 'i' };
      if (phone) filter.phone = { $regex: phone, $options: 'i' };
      if (email) filter.email = { $regex: email, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const docCounts = await TenantDocument.aggregate([
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]);
    const docMap = {};
    docCounts.forEach((d) => {
      if (d._id) docMap[d._id.toString()] = d.count;
    });

    const customersWithDocs = customers.map((c) => {
      const obj = c.toObject({ virtuals: true });
      obj.documentCount = docMap[c._id.toString()] || 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      count: customersWithDocs.length,
      data: customersWithDocs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      errors: [error.message],
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      name: req.body.name || req.body.fullName,
      cnicOrReg: req.body.cnicOrReg || req.body.cnicOrId,
    };

    if (!customerData.name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
        errors: ['name field is missing'],
      });
    }

    // Optional email validation
    if (customerData.email && !/^\S+@\S+\.\S+$/.test(customerData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format',
        errors: ['email format invalid'],
      });
    }

    const customer = await Customer.create(customerData);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create customer',
      errors: [error.message],
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Archive / Soft Delete customer
// @route   DELETE /api/customers/:id or PUT /api/customers/:id/archive
// @access  Private
const archiveCustomer = async (req, res) => {
  try {
    const CustomerModel = require('../models/Customer');
    const TenancyModel = require('../models/Tenancy');
    const UnitModel = require('../models/Unit');

    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const archiveReason = req.body?.reason || req.body?.archiveReason || 'Manager requested archival';

    customer.isArchived = true;
    customer.status = 'Archived';
    customer.archivedAt = new Date();
    customer.archivedBy = req.user?._id || null;
    customer.archiveReason = archiveReason;
    await customer.save();

    // End active tenancies and release units
    const activeTenancies = await TenancyModel.find({ customerId: customer._id, status: 'Active' });
    for (const tenancy of activeTenancies) {
      tenancy.status = 'Ended';
      tenancy.endDate = tenancy.endDate || new Date().toISOString().split('T')[0];
      await tenancy.save();

      if (tenancy.unitId) {
        const unit = await UnitModel.findById(tenancy.unitId);
        if (unit && unit.status !== 'Maintenance') {
          unit.status = 'Available';
          unit.customerName = null;
          await unit.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tenant archived successfully. Active tenancy ended and unit released.',
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived customer
// @route   PUT /api/customers/:id/restore
// @access  Private
const restoreCustomer = async (req, res) => {
  try {
    const CustomerModel = require('../models/Customer');
    const TenancyModel = require('../models/Tenancy');

    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isArchived = false;
    customer.status = 'Active';
    customer.archivedAt = null;
    customer.archivedBy = null;
    customer.archiveReason = '';
    await customer.save();

    // Check if previous unit is currently occupied by another active tenancy
    const lastTenancy = await TenancyModel.findOne({ customerId: customer._id }).sort({ createdAt: -1 });
    let noticeMessage = 'Customer restored successfully.';
    let isUnitOccupied = false;

    if (lastTenancy && lastTenancy.unitId) {
      const activeUnitTenancy = await TenancyModel.findOne({
        unitId: lastTenancy.unitId,
        status: 'Active',
      });
      if (activeUnitTenancy) {
        isUnitOccupied = true;
        noticeMessage = "Tenant restored successfully. Note: The tenant's previous unit is currently occupied by another active tenant, so the previous tenancy was not automatically reactivated.";
      }
    }

    res.status(200).json({
      success: true,
      message: noticeMessage,
      isUnitOccupied,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer: archiveCustomer,
  archiveCustomer,
  restoreCustomer,
};
