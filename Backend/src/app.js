import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import bedRequestRoutes from './routes/bedRequestRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import bloodBankRoutes from './routes/bloodBankRoutes.js';
import bloodRequestRoutes from './routes/bloodRequestRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import dietPlanRoutes from './routes/dietPlanRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware (Allow up to 5MB for profile picture uploads)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'MediSync AI backend is running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/bed-requests', bedRequestRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/blood-bank', bloodBankRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
