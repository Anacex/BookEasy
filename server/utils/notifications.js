const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP via SMS
const sendOTP = async (phoneNumber, otp) => {
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log('OTP sent successfully:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

// Send email notification
const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (customer, booking) => {
  const subject = 'Booking Confirmation';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Hello ${customer.firstName},</p>
      <p>Your appointment has been confirmed with the following details:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Appointment Details</h3>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Date:</strong> ${new Date(booking.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Duration:</strong> ${booking.service.duration} minutes</p>
        <p><strong>Total Amount:</strong> $${booking.payment.amount}</p>
      </div>
      
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to cancel or reschedule, please do so at least 2 hours in advance.</p>
      
      <p>Thank you for choosing our service!</p>
    </div>
  `;

  return sendEmail(customer.email, subject, html);
};

// Send booking reminder
const sendBookingReminder = async (customer, booking) => {
  const subject = 'Appointment Reminder';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Reminder</h2>
      <p>Hello ${customer.firstName},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Appointment Details</h3>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Date:</strong> ${new Date(booking.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
      </div>
      
      <p>We look forward to seeing you!</p>
    </div>
  `;

  return sendEmail(customer.email, subject, html);
};

// Send booking cancellation notification
const sendBookingCancellation = async (customer, booking, reason) => {
  const subject = 'Booking Cancelled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Cancelled</h2>
      <p>Hello ${customer.firstName},</p>
      <p>Your appointment has been cancelled:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Appointment</h3>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Date:</strong> ${new Date(booking.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      
      <p>If you have any questions, please contact us.</p>
    </div>
  `;

  return sendEmail(customer.email, subject, html);
};

module.exports = {
  sendOTP,
  sendEmail,
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation
};

