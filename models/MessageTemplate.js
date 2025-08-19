import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['ALERT', 'NOTIFICATION', 'PROMOTIONAL'],
    default: 'ALERT'
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

// Update the updatedAt field before saving
messageTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

export default MessageTemplate;
