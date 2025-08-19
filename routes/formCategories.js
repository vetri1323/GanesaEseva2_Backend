const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const FormCategory = require('../models/FormCategory');

// @route   GET api/form-categories
// @desc    Get all form categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await FormCategory.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/form-categories
// @desc    Create a form category
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').optional()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;

      // Check if category already exists
      let category = await FormCategory.findOne({ name });
      if (category) {
        return res.status(400).json({ errors: [{ msg: 'Form category already exists' }] });
      }

      // Create new category
      category = new FormCategory({
        name,
        description: description || '',
        createdBy: req.user.id
      });

      await category.save();
      res.json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/form-categories/:id
// @desc    Update a form category
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').optional()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, isActive } = req.body;

      // Check if category exists
      let category = await FormCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ msg: 'Form category not found' });
      }

      // Check if name is already taken by another category
      if (name !== category.name) {
        const existingCategory = await FormCategory.findOne({ name });
        if (existingCategory) {
          return res.status(400).json({ errors: [{ msg: 'Form category with this name already exists' }] });
        }
      }

      // Update category
      const categoryFields = {
        name,
        updatedBy: req.user.id
      };

      if (description !== undefined) categoryFields.description = description;
      if (isActive !== undefined) categoryFields.isActive = isActive;

      category = await FormCategory.findByIdAndUpdate(
        req.params.id,
        { $set: categoryFields },
        { new: true }
      );

      res.json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/form-categories/:id
// @desc    Delete a form category
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if category exists
    const category = await FormCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Form category not found' });
    }

    // Check if there are any subcategories
    const subcategories = await FormSubCategory.find({ categoryId: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json({ 
        errors: [{ 
          msg: 'Cannot delete category with existing subcategories. Please delete subcategories first.' 
        }] 
      });
    }

    await FormCategory.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Form category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
