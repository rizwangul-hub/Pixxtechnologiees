const mongoose = require('mongoose');
const Property = require('../models/Property');
const Landlord = require('../models/Landlord');
const Tenancy = require('../models/Tenancy');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Get all properties with search, filter, and pagination
// @route   GET /api/properties
// @access  Private
const getProperties = async (req, res) => {
  try {
    const {
      name,
      search,
      type,
      propertyType,
      status,
      landlordId,
      city,
      county,
      postcode,
      archived,
      includeArchived,
      page = 1,
      limit = 100,
    } = req.query;

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
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
        { postcode: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    const selectedType = type || propertyType;
    if (selectedType && selectedType !== 'All') filter.type = selectedType;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (county) filter.county = { $regex: county, $options: 'i' };
    if (postcode) filter.postcode = { $regex: postcode, $options: 'i' };

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

    // Enrich each property with active tenancy & tenant & agent info
    const enrichedProperties = await Promise.all(
      properties.map(async (prop) => {
        const pObj = prop.toObject ? prop.toObject() : prop;
        const activeTenancy = await Tenancy.findOne({
          propertyId: prop._id,
          status: 'Active',
          isArchived: { $ne: true },
        })
          .populate('customerId', 'fullName email phone')
          .populate('agentId', 'name agencyName email phone');

        const tenant = activeTenancy?.customerId || null;
        const agent = activeTenancy?.agentId || null;
        const isOccupied = Boolean(activeTenancy || pObj.customerName);

        return {
          ...pObj,
          activeTenancy: activeTenancy || null,
          tenant: tenant || null,
          tenantName: tenant ? tenant.fullName : pObj.customerName || null,
          agent: agent || null,
          agentName: agent ? (agent.name || agent.agencyName) : null,
          status: pObj.isArchived ? 'Archived' : (isOccupied ? 'Occupied' : pObj.status),
          totalUnits: 1,
          occupiedUnits: isOccupied ? 1 : 0,
          availableUnits: !isOccupied && !pObj.isArchived ? 1 : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      count: enrichedProperties.length,
      data: enrichedProperties,
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

// @desc    Create a new individual property
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    const rawLandlordId = req.body.landlordId || req.body.landlord;
    const landlordName = (req.body.landlordName || '').trim();

    if (!rawLandlordId && !landlordName) {
      return res.status(400).json({
        success: false,
        message: 'Please select a landlord.',
        errors: ['landlordId is required for every property'],
      });
    }

    let landlordExists = null;
    if (rawLandlordId && mongoose.Types.ObjectId.isValid(rawLandlordId)) {
      landlordExists = await Landlord.findById(rawLandlordId);
    }

    // Fallback search by landlord name if ID is not a Mongo ObjectId or not found
    if (!landlordExists && landlordName) {
      landlordExists = await Landlord.findOne({
        fullName: { $regex: new RegExp(`^${landlordName}$`, 'i') },
      });
      if (!landlordExists) {
        landlordExists = await Landlord.findOne({
          fullName: { $regex: landlordName, $options: 'i' },
        });
      }
    }

    // If still not found and there are landlords in DB, try matching first one or return clear error
    if (!landlordExists) {
      const allLandlords = await Landlord.find({ isArchived: { $ne: true } }).limit(10);
      if (allLandlords.length === 1) {
        landlordExists = allLandlords[0];
      } else {
        return res.status(400).json({
          success: false,
          message: 'Selected landlord could not be found. Please select a valid landlord from the list.',
          errors: [`Invalid landlord: "${rawLandlordId || landlordName}"`],
        });
      }
    }

    const resolvedLandlordId = landlordExists._id;

    const name = (req.body.name || req.body.propertyName || '').trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Property name is required',
        errors: ['name field is missing'],
      });
    }

    // Sanitize price & rent
    let price = Number(req.body.price ?? req.body.monthlyRent ?? 0);
    if (isNaN(price) || price < 0) price = 0;
    let monthlyRent = Number(req.body.monthlyRent ?? req.body.price ?? price);
    if (isNaN(monthlyRent) || monthlyRent < 0) monthlyRent = price;

    // Sanitize type
    const validTypes = ['Building', 'House', 'Shop', 'Office', 'Flat', 'Apartment', 'Room', 'Other'];
    let type = req.body.type || req.body.propertyType || 'Shop';
    if (!validTypes.includes(type)) {
      type = 'Other';
    }

    // Sanitize status
    const validStatuses = ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Archived'];
    let status = req.body.status || 'Available';
    if (!validStatuses.includes(status)) {
      status = 'Available';
    }

    const propertyData = {
      name,
      type,
      price,
      monthlyRent,
      landlordId: resolvedLandlordId,
      address: (req.body.address || '').trim(),
      city: (req.body.city || 'London').trim(),
      area: (req.body.area || '').trim(),
      county: (req.body.county || '').trim(),
      postcode: (req.body.postcode || '').trim(),
      floor: (req.body.floor || 'Ground').trim(),
      size: (req.body.size || '').trim(),
      sizeUnit: req.body.sizeUnit || 'sq ft',
      status,
      description: (req.body.description || '').trim(),
      notes: (req.body.notes || '').trim(),
      managerId: req.manager ? req.manager._id : null,
    };

    let property = await Property.create(propertyData);
    property = await Property.findById(property._id).populate('landlordId', 'fullName email phone address country region logo');

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    console.error('[Create Property Error]', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create property',
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

    const activeTenancy = await Tenancy.findOne({
      propertyId: property._id,
      status: 'Active',
      isArchived: { $ne: true },
    })
      .populate('customerId', 'fullName email phone')
      .populate('agentId', 'name agencyName email phone');

    const pObj = property.toObject ? property.toObject() : property;
    res.status(200).json({
      success: true,
      data: {
        ...pObj,
        activeTenancy: activeTenancy || null,
        tenant: activeTenancy?.customerId || null,
        agent: activeTenancy?.agentId || null,
      },
    });
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

    const updateData = { ...req.body };
    if (req.body.propertyName && !req.body.name) {
      updateData.name = req.body.propertyName;
    }
    if (req.body.propertyType && !req.body.type) {
      updateData.type = req.body.propertyType;
    }

    const property = await Property.findByIdAndUpdate(req.params.id, updateData, {
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

// @desc    Archive / Soft Delete property
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

    res.status(200).json({
      success: true,
      message: 'Property archived successfully.',
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived property
// @route   PUT /api/properties/:id/restore
// @access  Private
const restoreProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const activeTenancy = await Tenancy.findOne({
      propertyId: property._id,
      status: 'Active',
      isArchived: { $ne: true },
    });

    property.isArchived = false;
    property.status = activeTenancy ? 'Occupied' : 'Available';
    property.archivedAt = null;
    property.archivedBy = null;
    property.archiveReason = '';
    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property restored successfully.',
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get backward compatibility units (returns the property itself in an array)
// @route   GET /api/properties/:id/units or GET /api/properties/:propertyId/units
// @access  Private
const getPropertyUnits = async (req, res) => {
  try {
    const propertyId = req.params.id || req.params.propertyId;
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const prop = await Property.findById(propertyId);
    if (!prop) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    res.status(200).json({ success: true, count: 1, data: [prop] });
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
