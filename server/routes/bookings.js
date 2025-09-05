const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireProvider } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { sendBookingConfirmation, sendBookingReminder } = require('../utils/notifications');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (customer)
router.post('/', [
  auth,
  body('providerId').isMongoId(),
  body('serviceName').trim().notEmpty(),
  body('appointmentDate').isISO8601(),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerId, serviceName, appointmentDate, startTime, notes } = req.body;

    // Get provider and validate service
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const service = provider.services.find(s => s.name === serviceName && s.isActive);
    if (!service) {
      return res.status(400).json({ message: 'Service not found or inactive' });
    }

    // Calculate end time
    const startTimeDate = new Date(`2000-01-01T${startTime}`);
    const endTimeDate = new Date(startTimeDate.getTime() + service.duration * 60000);
    const endTime = endTimeDate.toTimeString().slice(0, 5);

    // Check if provider is available at the requested time
    const appointmentDateTime = new Date(appointmentDate);
    if (!provider.isAvailableAt(appointmentDateTime, startTime)) {
      return res.status(400).json({ message: 'Provider is not available at the requested time' });
    }

    // Check for existing bookings at the same time
    const existingBooking = await Booking.findOne({
      provider: providerId,
      appointmentDate: appointmentDateTime,
      startTime,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Create booking
    const booking = new Booking({
      customer: req.user._id,
      provider: providerId,
      service: {
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price
      },
      appointmentDate: appointmentDateTime,
      startTime,
      endTime,
      notes,
      payment: {
        amount: service.price,
        currency: 'usd',
        status: 'pending'
      }
    });

    await booking.save();

    // Populate booking with customer and provider details
    await booking.populate([
      { path: 'customer', select: 'firstName lastName email phone' },
      { path: 'provider', select: 'businessName', populate: { path: 'user', select: 'firstName lastName' } }
    ]);

    res.status(201).json({
      message: 'Booking created successfully. Please complete payment to confirm.',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error during booking creation' });
  }
});

// @route   GET /api/bookings/customer
// @desc    Get customer's bookings
// @access  Private (customer)
router.get('/customer', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('provider', 'businessName', { populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ appointmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/provider
// @desc    Get provider's bookings
// @access  Private (provider)
router.get('/provider', auth, requireProvider, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { provider: req.provider._id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'firstName lastName email phone')
      .sort({ appointmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking details
// @access  Private (customer or provider)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('provider', 'businessName', { populate: { path: 'user', select: 'firstName lastName' } });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isProvider = req.user.role === 'provider' && booking.provider._id.toString() === req.provider?._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private (provider)
router.put('/:id/status', [
  auth,
  requireProvider,
  body('status').isIn(['confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.provider._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    
    if (notes) {
      booking.providerNotes = notes;
    }

    await booking.save();

    // Send notifications based on status change
    if (status === 'confirmed' && oldStatus === 'pending') {
      await booking.populate('customer', 'firstName lastName email');
      await sendBookingConfirmation(booking.customer, booking);
    }

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private (customer or provider)
router.put('/:id/cancel', [
  auth,
  body('reason').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = req.user.role === 'provider' && booking.provider.toString() === req.provider?._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({ message: 'Booking cannot be cancelled at this time' });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: isCustomer ? 'customer' : 'provider',
      cancelledAt: new Date(),
      reason,
      refundAmount: booking.calculateRefund(),
      refundStatus: 'pending'
    };

    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/reschedule
// @desc    Reschedule a booking
// @access  Private (customer or provider)
router.put('/:id/reschedule', [
  auth,
  body('newDate').isISO8601(),
  body('newStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('reason').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newDate, newStartTime, reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can reschedule this booking
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = req.user.role === 'provider' && booking.provider.toString() === req.provider?._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!booking.canBeRescheduled()) {
      return res.status(400).json({ message: 'Booking cannot be rescheduled at this time' });
    }

    // Get provider and validate new time slot
    const provider = await Provider.findById(booking.provider);
    const newAppointmentDate = new Date(newDate);
    
    if (!provider.isAvailableAt(newAppointmentDate, newStartTime)) {
      return res.status(400).json({ message: 'Provider is not available at the requested time' });
    }

    // Check for existing bookings at the new time
    const existingBooking = await Booking.findOne({
      provider: booking.provider,
      appointmentDate: newAppointmentDate,
      startTime: newStartTime,
      status: { $in: ['confirmed', 'pending'] },
      _id: { $ne: booking._id }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Add to reschedule history
    booking.rescheduleHistory.push({
      originalDate: booking.appointmentDate,
      originalStartTime: booking.startTime,
      originalEndTime: booking.endTime,
      newDate: newAppointmentDate,
      newStartTime,
      newEndTime: booking.endTime, // Keep same duration
      reason,
      rescheduledAt: new Date(),
      rescheduledBy: isCustomer ? 'customer' : 'provider'
    });

    // Update booking
    booking.appointmentDate = newAppointmentDate;
    booking.startTime = newStartTime;

    await booking.save();

    res.json({
      message: 'Booking rescheduled successfully',
      booking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

