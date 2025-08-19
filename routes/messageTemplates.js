import express from 'express';
import MessageTemplate from '../models/MessageTemplate.js';

const router = express.Router();

// Get all message templates
router.get('/', async (req, res) => {
  try {
    const templates = await MessageTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching message templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new message template
router.post('/', async (req, res) => {
  try {
    const { name, subject, content, type = 'ALERT' } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({ message: 'Name, subject, and content are required' });
    }

    const template = new MessageTemplate({
      name,
      subject,
      content,
      type
    });

    const savedTemplate = await template.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    console.error('Error creating message template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a message template
router.put('/:id', async (req, res) => {
  try {
    const { name, subject, content, type } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (content) updateData.content = content;
    if (type) updateData.type = type;

    const updatedTemplate = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Message template not found' });
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating message template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message template
router.delete('/:id', async (req, res) => {
  try {
    const deletedTemplate = await MessageTemplate.findByIdAndDelete(req.params.id);
    
    if (!deletedTemplate) {
      return res.status(404).json({ message: 'Message template not found' });
    }

    res.json({ message: 'Message template deleted successfully' });
  } catch (error) {
    console.error('Error deleting message template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send test message
router.post('/:id/test', async (req, res) => {
  try {
    const template = await MessageTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Message template not found' });
    }

    // In a real application, you would send the email/sms here
    // For now, we'll just log it and return a success response
    console.log('Test message would be sent with template:', {
      to: req.user?.email || 'test@example.com', // In a real app, this would come from the authenticated user
      subject: template.subject,
      content: template.content
    });

    res.json({ 
      success: true, 
      message: 'Test message sent successfully',
      template: {
        subject: template.subject,
        content: template.content
      }
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
