import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import VerifyOTP from './pages/VerifyOTP';
import Admin from './pages/Admin';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchProviders from './pages/SearchProviders';
import NotFound from './pages/NotFound';

// Placeholder pages for missing components
const Dashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Dashboard - Coming Soon</h1></div>;
const ProviderProfile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Provider Profile - Coming Soon</h1></div>;
const BookingForm = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Booking Form - Coming Soon</h1></div>;
const MyBookings = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">My Bookings - Coming Soon</h1></div>;
const ProviderDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Provider Dashboard - Coming Soon</h1></div>;
const ProviderRegistration = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Provider Registration - Coming Soon</h1></div>;
const AdminDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Admin Dashboard - Coming Soon</h1></div>;
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Profile - Coming Soon</h1></div>;

function App() {
  return (
    <AuthProvider>
      <StripeProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/verify-otp" element={<VerifyOTP />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="search" element={<SearchProviders />} />
              <Route path="provider/:id" element={<ProviderProfile />} />
            </Route>

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="booking/:providerId" element={<BookingForm />} />
            </Route>

            {/* Provider routes */}
            <Route path="/provider" element={<ProtectedRoute requireRole="provider"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="register" element={<ProviderRegistration />} />
            </Route>

                         {/* Admin routes */}
             <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Layout /></ProtectedRoute>}>
               <Route path="dashboard" element={<AdminDashboard />} />
               <Route index element={<Admin />} />
             </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </StripeProvider>
    </AuthProvider>
  );
}

export default App;
