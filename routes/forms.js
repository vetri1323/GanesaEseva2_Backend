import express from 'express';
import { check, validationResult } from 'express-validator';
import Form from '../models/Form.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/forms
// @desc    Get all forms
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const forms = await Form.find().sort({ name: 1 });
    res.json(forms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/forms
// @desc    Create or update form
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('url', 'URL is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const { name, url } = req.body;

      // Check if form with same name or URL already exists
      let form = await Form.findOne({
        $or: [{ name }, { url }]
      });

      // If updating existing form
      if (req.body.id) {
        form = await Form.findById(req.body.id);
        if (!form) {
          return res.status(404).json({ msg: 'Form not found' });
        }

        // Check if another form with the same name or URL exists
        const existingForm = await Form.findOne({
          _id: { $ne: req.body.id },
          $or: [{ name }, { url }]
        });

        if (existingForm) {
          return res.status(400).json({ msg: 'A form with this name or URL already exists' });
        }

        form.name = name;
        form.url = url;
        await form.save();
        return res.json(form);
      }

      // If creating new form
      if (form) {
        return res.status(400).json({ msg: 'A form with this name or URL already exists' });
      }

      form = new Form({
        name,
        url
      });

      await form.save();
      res.json(form);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if form exists
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
