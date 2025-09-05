# BookEasy - Appointment Booking Platform

A comprehensive web-based platform that connects customers with local service providers for seamless appointment booking. Built with Node.js, Express, React, and MongoDB.

## 🚀 Features

### For Customers
- **User Registration & Login**: OTP-based authentication with phone/email
- **Search & Browse**: Find service providers by service type and location
- **Easy Booking**: Select providers, choose time slots, and book appointments
- **Secure Payments**: Stripe integration for safe online payments
- **Booking Management**: View, cancel, or reschedule appointments
- **Reviews & Ratings**: Leave feedback after appointments

### For Service Providers
- **Provider Registration**: Set up business profiles with services and pricing
- **Availability Management**: Calendar interface to set available time slots
- **Booking Management**: View, accept, cancel, or complete bookings
- **Payment Tracking**: Monitor completed bookings and payments
- **Profile Management**: Update services, pricing, and business information

### For Administrators
- **Dashboard**: Overview of users, providers, bookings, and revenue
- **User Management**: Manage customer and provider accounts
- **Provider Verification**: Verify and approve provider accounts
- **System Monitoring**: Track platform performance and usage

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Stripe** for payment processing
- **Twilio** for SMS OTP
- **Nodemailer** for email notifications
- **Cloudinary** for image uploads

### Frontend
- **React** with React Router
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Hook Form** for form management
- **Stripe Elements** for payment forms
- **Lucide React** for icons

### Deployment
- **Railway** for backend hosting
- **Vercel** for frontend hosting
- **MongoDB Atlas** for database

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Stripe account
- Twilio account (for SMS)
- Email service (Gmail, etc.)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd appointment-booking-platform
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, client)
npm run install-all
```

### 3. Environment Configuration

#### Backend (.env)
```bash
# Copy the example file
cp server/env.example server/.env

# Edit server/.env with your configuration
```

Required environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/appointment-booking

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Frontend (.env)
```bash
# Copy the example file
cp client/env.example client/.env

# Edit client/.env with your configuration
```

Required environment variables:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 4. Run the Application

#### Development Mode
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only
npm run client
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the backend
npm run server
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Providers
- `GET /api/providers/search` - Search providers
- `GET /api/providers/:id` - Get provider details
- `POST /api/providers/register` - Provider registration
- `PUT /api/providers/profile` - Update provider profile

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/customer` - Get customer bookings
- `GET /api/bookings/provider` - Get provider bookings
- `PUT /api/bookings/:id/status` - Update booking status

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook

## 🚀 Deployment

### Backend Deployment (Railway)

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Deploy Backend**
   - Create a new project
   - Add MongoDB service
   - Deploy from GitHub
   - Set environment variables in Railway dashboard

3. **Configure Environment Variables**
   ```bash
   MONGODB_URI=<railway-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   STRIPE_SECRET_KEY=<your-stripe-secret>
   # ... other variables
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub repository

2. **Deploy Frontend**
   - Import project from GitHub
   - Set build command: `npm run build`
   - Set output directory: `build`

3. **Configure Environment Variables**
   ```bash
   REACT_APP_API_URL=<your-railway-backend-url>
   REACT_APP_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
   ```

## 📱 Usage

### For Customers
1. **Register/Login**: Create account with email/phone and verify with OTP
2. **Search Services**: Use the search page to find providers by service and location
3. **Book Appointment**: Select provider, choose service, pick time slot, and pay
4. **Manage Bookings**: View, cancel, or reschedule appointments from dashboard

### For Providers
1. **Register as Provider**: Complete provider registration with business details
2. **Set Availability**: Configure working hours and available time slots
3. **Manage Bookings**: Accept, complete, or cancel customer bookings
4. **Track Payments**: Monitor completed bookings and revenue

### For Administrators
1. **Access Admin Dashboard**: View platform statistics and user activity
2. **Manage Users**: Approve providers, manage user accounts
3. **Monitor System**: Track bookings, payments, and platform health

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Phone number verification via SMS
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **HTTPS**: Secure communication with SSL/TLS
- **Stripe Security**: PCI-compliant payment processing

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📊 Performance

- **Database Indexing**: Optimized MongoDB queries with proper indexing
- **Caching**: React Query for efficient data caching
- **Image Optimization**: Cloudinary for optimized image delivery
- **Code Splitting**: React lazy loading for better performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@bookeasy.com or create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with calendar apps
- [ ] Video consultation support
- [ ] Loyalty program
- [ ] Advanced search filters

## 📸 Screenshots

*Screenshots will be added after deployment*

---

**Built with ❤️ for seamless appointment booking**

