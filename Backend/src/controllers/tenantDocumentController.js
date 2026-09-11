const TenantDocument = require('../models/TenantDocument');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const STANDARD_DOCUMENT_TYPES = require('../config/standardDocuments');

// Helper to attach active tenancy, property, unit & agent details to a document object
async function attachTenancyDetails(doc) {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  const tenant = doc.tenantId?._id ? doc.tenantId : await Customer.findById(doc.tenantId);

  obj.tenantName = tenant?.fullName || tenant?.name || 'Unknown Tenant';
  obj.tenantPhone = tenant?.phone || '';
  obj.tenantEmail = tenant?.email || '';

  const activeTenancy = await Tenancy.findOne({ customerId: doc.tenantId, status: 'Active' })
    .populate('propertyId')
    
    .populate('agentId');

  obj.propertyName = activeTenancy?.propertyId?.title || activeTenancy?.propertyId?.name || 'Unassigned Property';
  obj.unitName = activeTenancy?.unitId?.name || 'Unassigned Unit';
  obj.agentName = activeTenancy?.agentId?.fullName || 'No Agent';
  obj.agentEmail = activeTenancy?.agentId?.email || '';
  obj.emailStatus = doc.expiryReminder30Status || 'Pending';
  obj.recipientEmail = doc.expiryReminder30Recipient || (obj.agentEmail || 'ftaccountants@hotmail.com');

  return obj;
}

// @desc    Upload or Replace a Tenant Document
// @route   POST /api/tenants/:tenantId/documents
// @access  Private
const uploadTenantDocument = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { documentName, documentType = 'standard', expiryDate } = req.body;

    if (!documentName) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    const tenant = await Customer.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = `pixxtechnologies/tenants/${tenantId}/documents`;
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, folder);

    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

    let docRecord;

    if (documentType === 'standard') {
      const existingDoc = await TenantDocument.findOne({
        tenantId,
        documentName,
        documentType: 'standard',
      });

      if (existingDoc) {
        if (existingDoc.publicId) {
          try {
            await deleteFromCloudinary(existingDoc.publicId);
          } catch (e) {
            console.warn('[Cloudinary Cleanup Notice]', e.message);
          }
        }

        existingDoc.fileUrl = cloudinaryResult.url;
        existingDoc.publicId = cloudinaryResult.public_id;
        existingDoc.originalFileName = req.file.originalname;
        existingDoc.fileType = req.file.mimetype;
        existingDoc.fileSize = req.file.size;
        existingDoc.expiryDate = parsedExpiryDate;
        existingDoc.uploadedAt = new Date();

        // Reset reminder status for replaced document / new expiry date
        existingDoc.expiryReminder30Sent = false;
        existingDoc.expiryReminder30SentAt = null;
        existingDoc.expiryReminder30Recipient = '';
        existingDoc.expiryReminder30Status = 'Pending';
        existingDoc.expiryReminder30Error = '';

        await existingDoc.save();
        docRecord = existingDoc;
      }
    }

    if (!docRecord) {
      docRecord = await TenantDocument.create({
        tenantId,
        documentName,
        documentType: documentType === 'custom' ? 'custom' : 'standard',
        fileUrl: cloudinaryResult.url,
        publicId: cloudinaryResult.public_id,
        originalFileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        expiryDate: parsedExpiryDate,
        uploadedAt: new Date(),
        expiryReminder30Sent: false,
        expiryReminder30Status: 'Pending',
      });
    }

    const docObj = await attachTenancyDetails(docRecord);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: docObj,
    });
  } catch (error) {
    console.error('[Tenant Document Upload Error]', error.message);
    res.status(500).json({ success: false, message: error.message || 'Document upload failed' });
  }
};

// @desc    Get all documents for a specific tenant
// @route   GET /api/tenants/:tenantId/documents
// @access  Private
const getTenantDocuments = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Customer.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const documents = await TenantDocument.find({ tenantId }).sort({ documentType: 1, createdAt: -1 });

    const formattedDocs = await Promise.all(documents.map((doc) => attachTenancyDetails(doc)));

    res.status(200).json({
      success: true,
      count: formattedDocs.length,
      standardList: STANDARD_DOCUMENT_TYPES,
      data: formattedDocs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update document metadata or expiry date
// @route   PUT /api/tenant-documents/:documentId
// @access  Private
const updateTenantDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { expiryDate, documentName } = req.body;

    const doc = await TenantDocument.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    let isExpiryChanged = false;

    if (documentName && doc.documentType === 'custom') {
      doc.documentName = documentName;
    }

    if (expiryDate !== undefined) {
      const newExpiry = expiryDate ? new Date(expiryDate) : null;
      const oldTime = doc.expiryDate ? new Date(doc.expiryDate).getTime() : null;
      const newTime = newExpiry ? newExpiry.getTime() : null;

      if (oldTime !== newTime) {
        isExpiryChanged = true;
        doc.expiryDate = newExpiry;
      }
    }

    if (req.file) {
      const folder = `pixxtechnologies/tenants/${doc.tenantId}/documents`;
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, folder);

      if (doc.publicId) {
        try {
          await deleteFromCloudinary(doc.publicId);
        } catch (e) {
          console.warn('[Cloudinary Cleanup Warning]', e.message);
        }
      }

      doc.fileUrl = cloudinaryResult.url;
      doc.publicId = cloudinaryResult.public_id;
      doc.originalFileName = req.file.originalname;
      doc.fileType = req.file.mimetype;
      doc.fileSize = req.file.size;
      doc.uploadedAt = new Date();
      isExpiryChanged = true;
    }

    // Reset reminder status if expiry date or file changed
    if (isExpiryChanged) {
      doc.expiryReminder30Sent = false;
      doc.expiryReminder30SentAt = null;
      doc.expiryReminder30Recipient = '';
      doc.expiryReminder30Status = 'Pending';
      doc.expiryReminder30Error = '';
    }

    await doc.save();

    const formatted = await attachTenancyDetails(doc);

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete document from MongoDB and Cloudinary
// @route   DELETE /api/tenant-documents/:documentId
// @access  Private
const deleteTenantDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await TenantDocument.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (doc.publicId) {
      try {
        await deleteFromCloudinary(doc.publicId);
      } catch (e) {
        console.warn('[Cloudinary Delete Notice]', e.message);
      }
    }

    await TenantDocument.findByIdAndDelete(documentId);
    await Notification.deleteMany({ documentId });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant documents expiring within next 30 days
// @route   GET /api/tenant-documents/expiring-soon
// @access  Private
const getExpiringSoonDocuments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const documents = await TenantDocument.find({
      expiryDate: {
        $gte: today,
        $lte: thirtyDaysFromNow,
      },
    }).populate('tenantId', 'fullName name phone email type profileImage');

    const formattedDocs = await Promise.all(documents.map((doc) => attachTenancyDetails(doc)));

    res.status(200).json({
      success: true,
      count: formattedDocs.length,
      data: formattedDocs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expired tenant documents
// @route   GET /api/tenant-documents/expired
// @access  Private
const getExpiredDocuments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const documents = await TenantDocument.find({
      expiryDate: {
        $ne: null,
        $lt: today,
      },
    }).populate('tenantId', 'fullName name phone email type profileImage');

    const formattedDocs = await Promise.all(documents.map((doc) => attachTenancyDetails(doc)));

    res.status(200).json({
      success: true,
      count: formattedDocs.length,
      data: formattedDocs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Notification History for a document
// @route   GET /api/tenant-documents/:documentId/notification-history
// @access  Private
const getNotificationHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await TenantDocument.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const notifications = await Notification.find({ documentId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        documentId: doc._id,
        documentName: doc.documentName,
        expiryDate: doc.expiryDate,
        expiryReminder30Sent: doc.expiryReminder30Sent,
        expiryReminder30SentAt: doc.expiryReminder30SentAt,
        expiryReminder30Recipient: doc.expiryReminder30Recipient,
        expiryReminder30Status: doc.expiryReminder30Status,
        expiryReminder30Error: doc.expiryReminder30Error,
        notifications,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger or schedule a test document-expiry email (Test Mode)
// @route   POST /api/tenant-documents/test-email
// @access  Private
const triggerTestDocumentExpiryEmail = async (req, res) => {
  try {
    const { recipientEmail = 'rizwangul2426@gmail.com', sendNow = false, delayMinutes = 20 } = req.body;
    const { sendTestDocumentExpiryEmail, schedule20MinTestEmail } = require('../services/documentExpiryService');

    if (sendNow) {
      const emailResult = await sendTestDocumentExpiryEmail({ recipientEmail });
      return res.status(200).json({
        success: true,
        message: `Test email sent immediately to ${recipientEmail}`,
        data: emailResult,
      });
    }

    const scheduleResult = schedule20MinTestEmail(recipientEmail, delayMinutes);
    return res.status(200).json({
      success: true,
      data: scheduleResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadTenantDocument,
  getTenantDocuments,
  updateTenantDocument,
  deleteTenantDocument,
  getExpiringSoonDocuments,
  getExpiredDocuments,
  getNotificationHistory,
  triggerTestDocumentExpiryEmail,
};
