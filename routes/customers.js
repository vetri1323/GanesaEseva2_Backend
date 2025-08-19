import express from 'express';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { 'address.line1': { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } },
        { 'address.state': { $regex: q, $options: 'i' } }
      ]
    };
    
    const customers = await Customer.find(searchQuery)
      .select('name phone email address')
      .limit(10);
      
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    console.log('Received customer data:', JSON.stringify(req.body, null, 2));
    
    // Prepare customer data
    const customerData = { ...req.body };
    
    // Handle serviceCategoryUrl - trim and ensure it's undefined if empty
    if (customerData.serviceCategoryUrl) {
      customerData.serviceCategoryUrl = customerData.serviceCategoryUrl.trim();
      if (customerData.serviceCategoryUrl === '') {
        delete customerData.serviceCategoryUrl;
      } else if (!customerData.serviceCategoryUrl.startsWith('http')) {
        customerData.serviceCategoryUrl = `https://${customerData.serviceCategoryUrl}`;
      }
    }
    
    // Create customer with the processed data
    const customer = new Customer(customerData);
    
    console.log('Customer document to save:', JSON.stringify(customer, null, 2));
    
    // Validate the document before saving
    const validationError = customer.validateSync();
    if (validationError) {
      console.error('Validation error details:');
      const errors = {};
      Object.keys(validationError.errors).forEach(key => {
        errors[key] = validationError.errors[key].message;
        console.error(`- ${key}: ${validationError.errors[key].message}`);
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    // Save the customer
    const savedCustomer = await customer.save();
    console.log('Customer saved successfully:', savedCustomer);
    
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Error creating customer:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      stack: error.stack
    });
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: 'Duplicate key error',
        message: `${field} already exists`,
        field
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: 'Server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating customer with data:', JSON.stringify(req.body, null, 2));
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle serviceCategoryUrl - trim and ensure it's undefined if empty
    if (updateData.serviceCategoryUrl !== undefined) {
      if (updateData.serviceCategoryUrl && updateData.serviceCategoryUrl.trim() !== '') {
        updateData.serviceCategoryUrl = updateData.serviceCategoryUrl.trim();
        // Ensure it has a protocol
        if (!updateData.serviceCategoryUrl.startsWith('http')) {
          updateData.serviceCategoryUrl = `https://${updateData.serviceCategoryUrl}`;
        }
      } else {
        // If empty string or null, set to undefined to allow default/removal
        updateData.serviceCategoryUrl = undefined;
      }
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    console.log('Successfully updated customer:', customer);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: 'Duplicate key error',
        message: `${field} already exists`,
        field
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: 'Server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
