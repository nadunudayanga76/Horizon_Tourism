const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
  // Ensure the Feedback collection is ready
  console.log('Database connected and Feedback system active');
});

// Route files
const auth = require('./routes/auth');
const residences = require('./routes/residences');
const reservations = require('./routes/reservations');
const transport = require('./routes/transport');
const tourGuides = require('./routes/tourGuides');
const payments = require('./routes/payments');
const drivers = require('./routes/drivers');
const transportBookings = require('./routes/transportBookings');
const reviews = require('./routes/reviews');
const reels = require('./routes/reels');

const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enable CORS
app.use(cors());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/residences', residences);
app.use('/api/reservations', reservations);
app.use('/api/transport', transport);
app.use('/api/guides', tourGuides);
app.use('/api/payments', payments);
app.use('/api/drivers', drivers);
app.use('/api/transport-bookings', transportBookings);
app.use('/api/reviews', reviews);
app.use('/api/reels', reels);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
});
