# BookEasy - Local Testing Guide

This guide will help you run and test the BookEasy platform locally on your machine.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install-all

# Or install manually:
# Root dependencies
npm install

# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 2. Set Up Environment Variables

#### Backend Environment (.env)
Create `server/.env` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/appointment-booking

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# Twilio (Test Credentials)
TWILIO_ACCOUNT_SID=your_twilio_test_account_sid
TWILIO_AUTH_TOKEN=your_twilio_test_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend Environment (.env)
Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key
```

### 3. Start MongoDB

#### Option A: Local MongoDB
```bash
# Start MongoDB service
mongod

# Or if using MongoDB as a service:
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a cluster
- Get connection string
- Update `MONGODB_URI` in `server/.env`

### 4. Run the Application

#### Development Mode (Recommended)
```bash
# Run both backend and frontend concurrently
npm run dev
```

#### Or Run Separately
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## 🧪 Testing Scenarios

### 1. User Registration & Authentication

#### Test Customer Registration
1. Go to http://localhost:3000/register
2. Fill in registration form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +1234567890
   - Password: password123
3. Click "Create Account"
4. Check for OTP (if Twilio configured) or check console logs
5. Enter OTP: 123456 (for testing)
6. Verify account is created and logged in

#### Test Provider Registration
1. After customer registration, go to "Become a Provider"
2. Fill in provider form:
   - Business Name: John's Barber Shop
   - Bio: Professional haircuts and styling
   - Services: Add haircut service ($25, 30 minutes)
   - Location: Enter address details
3. Submit and verify provider profile is created

### 2. Search & Discovery

#### Test Provider Search
1. Go to http://localhost:3000/search
2. Search for services:
   - Service: "haircut"
   - City: "New York"
   - State: "NY"
3. Verify search results appear
4. Click on a provider to view profile

### 3. Booking System

#### Test Appointment Booking
1. From search results, click "View Profile"
2. Click "Book Appointment"
3. Select service and time slot
4. Add notes (optional)
5. Proceed to payment

#### Test Payment (Stripe Test Mode)
1. Use Stripe test card: 4242 4242 4242 4242
2. Expiry: Any future date
3. CVC: Any 3 digits
4. Complete payment
5. Verify booking confirmation

### 4. Booking Management

#### Test Customer Dashboard
1. Go to "My Bookings"
2. View upcoming appointments
3. Test cancel/reschedule functionality

#### Test Provider Dashboard
1. Go to "Provider Dashboard"
2. View booking requests
3. Test accept/complete booking actions

### 5. Admin Functions

#### Test Admin Dashboard
1. Create admin user in database (see below)
2. Go to "/admin/dashboard"
3. View system statistics
4. Test user management functions

## 🔧 Database Setup for Testing

### Create Test Data

#### 1. Create Admin User
```javascript
// Run in MongoDB shell or MongoDB Compass
use appointment-booking

db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@bookeasy.com",
  phone: "+1234567890",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8K8K8", // password: admin123
  role: "admin",
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### 2. Create Test Providers
```javascript
// Create test provider
db.providers.insertOne({
  user: ObjectId("USER_ID_HERE"), // Replace with actual user ID
  businessName: "Test Barber Shop",
  bio: "Professional haircuts and styling services",
  services: [{
    name: "Haircut",
    description: "Professional haircut and styling",
    duration: 30,
    price: 25,
    isActive: true
  }],
  location: {
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  },
  availability: {
    workingDays: [
      { day: "monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "wednesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "thursday", startTime: "09:00", endTime: "17:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "17:00", isAvailable: true }
    ]
  },
  isVerified: true,
  isActive: true,
  rating: { average: 4.5, count: 10 },
  totalBookings: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service or check connection string

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: 
```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in server/.env
PORT=5001
```

#### 3. CORS Error
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Check CORS configuration in `server/index.js`

#### 4. Stripe Error
```
Error: No such payment_intent: 'pi_xxx'
```
**Solution**: Use correct Stripe test keys and ensure webhook is configured

#### 5. Twilio SMS Error
```
Error: The 'To' number +1234567890 is not a valid phone number
```
**Solution**: Use real phone numbers for testing or mock SMS in development

### Debug Mode

#### Backend Debugging
```bash
# Run with debug logs
cd server
DEBUG=* npm run dev

# Or with specific debug
DEBUG=app:*,express:* npm run dev
```

#### Frontend Debugging
```bash
# Run with verbose logging
cd client
REACT_APP_DEBUG=true npm start
```

## 📊 API Testing with Postman

### Import API Collection
1. Download Postman
2. Import the API collection (create from the endpoints below)
3. Set base URL: `http://localhost:5000/api`

### Key Endpoints to Test

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - OTP verification
- `GET /auth/me` - Get current user

#### Providers
- `GET /providers/search` - Search providers
- `GET /providers/:id` - Get provider details
- `POST /providers/register` - Provider registration

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/customer` - Get customer bookings
- `GET /bookings/provider` - Get provider bookings

#### Payments
- `POST /payments/create-payment-intent` - Create payment intent
- `POST /payments/confirm-payment` - Confirm payment

## 🎯 Test Checklist

### Basic Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Provider registration works
- [ ] Search providers works
- [ ] View provider profile works
- [ ] Create booking works
- [ ] Payment processing works
- [ ] Booking management works

### Error Handling
- [ ] Invalid credentials show error
- [ ] Network errors are handled
- [ ] Form validation works
- [ ] API errors are displayed

### UI/UX
- [ ] Responsive design works
- [ ] Navigation works
- [ ] Forms are user-friendly
- [ ] Loading states work
- [ ] Success/error messages show

## 🚀 Production Testing

### Before Going Live
1. **Security Testing**
   - Test with real Stripe keys
   - Verify HTTPS works
   - Check authentication flows

2. **Performance Testing**
   - Test with multiple users
   - Check database performance
   - Monitor memory usage

3. **Integration Testing**
   - Test all external services
   - Verify webhook functionality
   - Check email/SMS delivery

---

**Happy Testing! 🧪**

If you encounter any issues, check the troubleshooting section or create an issue in the repository.

