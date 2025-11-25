// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


// Basic test route
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const enquiryRoutes = require("./routes/enquiryRoutes");
app.use("/api/enquiries", enquiryRoutes);


app.use((err, req, res, next) => {
  console.error('Express error:', err.stack || err);
  res.status(500).json({ message: err.message, error: err });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
