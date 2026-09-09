const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadTenantDocument,
  getTenantDocuments,
  updateTenantDocument,
  deleteTenantDocument,
  getExpiringSoonDocuments,
  getExpiredDocuments,
  getNotificationHistory,
  triggerTestDocumentExpiryEmail,
} = require('../controllers/tenantDocumentController');

// Standalone Document Expiring / Expired Alert Endpoints
router.get('/tenant-documents/expiring-soon', protect, getExpiringSoonDocuments);
router.get('/tenant-documents/expired', protect, getExpiredDocuments);
router.get('/tenant-documents/:documentId/notification-history', protect, getNotificationHistory);
router.post('/tenant-documents/test-email', protect, triggerTestDocumentExpiryEmail);

// Document Mutation Endpoints by documentId
router.put('/tenant-documents/:documentId', protect, upload.single('file'), updateTenantDocument);
router.delete('/tenant-documents/:documentId', protect, deleteTenantDocument);

// Tenant specific Document Endpoints
router.post('/tenants/:tenantId/documents', protect, upload.single('file'), uploadTenantDocument);
router.get('/tenants/:tenantId/documents', protect, getTenantDocuments);

module.exports = router;
