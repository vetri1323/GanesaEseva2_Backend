const mongoose = require('mongoose');

const formCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for form subcategories
formCategorySchema.virtual('subcategories', {
  ref: 'FormSubCategory',
  localField: '_id',
  foreignField: 'categoryId'
});

// Indexes
formCategorySchema.index({ name: 1 }, { unique: true });

const FormCategory = mongoose.model('FormCategory', formCategorySchema);

module.exports = FormCategory;
