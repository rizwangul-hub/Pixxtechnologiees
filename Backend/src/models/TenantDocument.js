const mongoose = require('mongoose');

const tenantDocumentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['standard', 'custom'],
      default: 'standard',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    originalFileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    expiryReminder30Sent: {
      type: Boolean,
      default: false,
    },
    expiryReminder30SentAt: {
      type: Date,
      default: null,
    },
    expiryReminder30Recipient: {
      type: String,
      default: '',
    },
    expiryReminder30Status: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending',
    },
    expiryReminder30Error: {
      type: String,
      default: '',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast lookup & deduplication
tenantDocumentSchema.index({ tenantId: 1, documentName: 1 });
tenantDocumentSchema.index({ expiryDate: 1 });

/**
 * Virtual Helper: Dynamic Expiry Status Calculation
 * Statuses: 'No Expiry Date' | 'Valid' | 'Expiring Soon' | 'Expired'
 */
tenantDocumentSchema.virtual('status').get(function () {
  if (!this.expiryDate) return 'No Expiry Date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(this.expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  return 'Valid';
});

/**
 * Virtual Helper: Days Remaining until expiry
 */
tenantDocumentSchema.virtual('daysRemaining').get(function () {
  if (!this.expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(this.expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const TenantDocument = mongoose.model('TenantDocument', tenantDocumentSchema);

module.exports = TenantDocument;
