import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
formSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field on update operations
formSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

export default mongoose.model('Form', formSchema);
