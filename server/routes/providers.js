const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireRole, requireProvider } = require('../middleware/auth');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');

const router = express.Router();

// @route   POST /api/providers/register
// @desc    Register as a service provider
// @access  Private (authenticated user)
router.post('/register', [
  auth,
  requireRole(['customer']), // Only customers can become providers
  body('businessName').trim().isLength({ min: 2 }),
  body('bio').optional().isLength({ max: 500 }),
  body('services').isArray({ min: 1 }),
  body('services.*.name').trim().notEmpty(),
  body('services.*.description').optional(),
  body('services.*.duration').isInt({ min: 15 }),
  body('services.*.price').isFloat({ min: 0 }),
  body('location.address.street').trim().notEmpty(),
  body('location.address.city').trim().notEmpty(),
  body('location.address.state').trim().notEmpty(),
  body('location.address.zipCode').trim().notEmpty(),
  body('location.address.country').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is already a provider
    const existingProvider = await Provider.findOne({ user: req.user._id });
    if (existingProvider) {
      return res.status(400).json({ message: 'User is already a provider' });
    }

    const {
      businessName,
      bio,
      services,
      location,
      workingDays = []
    } = req.body;

    // Create provider profile
    const provider = new Provider({
      user: req.user._id,
      businessName,
      bio,
      services,
      location,
      availability: {
        workingDays
      }
    });

    await provider.save();

    // Update user role to provider
    await User.findByIdAndUpdate(req.user._id, { role: 'provider' });

    res.status(201).json({
      message: 'Provider registration successful',
      provider: {
        id: provider._id,
        businessName: provider.businessName,
        bio: provider.bio,
        services: provider.services,
        location: provider.location,
        isVerified: provider.isVerified
      }
    });
  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).json({ message: 'Server error during provider registration' });
  }
});

// @route   GET /api/providers/search
// @desc    Search for providers by service and location
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const {
      service,
      city,
      state,
      latitude,
      longitude,
      radius = 10,
      page = 1,
      limit = 10,
      sortBy = 'rating'
    } = req.query;

    let query = { isActive: true, isVerified: true };

    // Service filter
    if (service) {
      query['services.name'] = { $regex: service, $options: 'i' };
    }

    // Location filter
    if (city && state) {
      query['location.address.city'] = { $regex: city, $options: 'i' };
      query['location.address.state'] = { $regex: state, $options: 'i' };
    }

    // Geographic search
    if (latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1609.34 // Convert miles to meters
        }
      };
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      case 'distance':
        sort = { 'location.coordinates': 1 };
        break;
      case 'price':
        sort = { 'services.price': 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const providers = await Provider.find(query)
      .populate('user', 'firstName lastName profileImage')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-availability.timeSlots');

    const total = await Provider.countDocuments(query);

    res.json({
      providers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Provider search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// @route   GET /api/providers/:id
// @desc    Get provider details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('user', 'firstName lastName profileImage')
      .select('-availability.timeSlots');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/providers/:id/availability
// @desc    Get provider availability for a date range
// @access  Public
router.get('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const availability = {};

    // Generate availability for each date in range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      availability[dateStr] = provider.getAvailableSlots(new Date(date));
    }

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/providers/profile
// @desc    Update provider profile
// @access  Private (provider only)
router.put('/profile', [
  auth,
  requireProvider,
  body('businessName').optional().trim().isLength({ min: 2 }),
  body('bio').optional().isLength({ max: 500 }),
  body('services').optional().isArray(),
  body('location').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const provider = await Provider.findByIdAndUpdate(
      req.provider._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName profileImage');

    res.json({
      message: 'Profile updated successfully',
      provider
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/providers/availability
// @desc    Update provider availability
// @access  Private (provider only)
router.put('/availability', [
  auth,
  requireProvider,
  body('workingDays').optional().isArray(),
  body('blockedDates').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { workingDays, blockedDates } = req.body;
    const updates = {};

    if (workingDays) {
      updates['availability.workingDays'] = workingDays;
    }

    if (blockedDates) {
      updates['availability.blockedDates'] = blockedDates;
    }

    const provider = await Provider.findByIdAndUpdate(
      req.provider._id,
      { $set: updates },
      { new: true }
    );

    res.json({
      message: 'Availability updated successfully',
      availability: provider.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/providers/dashboard/stats
// @desc    Get provider dashboard statistics
// @access  Private (provider only)
router.get('/dashboard/stats', auth, requireProvider, async (req, res) => {
  try {
    const providerId = req.provider._id;

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ provider: providerId });
    const completedBookings = await Booking.countDocuments({ 
      provider: providerId, 
      status: 'completed' 
    });
    const pendingBookings = await Booking.countDocuments({ 
      provider: providerId, 
      status: 'confirmed' 
    });

    // Get revenue statistics
    const revenueResult = await Booking.aggregate([
      { $match: { provider: providerId, 'payment.status': 'succeeded' } },
      { $group: { _id: null, totalRevenue: { $sum: '$payment.amount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent bookings
    const recentBookings = await Booking.find({ provider: providerId })
      .populate('customer', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalBookings,
        completedBookings,
        pendingBookings,
        totalRevenue,
        averageRating: req.provider.rating.average,
        totalReviews: req.provider.rating.count
      },
      recentBookings
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

