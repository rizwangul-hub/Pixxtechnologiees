const mongoose = require('mongoose');
const Landlord = require('../models/Landlord');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Get all landlords with search, filter, pagination, and propertiesCount
// @route   GET /api/landlords
// @access  Private
// @desc    Get all landlords with search, filter, pagination, and propertiesCount
// @route   GET /api/landlords
// @access  Private
const getLandlords = async (req, res) => {
  try {
    const { fullName, search, email, phone, status, archived, includeArchived, page = 1, limit = 100 } = req.query;

    const filter = {};

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    const searchTerm = fullName || search;
    if (searchTerm) {
      filter.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Landlord.countDocuments(filter);
    const rawLandlords = await Landlord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute propertiesCount for each landlord efficiently
    const landlords = await Promise.all(
      rawLandlords.map(async (l) => {
        const lObj = l.toObject();
        const propertiesCount = await Property.countDocuments({ landlordId: l._id, isArchived: { $ne: true } });
        return {
          ...lObj,
          propertiesCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Landlords retrieved successfully',
      count: landlords.length,
      data: landlords,
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
      message: 'Failed to fetch landlords',
      errors: [error.message],
    });
  }
};

// @desc    Create a new landlord
// @route   POST /api/landlords
// @access  Private
const createLandlord = async (req, res) => {
  try {
    const { fullName, email, phone, address, country, region, logo, notes } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Landlord full name is required',
        errors: ['fullName field is missing'],
      });
    }

    if (email && email.trim()) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: ['Please provide a valid email address'],
        });
      }
    }

    const landlordData = {
      fullName: fullName.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      country: country ? country.trim() : 'United Kingdom',
      region: region ? region.trim() : '',
      logo: logo && typeof logo === 'object' ? { url: logo.url || '', publicId: logo.publicId || logo.public_id || '' } : { url: '', publicId: '' },
      notes: notes ? notes.trim() : '',
      managerId: req.manager ? req.manager._id : null,
    };

    const landlord = await Landlord.create(landlordData);

    res.status(201).json({
      success: true,
      message: 'Landlord created successfully',
      data: landlord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create landlord',
      errors: [error.message],
    });
  }
};

// @desc    Get single landlord by ID
// @route   GET /api/landlords/:id
// @access  Private
const getLandlordById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Landlord ID format' });
    }

    const landlord = await Landlord.findById(req.params.id);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord not found' });
    }

    const propertiesCount = await Property.countDocuments({ landlordId: landlord._id, isArchived: { $ne: true } });
    const lObj = landlord.toObject();

    res.status(200).json({
      success: true,
      data: {
        ...lObj,
        propertiesCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update landlord details
// @route   PUT /api/landlords/:id
// @access  Private
const updateLandlord = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Landlord ID format' });
    }

    const existing = await Landlord.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Landlord not found' });
    }

    // Clean up old logo if replacement or removal occurred
    if (req.body.logo !== undefined) {
      const newLogoPublicId = req.body.logo?.publicId || req.body.logo?.public_id || '';
      if (existing.logo?.publicId && existing.logo.publicId !== newLogoPublicId) {
        try {
          await deleteFromCloudinary(existing.logo.publicId);
        } catch (e) {
          console.warn('[Cloudinary Delete Notice]', e.message);
        }
      }
    }

    const updateData = { ...req.body };
    if (updateData.logo && typeof updateData.logo === 'object') {
      updateData.logo = {
        url: updateData.logo.url || '',
        publicId: updateData.logo.publicId || updateData.logo.public_id || '',
      };
    }

    const landlord = await Landlord.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    const propertiesCount = await Property.countDocuments({ landlordId: landlord._id, isArchived: { $ne: true } });

    res.status(200).json({
      success: true,
      message: 'Landlord updated successfully',
      data: {
        ...landlord.toObject(),
        propertiesCount,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Archive / Soft Delete landlord
// @route   DELETE /api/landlords/:id or PUT /api/landlords/:id/archive
// @access  Private
const archiveLandlord = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Landlord ID format' });
    }

    const landlord = await Landlord.findById(req.params.id);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord not found' });
    }

    // Deletion Business Rule Check: Check if active properties belong to this landlord
    const activePropertiesCount = await Property.countDocuments({ landlordId: req.params.id, isArchived: { $ne: true } });
    if (activePropertiesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `This landlord cannot be archived because ${activePropertiesCount} active property/properties are assigned to this landlord. Please archive or reassign their properties first.`,
        errors: [`${activePropertiesCount} active property/properties belong to this landlord`],
      });
    }

    landlord.isArchived = true;
    landlord.status = 'Archived';
    landlord.archivedAt = new Date();
    landlord.archivedBy = req.user?._id || null;
    landlord.archiveReason = req.body?.reason || req.body?.archiveReason || 'Manager requested archival';
    await landlord.save();

    res.status(200).json({
      success: true,
      message: 'Landlord archived successfully.',
      data: landlord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived landlord
// @route   PUT /api/landlords/:id/restore
// @access  Private
const restoreLandlord = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Landlord ID format' });
    }

    const landlord = await Landlord.findById(req.params.id);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord not found' });
    }

    landlord.isArchived = false;
    landlord.status = 'Active';
    landlord.archivedAt = null;
    landlord.archivedBy = null;
    landlord.archiveReason = '';
    await landlord.save();

    res.status(200).json({
      success: true,
      message: 'Landlord restored successfully.',
      data: landlord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get properties owned by a specific landlord with unit counts
// @route   GET /api/landlords/:landlordId/properties
// @access  Private
const getLandlordProperties = async (req, res) => {
  try {
    const { landlordId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(landlordId)) {
      return res.status(400).json({ success: false, message: 'Invalid Landlord ID format' });
    }

    const landlord = await Landlord.findById(landlordId);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord not found' });
    }

    const properties = await Property.find({ landlordId }).sort({ createdAt: -1 });

    const propertySummaries = await Promise.all(
      properties.map(async (prop) => {
        const propIdList = [prop._id, prop._id?.toString(), prop.id].filter(Boolean);
        const propUnits = await Unit.find({
          propertyId: { $in: propIdList },
          isArchived: { $ne: true },
        });

        const totalUnits = propUnits.length > 0 ? propUnits.length : (prop.totalUnits || 0);
        const occupiedUnits = propUnits.filter((u) => u.status === 'Occupied' || u.customerId || u.customerName).length;
        const availableUnits = propUnits.filter((u) => u.status === 'Available').length || Math.max(0, totalUnits - occupiedUnits);
        const reservedUnits = propUnits.filter((u) => u.status === 'Reserved').length;
        const maintenanceUnits = propUnits.filter((u) => u.status === 'Maintenance').length;

        return {
          ...prop.toObject(),
          totalUnits,
          occupiedUnits,
          availableUnits,
          reservedUnits,
          maintenanceUnits,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Landlord properties retrieved successfully',
      landlord: landlord.toObject(),
      count: propertySummaries.length,
      data: propertySummaries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLandlords,
  createLandlord,
  getLandlordById,
  updateLandlord,
  deleteLandlord: archiveLandlord,
  archiveLandlord,
  restoreLandlord,
  getLandlordProperties,
};
