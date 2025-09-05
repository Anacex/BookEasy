# Deployment Guide - BookEasy Platform

This guide will walk you through deploying the BookEasy appointment booking platform to Railway (backend) and Vercel (frontend).

## 🚀 Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Stripe Account**: Set up Stripe for payment processing
3. **Twilio Account**: For SMS OTP functionality
4. **Email Service**: Gmail or similar for notifications
5. **Cloudinary Account**: For image uploads (optional)

## 🔧 Backend Deployment (Railway)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Connect your repository

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select the root directory

### Step 3: Add MongoDB Service
1. In your Railway project, click "New"
2. Select "Database" → "MongoDB"
3. Wait for MongoDB to be provisioned
4. Copy the MongoDB connection string

### Step 4: Configure Environment Variables
In your Railway project settings, add these environment variables:

```env
# Database
MONGODB_URI=<your-railway-mongodb-connection-string>

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 5: Deploy
1. Railway will automatically detect your `package.json` in the server directory
2. It will install dependencies and start the server
3. Your backend will be available at `https://your-app.railway.app`

### Step 6: Configure Stripe Webhook
1. Go to your Stripe dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://your-app.railway.app/api/payments/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook secret to your environment variables

## 🎨 Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Import your repository

### Step 2: Configure Project
1. Select your repository
2. Set the following:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Environment Variables
Add these environment variables in Vercel:

```env
REACT_APP_API_URL=https://your-app.railway.app/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Your app will be available at `https://your-app.vercel.app`

## 🔄 Post-Deployment Configuration

### 1. Update CORS Settings
Ensure your backend CORS settings include your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'
  ],
  credentials: true
}));
```

### 2. Test the Application
1. Visit your Vercel URL
2. Try registering a new user
3. Test the OTP functionality
4. Create a test booking
5. Test payment processing

### 3. Set Up Custom Domain (Optional)
- In Vercel, go to your project settings
- Add your custom domain
- Update DNS records as instructed

## 🛠️ Troubleshooting

### Common Issues

#### Backend Issues
1. **MongoDB Connection Failed**
   - Check your MongoDB URI
   - Ensure MongoDB service is running in Railway

2. **Environment Variables Not Loading**
   - Verify all required variables are set
   - Check for typos in variable names

3. **Stripe Webhook Not Working**
   - Verify webhook URL is correct
   - Check webhook secret matches

#### Frontend Issues
1. **API Calls Failing**
   - Check REACT_APP_API_URL is correct
   - Verify CORS settings in backend

2. **Stripe Not Loading**
   - Check REACT_APP_STRIPE_PUBLISHABLE_KEY
   - Ensure it's the correct key (test vs live)

### Debugging Steps
1. Check Railway logs for backend errors
2. Check Vercel function logs for frontend errors
3. Use browser developer tools to debug API calls
4. Test API endpoints directly using Postman

## 📊 Monitoring

### Railway Monitoring
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for errors

### Vercel Monitoring
- Check function logs
- Monitor build status
- Set up error tracking

## 🔒 Security Checklist

- [ ] Use HTTPS for all communications
- [ ] Set strong JWT secrets
- [ ] Use production Stripe keys
- [ ] Enable CORS for specific domains only
- [ ] Set up rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Set up proper error handling

## 🚀 Scaling Considerations

### Database
- Consider MongoDB Atlas for production
- Set up database backups
- Monitor query performance

### Backend
- Use Railway's auto-scaling
- Set up load balancing if needed
- Monitor API response times

### Frontend
- Use Vercel's CDN
- Enable caching headers
- Optimize images and assets

## 📈 Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Caching**: Implement Redis for session storage
3. **CDN**: Use Vercel's global CDN
4. **Image Optimization**: Use Cloudinary for image processing
5. **Code Splitting**: Implement lazy loading in React

## 🔄 CI/CD Pipeline

### Automatic Deployments
- Railway: Auto-deploys on push to main branch
- Vercel: Auto-deploys on push to main branch

### Manual Deployments
- Use Railway CLI for backend deployments
- Use Vercel CLI for frontend deployments

## 📞 Support

If you encounter issues during deployment:

1. Check the logs in Railway/Vercel dashboards
2. Review this deployment guide
3. Check the main README for troubleshooting
4. Create an issue in the repository

---

**Happy Deploying! 🚀**

