const mongoose = require('mongoose');

const formSubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormCategory',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'checkbox', 'radio', 'textarea'],
      required: true
    },
    options: [{
      type: String,
      trim: true
    }],
    required: {
      type: Boolean,
      default: false
    }
  }],
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
  timestamps: true
});

// Compound index to ensure unique subcategory names within a category
formSubCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

const FormSubCategory = mongoose.model('FormSubCategory', formSubCategorySchema);

module.exports = FormSubCategory;
