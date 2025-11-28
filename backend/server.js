// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack || err);
  res.status(500).json({ message: err.message, error: err });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
