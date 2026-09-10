const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Landlord',
      required: [true, 'Landlord is required for every property'],
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'Shop',
      trim: true,
    },
    assetType: {
      type: String,
      default: function () {
        return this.type || 'Shop';
      },
      trim: true,
    },
    floor: {
      type: String,
      default: 'Ground',
      trim: true,
    },
    size: {
      type: String,
      default: '',
      trim: true,
    },
    sizeUnit: {
      type: String,
      default: 'sq ft',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyRent: {
      type: Number,
      default: function () {
        return this.price || 0;
      },
    },
    salePrice: {
      type: Number,
      default: 0,
    },
    priceType: {
      type: String,
      enum: ['monthly_rent', 'sale', 'other'],
      default: 'monthly_rent',
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
    county: {
      type: String,
      default: '',
      trim: true,
    },
    postcode: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: 'United Kingdom',
      trim: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    agentFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Available',
      trim: true,
    },
    assetStatus: {
      type: String,
      default: function () {
        return this.status === 'Active' ? 'Available' : this.status;
      },
      trim: true,
    },
    customerName: {
      type: String,
      default: null,
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

propertySchema.index({ landlordId: 1 });
propertySchema.index({ name: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ type: 1 });

// Virtual aliases for backward compatibility
propertySchema.virtual('propertyName').get(function () {
  return this.name;
});

propertySchema.virtual('propertyType').get(function () {
  return this.type;
});

propertySchema.virtual('unitName').get(function () {
  return this.name;
});

propertySchema.virtual('unitNumber').get(function () {
  return this.name;
});

propertySchema.virtual('unitType').get(function () {
  return this.type;
});

propertySchema.pre('save', function (next) {
  if (this.isModified('price') && !this.isModified('monthlyRent')) {
    this.monthlyRent = this.price;
  }
  if (this.isModified('monthlyRent') && !this.isModified('price')) {
    this.price = this.monthlyRent;
  }
  if (!this.assetType && this.type) {
    this.assetType = this.type;
  }
  if (this.status === 'Active') {
    this.status = 'Available';
  }
  if (this.status === 'Occupied') {
    this.assetStatus = 'Occupied';
  } else if (this.assetStatus === 'Occupied' && this.status !== 'Occupied') {
    this.status = 'Occupied';
  } else if (!this.assetStatus) {
    this.assetStatus = this.status;
  }
  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
