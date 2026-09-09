const Unit = require('../models/Unit');

// @desc    Get all units (optionally filtered by propertyId)
// @route   GET /api/units
// @access  Private
// @desc    Get all units (optionally filtered by propertyId)
// @route   GET /api/units
// @access  Private
const getUnits = async (req, res) => {
  try {
    const { propertyId, status, archived, includeArchived } = req.query;
    const filter = {};
    if (propertyId) filter.propertyId = propertyId;

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    const units = await Unit.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: units.length, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new unit
// @route   POST /api/units
// @access  Private
const createUnit = async (req, res) => {
  try {
    const unitData = {
      ...req.body,
      name: req.body.name || req.body.unitName || req.body.unitNumber,
      type: req.body.type || req.body.unitType || 'Shop',
      price: Number(req.body.price || req.body.monthlyRent) || 0,
      monthlyRent: Number(req.body.monthlyRent || req.body.price) || 0,
    };
    const unit = await Unit.create(unitData);
    res.status(201).json({ success: true, data: unit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get unit by ID
// @route   GET /api/units/:id
// @access  Private
const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.status(200).json({ success: true, data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private
const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.status(200).json({ success: true, data: unit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Archive / Soft Delete unit
// @route   DELETE /api/units/:id or PUT /api/units/:id/archive
// @access  Private
const archiveUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    unit.isArchived = true;
    unit.status = 'Archived';
    unit.archivedAt = new Date();
    unit.archivedBy = req.user?._id || null;
    unit.archiveReason = req.body?.reason || req.body?.archiveReason || 'Manager requested archival';
    await unit.save();

    res.status(200).json({ success: true, message: 'Unit archived successfully', data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived unit
// @route   PUT /api/units/:id/restore
// @access  Private
const restoreUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    unit.isArchived = false;
    unit.status = 'Available';
    unit.archivedAt = null;
    unit.archivedBy = null;
    unit.archiveReason = '';
    await unit.save();

    res.status(200).json({ success: true, message: 'Unit restored successfully', data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUnits,
  createUnit,
  getUnitById,
  updateUnit,
  deleteUnit: archiveUnit,
  archiveUnit,
  restoreUnit,
};
