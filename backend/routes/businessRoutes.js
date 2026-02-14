import express from 'express';
import { body, validationResult } from 'express-validator';
import { Business, Queue, User, ActivityLog } from '../models/index.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/businesses
// @desc    Register a new business
// @access  Private (Owner only)
router.post('/', protect, requireRole('owner'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Business name is required'),
  body('category').isIn(['clinic', 'salon', 'bank', 'government', 'college', 'service_center', 'restaurant', 'repair_center', 'other']),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, description, category, address, contact, settings } = req.body;

    const business = await Business.create({
      name,
      description,
      category,
      address,
      contact,
      settings,
      owner: req.user._id
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { ownedBusinesses: business._id }
    });

    await ActivityLog.create({
      action: 'business_created',
      business: business._id,
      performedBy: { user: req.user._id, role: 'owner' },
      details: { metadata: { name, category } }
    });

    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      business
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses
// @desc    Get all businesses (with search)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const businesses = await Business.find(query)
      .populate('owner', 'name phone')
      .select('-staff')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Business.countDocuments(query);

    res.status(200).json({
      success: true,
      businesses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses/my-businesses
// @desc    Get businesses owned by current user
// @access  Private (Owner)
router.get('/my-businesses', protect, requireRole('owner'), async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user._id })
      .populate('staff.user', 'name phone');

    res.status(200).json({
      success: true,
      businesses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses/staff-businesses
// @desc    Get businesses where user is staff
// @access  Private (Staff)
router.get('/staff-businesses', protect, requireRole('staff'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'staffBusinesses.business',
      select: 'name category description'
    });

    res.status(200).json({
      success: true,
      businesses: user.staffBusinesses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses/:id
// @desc    Get single business
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('owner', 'name phone')
      .populate('staff.user', 'name');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const queues = await Queue.find({ business: business._id, isActive: true });

    res.status(200).json({
      success: true,
      business: {
        ...business.toObject(),
        queues
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/businesses/:id
// @desc    Update business
// @access  Private (Owner only)
router.put('/:id', protect, requireRole('owner'), async (req, res) => {
  try {
    const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found or not authorized' });
    }

    const updates = req.body;
    delete updates.owner;
    delete updates.staff;

    Object.assign(business, updates);
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/businesses/:id/staff
// @desc    Add staff to business
// @access  Private (Owner only)
router.post('/:id/staff', protect, requireRole('owner'), [
  body('phone').isMobilePhone()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { phone } = req.body;
    const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found or not authorized' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. They must register first.' });
    }

    if (user.role !== 'staff') {
      user.role = 'staff';
      await user.save();
    }

    const alreadyStaff = business.staff.find(s => s.user.toString() === user._id.toString());
    if (alreadyStaff) {
      return res.status(400).json({ success: false, message: 'User is already staff' });
    }

    business.staff.push({ user: user._id });
    await business.save();

    user.staffBusinesses.push({ business: business._id });
    await user.save();

    await ActivityLog.create({
      action: 'staff_assigned',
      business: business._id,
      performedBy: { user: req.user._id, role: 'owner' },
      details: { metadata: { staffId: user._id, staffName: user.name } }
    });

    res.status(200).json({
      success: true,
      message: 'Staff added successfully',
      staff: { id: user._id, name: user.name, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/businesses/:id/staff/:staffId
// @desc    Remove staff from business
// @access  Private (Owner only)
router.delete('/:id/staff/:staffId', protect, requireRole('owner'), async (req, res) => {
  try {
    const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found or not authorized' });
    }

    business.staff = business.staff.filter(s => s.user.toString() !== req.params.staffId);
    await business.save();

    await User.findByIdAndUpdate(req.params.staffId, {
      $pull: { staffBusinesses: { business: business._id } }
    });

    await ActivityLog.create({
      action: 'staff_removed',
      business: business._id,
      performedBy: { user: req.user._id, role: 'owner' },
      details: { metadata: { staffId: req.params.staffId } }
    });

    res.status(200).json({
      success: true,
      message: 'Staff removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
