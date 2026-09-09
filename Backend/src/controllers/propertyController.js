const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Landlord = require('../models/Landlord');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Get all properties with search, filter, and pagination
// @route   GET /api/properties
// @access  Private
// @desc    Get all properties with search, filter, and pagination
// @route   GET /api/properties
// @access  Private
const getProperties = async (req, res) => {
  try {
    const { name, search, type, status, landlordId, archived, includeArchived, page = 1, limit = 100 } = req.query;

    const filter = {};

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    const searchTerm = name || search;
    if (searchTerm) {
      filter.name = { $regex: searchTerm, $options: 'i' };
    }
    if (type) filter.type = type;
    if (landlordId && landlordId !== 'All' && landlordId !== 'all' && mongoose.Types.ObjectId.isValid(landlordId)) {
      filter.landlordId = landlordId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .populate('landlordId', 'fullName email phone address country region logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      count: properties.length,
      data: properties,
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
      message: 'Failed to fetch properties',
      errors: [error.message],
    });
  }
};

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    const landlordId = req.body.landlordId || req.body.landlord;
    if (!landlordId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a landlord.',
        errors: ['landlordId is required for every property'],
      });
    }

    const landlordExists = await Landlord.findById(landlordId);
    if (!landlordExists) {
      return res.status(404).json({
        success: false,
        message: 'Selected landlord does not exist',
        errors: ['Invalid landlordId'],
      });
    }

    const propertyData = {
      ...req.body,
      name: req.body.name || req.body.propertyName,
      landlordId,
      managerId: req.manager ? req.manager._id : null,
    };

    if (!propertyData.name) {
      return res.status(400).json({
        success: false,
        message: 'Property name is required',
        errors: ['name field is missing'],
      });
    }

    let property = await Property.create(propertyData);
    property = await Property.findById(property._id).populate('landlordId', 'fullName email phone address country region logo');

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create property',
      errors: [error.message],
    });
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Private
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'All' || id === 'all' || !mongoose.Types.ObjectId.isValid(id)) {
      const properties = await Property.find().populate('landlordId', 'fullName email phone address country region logo');
      if (properties.length > 0) {
        return res.status(200).json({ success: true, data: properties[0] });
      }
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const property = await Property.findById(id).populate('landlordId', 'fullName email phone address country region logo');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.status(200).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
const updateProperty = async (req, res) => {
  try {
    if (req.body.landlordId) {
      const landlordExists = await Landlord.findById(req.body.landlordId);
      if (!landlordExists) {
        return res.status(404).json({ success: false, message: 'Selected landlord does not exist' });
      }
    }

    const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('landlordId', 'fullName email phone address country region logo');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.status(200).json({ success: true, message: 'Property updated successfully', data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Archive / Soft Delete property & associated units
// @route   DELETE /api/properties/:id or PUT /api/properties/:id/archive
// @access  Private
const archiveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const archiveReason = req.body?.reason || req.body?.archiveReason || 'Manager requested archival';

    property.isArchived = true;
    property.status = 'Archived';
    property.archivedAt = new Date();
    property.archivedBy = req.user?._id || null;
    property.archiveReason = archiveReason;
    await property.save();

    await Unit.updateMany(
      { propertyId: property._id },
      {
        $set: {
          isArchived: true,
          status: 'Archived',
          archivedAt: new Date(),
          archivedBy: req.user?._id || null,
          archiveReason,
        },
      }
    );

    res.status(200).json({ success: true, message: 'Property and associated units archived successfully.', data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived property & associated units
// @route   PUT /api/properties/:id/restore
// @access  Private
const restoreProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.isArchived = false;
    property.status = 'Active';
    property.archivedAt = null;
    property.archivedBy = null;
    property.archiveReason = '';
    await property.save();

    await Unit.updateMany(
      { propertyId: property._id },
      {
        $set: {
          isArchived: false,
          status: 'Available',
          archivedAt: null,
          archivedBy: null,
          archiveReason: '',
        },
      }
    );

    res.status(200).json({ success: true, message: 'Property and associated units restored successfully.', data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get units belonging to a specific property
// @route   GET /api/properties/:id/units or GET /api/properties/:propertyId/units
// @access  Private
const getPropertyUnits = async (req, res) => {
  try {
    const propertyId = req.params.id || req.params.propertyId;
    const filter = {};
    if (propertyId && propertyId !== 'All' && propertyId !== 'all' && mongoose.Types.ObjectId.isValid(propertyId)) {
      filter.propertyId = propertyId;
    }
    if (req.query.archived === 'true' || req.query.status === 'Archived') {
      filter.isArchived = true;
    } else if (req.query.includeArchived === 'true') {
      // no filter
    } else {
      filter.isArchived = { $ne: true };
    }
    const units = await Unit.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: units.length, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty: archiveProperty,
  archiveProperty,
  restoreProperty,
  getPropertyUnits,
};
