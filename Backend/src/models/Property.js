const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Residential', 'Commercial', 'Mixed', 'Other'],
      default: 'Mixed',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: 'London',
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    totalUnits: {
      type: Number,
      default: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: '' },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Construction', 'Archived'],
      default: 'Active',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    archiveReason: {
      type: String,
      default: '',
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      required: [true, 'Landlord is required for every property'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

propertySchema.index({ name: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ landlordId: 1 });

// Virtual alias for propertyName
propertySchema.virtual('propertyName').get(function () {
  return this.name;
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
