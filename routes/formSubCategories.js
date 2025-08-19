const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const FormSubCategory = require('../models/FormSubCategory');
const FormCategory = require('../models/FormCategory');

// @route   GET api/form-subcategories
// @desc    Get all form subcategories with optional category filter
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { categoryId } = req.query;
    const query = {};
    
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const subcategories = await FormSubCategory.find(query)
      .populate('categoryId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(subcategories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/form-subcategories/:id
// @desc    Get form subcategory by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const subcategory = await FormSubCategory.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!subcategory) {
      return res.status(404).json({ msg: 'Form subcategory not found' });
    }

    res.json(subcategory);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Form subcategory not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/form-subcategories
// @desc    Create a form subcategory
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('categoryId', 'Category ID is required').not().isEmpty(),
      check('fields', 'Fields array is required').isArray()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, categoryId, description, fields } = req.body;

      // Check if category exists
      const category = await FormCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ msg: 'Form category not found' });
      }

      // Check if subcategory name is unique within the category
      const existingSubCategory = await FormSubCategory.findOne({ 
        name,
        categoryId 
      });

      if (existingSubCategory) {
        return res.status(400).json({ 
          errors: [{ msg: 'Form subcategory with this name already exists in the selected category' }] 
        });
      }

      // Validate fields
      for (const field of fields) {
        if (!field.name || !field.fieldType) {
          return res.status(400).json({ 
            errors: [{ msg: 'Field name and type are required for all fields' }] 
          });
        }

        if (['select', 'radio', 'checkbox'].includes(field.fieldType) && 
            (!field.options || field.options.length === 0)) {
          return res.status(400).json({ 
            errors: [{ 
              msg: `Options are required for field type: ${field.fieldType}` 
            }] 
          });
        }
      }

      // Create new subcategory
      const subcategory = new FormSubCategory({
        name,
        categoryId,
        description: description || '',
        fields,
        createdBy: req.user.id
      });

      await subcategory.save();
      
      // Populate the category and creator info before sending response
      const populatedSubcategory = await FormSubCategory
        .findById(subcategory._id)
        .populate('categoryId', 'name')
        .populate('createdBy', 'name email');

      res.json(populatedSubcategory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/form-subcategories/:id
// @desc    Update a form subcategory
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('categoryId', 'Category ID is required').not().isEmpty(),
      check('fields', 'Fields array is required').isArray()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, categoryId, description, fields, isActive } = req.body;

      // Check if subcategory exists
      let subcategory = await FormSubCategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ msg: 'Form subcategory not found' });
      }

      // Check if category exists
      const category = await FormCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ msg: 'Form category not found' });
      }

      // Check if name is already taken by another subcategory in the same category
      if (name !== subcategory.name || categoryId !== subcategory.categoryId.toString()) {
        const existingSubCategory = await FormSubCategory.findOne({ 
          name,
          categoryId,
          _id: { $ne: req.params.id }
        });

        if (existingSubCategory) {
          return res.status(400).json({ 
            errors: [{ msg: 'Form subcategory with this name already exists in the selected category' }] 
          });
        }
      }

      // Validate fields
      for (const field of fields) {
        if (!field.name || !field.fieldType) {
          return res.status(400).json({ 
            errors: [{ msg: 'Field name and type are required for all fields' }] 
          });
        }

        if (['select', 'radio', 'checkbox'].includes(field.fieldType) && 
            (!field.options || field.options.length === 0)) {
          return res.status(400).json({ 
            errors: [{ 
              msg: `Options are required for field type: ${field.fieldType}` 
            }] 
          });
        }
      }

      // Update subcategory
      const subcategoryFields = {
        name,
        categoryId,
        fields,
        updatedBy: req.user.id
      };

      if (description !== undefined) subcategoryFields.description = description;
      if (isActive !== undefined) subcategoryFields.isActive = isActive;

      subcategory = await FormSubCategory.findByIdAndUpdate(
        req.params.id,
        { $set: subcategoryFields },
        { new: true }
      )
      .populate('categoryId', 'name')
      .populate('updatedBy', 'name email');

      res.json(subcategory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/form-subcategories/:id
// @desc    Delete a form subcategory
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if subcategory exists
    const subcategory = await FormSubCategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Form subcategory not found' });
    }

    // TODO: Check if there are any forms using this subcategory
    // const forms = await Form.find({ subCategoryId: req.params.id });
    // if (forms.length > 0) {
    //   return res.status(400).json({ 
    //     errors: [{ 
    //       msg: 'Cannot delete subcategory with existing forms. Please delete or reassign the forms first.' 
    //     }] 
    //   });
    // }

    await FormSubCategory.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Form subcategory removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Form subcategory not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
