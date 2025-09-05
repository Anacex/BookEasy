const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  services: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    duration: {
      type: Number,
      required: true,
      min: 15 // minimum 15 minutes
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  location: {
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
    },
    serviceRadius: {
      type: Number,
      default: 10 // miles
    }
  },
  availability: {
    workingDays: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    blockedDates: [{
      date: Date,
      reason: String
    }],
    timeSlots: [{
      date: Date,
      slots: [{
        startTime: String,
        endTime: String,
        isBooked: {
          type: Boolean,
          default: false
        }
      }]
    }]
  },
  stripeAccountId: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImages: [String],
  documents: [{
    type: String, // 'license', 'certification', 'insurance'
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for location-based searches
providerSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full address
providerSchema.virtual('fullAddress').get(function() {
  const addr = this.location.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to check if provider is available at specific time
providerSchema.methods.isAvailableAt = function(date, time) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const workingDay = this.availability.workingDays.find(day => day.day === dayName);
  
  if (!workingDay || !workingDay.isAvailable) {
    return false;
  }
  
  // Check if date is blocked
  const isBlocked = this.availability.blockedDates.some(blocked => 
    blocked.date.toDateString() === date.toDateString()
  );
  
  if (isBlocked) {
    return false;
  }
  
  // Check if time is within working hours
  const requestedTime = new Date(`2000-01-01T${time}`);
  const startTime = new Date(`2000-01-01T${workingDay.startTime}`);
  const endTime = new Date(`2000-01-01T${workingDay.endTime}`);
  
  return requestedTime >= startTime && requestedTime < endTime;
};

// Method to get available time slots for a date
providerSchema.methods.getAvailableSlots = function(date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const workingDay = this.availability.workingDays.find(day => day.day === dayName);
  
  if (!workingDay || !workingDay.isAvailable) {
    return [];
  }
  
  // Check if date is blocked
  const isBlocked = this.availability.blockedDates.some(blocked => 
    blocked.date.toDateString() === date.toDateString()
  );
  
  if (isBlocked) {
    return [];
  }
  
  // Generate time slots based on working hours
  const slots = [];
  const startTime = new Date(`2000-01-01T${workingDay.startTime}`);
  const endTime = new Date(`2000-01-01T${workingDay.endTime}`);
  const slotDuration = 30; // 30 minutes per slot
  
  let currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    
    if (slotEnd <= endTime) {
      slots.push({
        startTime: currentTime.toTimeString().slice(0, 5),
        endTime: slotEnd.toTimeString().slice(0, 5),
        isAvailable: true
      });
    }
    
    currentTime = slotEnd;
  }
  
  return slots;
};

module.exports = mongoose.model('Provider', providerSchema);

