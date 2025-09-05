const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  service: {
    name: {
      type: String,
      required: true
    },
    description: String,
    duration: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  customerNotes: String,
  providerNotes: String,
  payment: {
    stripePaymentIntentId: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'cancelled'],
      default: 'pending'
    },
    paidAt: Date
  },
  location: {
    type: {
      type: String,
      enum: ['provider-location', 'customer-location', 'online'],
      default: 'provider-location'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'failed']
    }
  }],
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'provider', 'system']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  },
  rescheduleHistory: [{
    originalDate: Date,
    originalStartTime: String,
    originalEndTime: String,
    newDate: Date,
    newStartTime: String,
    newEndTime: String,
    reason: String,
    rescheduledAt: Date,
    rescheduledBy: {
      type: String,
      enum: ['customer', 'provider']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ customer: 1, appointmentDate: 1 });
bookingSchema.index({ provider: 1, appointmentDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });

// Virtual for appointment datetime
bookingSchema.virtual('appointmentDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  // Can cancel if more than 2 hours before appointment
  return hoursUntilAppointment > 2 && this.status === 'confirmed';
};

// Method to check if booking can be rescheduled
bookingSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  // Can reschedule if more than 4 hours before appointment
  return hoursUntilAppointment > 4 && this.status === 'confirmed';
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment > 24) {
    return this.payment.amount; // Full refund
  } else if (hoursUntilAppointment > 2) {
    return this.payment.amount * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
};

// Pre-save middleware to validate appointment date
bookingSchema.pre('save', function(next) {
  if (this.appointmentDate < new Date()) {
    return next(new Error('Appointment date cannot be in the past'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);

