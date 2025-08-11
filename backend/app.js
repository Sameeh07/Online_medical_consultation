const express = require('express');
const app = express();
const server = require('http').Server(app);
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

// Load env vars
dotenv.config({ path: './config.env' });

// Database connection
const connectDB = require('./config/db');
connectDB();

// Client origin (for both HTTP and WebSocket)
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:3000';

// --- Socket.IO setup with CORS ---
const io = require('socket.io')(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// --- HTTP CORS middleware ---
app.use(cors({
  origin: CLIENT_ORIGIN
}));

// Body parser & logger
app.use(express.json());
app.use(morgan('tiny'));

// Static folder for doctor images
app.use('/public/img/doctor', express.static(__dirname + '/public/img/doctor'));

// Routes
const doctorRoute         = require('./routes/doctorRoute');
const specializationRoute = require('./routes/specializationRoute');
const medicalRecordRoute  = require('./routes/medicalRecordRoute');
const patientRoute        = require('./routes/patientRoute');
const followUpRoute       = require('./routes/followUpRoute');
const staffRoute          = require('./routes/staffRoute');
const authRoute           = require('./routes/authRoute');

const api = process.env.API_URL || '/api/v1';
app.use(`${api}/doctor`,         doctorRoute);
app.use(`${api}/specialization`, specializationRoute);
app.use(`${api}/medicalRecord`,  medicalRecordRoute);
app.use(`${api}/patient`,        patientRoute);
app.use(`${api}/followUp`,       followUpRoute);
app.use(`${api}/staff`,          staffRoute);
app.use(`${api}/auth`,           authRoute);

// Socket middleware (handles rooms, presence, WebRTC signaling, etc.)
const useSocket = require('./helpers/useSocket');
useSocket(io);

// Base route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is Running' });
});

// 404 handler
const AppError = require('./helpers/appErrors');
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
const globalErrorHandler = require('./helpers/error-handler');
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
