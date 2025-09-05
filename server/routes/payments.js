const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const { sendBookingConfirmation } = require('../utils/notifications');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create a Stripe payment intent for a booking
// @access  Private (customer)
router.post('/create-payment-intent', [
  auth,
  body('bookingId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('customer', 'firstName lastName email')
      .populate('provider', 'businessName', { populate: { path: 'user', select: 'firstName lastName' } });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.payment.amount * 100), // Convert to cents
      currency: booking.payment.currency,
      metadata: {
        bookingId: booking._id.toString(),
        customerId: booking.customer._id.toString(),
        providerId: booking.provider._id.toString()
      },
      description: `Payment for ${booking.service.name} with ${booking.provider.businessName}`,
      receipt_email: booking.customer.email
    });

    // Update booking with payment intent ID
    booking.payment.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error during payment creation' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update booking status
// @access  Private (customer)
router.post('/confirm-payment', [
  auth,
  body('paymentIntentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Find booking by payment intent ID
    const booking = await Booking.findOne({
      'payment.stripePaymentIntentId': paymentIntentId
    }).populate('customer', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update booking payment status
    booking.payment.status = 'succeeded';
    booking.payment.paidAt = new Date();
    booking.status = 'confirmed';

    await booking.save();

    // Send confirmation email
    await sendBookingConfirmation(booking.customer, booking);

    res.json({
      message: 'Payment confirmed successfully',
      booking
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error during payment confirmation' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const booking = await Booking.findOne({
      'payment.stripePaymentIntentId': paymentIntent.id
    });

    if (booking && booking.payment.status === 'pending') {
      booking.payment.status = 'succeeded';
      booking.payment.paidAt = new Date();
      booking.status = 'confirmed';
      await booking.save();

      console.log(`Payment succeeded for booking ${booking._id}`);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    const booking = await Booking.findOne({
      'payment.stripePaymentIntentId': paymentIntent.id
    });

    if (booking && booking.payment.status === 'pending') {
      booking.payment.status = 'failed';
      booking.status = 'cancelled';
      await booking.save();

      console.log(`Payment failed for booking ${booking._id}`);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// @route   POST /api/payments/refund
// @desc    Process refund for cancelled booking
// @access  Private (provider or admin)
router.post('/refund', [
  auth,
  body('bookingId').isMongoId(),
  body('reason').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions
    const isProvider = req.user.role === 'provider' && booking.provider.toString() === req.provider?._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.payment.status !== 'succeeded') {
      return res.status(400).json({ message: 'No payment to refund' });
    }

    if (!booking.payment.stripePaymentIntentId) {
      return res.status(400).json({ message: 'No Stripe payment intent found' });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefund();
    
    if (refundAmount <= 0) {
      return res.status(400).json({ message: 'No refund available' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        bookingId: booking._id.toString(),
        reason: reason || 'Booking cancelled'
      }
    });

    // Update booking
    booking.cancellation.refundAmount = refundAmount;
    booking.cancellation.refundStatus = 'processed';
    await booking.save();

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Server error during refund processing' });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history for user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      query.provider = req.provider._id;
    }

    const bookings = await Booking.find({
      ...query,
      'payment.status': 'succeeded'
    })
      .populate('customer', 'firstName lastName')
      .populate('provider', 'businessName', { populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ 'payment.paidAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      ...query,
      'payment.status': 'succeeded'
    });

    res.json({
      payments: bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

