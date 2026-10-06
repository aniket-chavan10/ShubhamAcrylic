require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import all models (to register them with Sequelize before sync)
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const ProductImage = require('./models/ProductImage');
const Banner = require('./models/Banner');
const Enquiry = require('./models/Enquiry');
const Review = require('./models/Review');
const SiteSettings = require('./models/SiteSettings');
const Garment = require('./models/Garment');
const Order = require('./models/Order');
require('./models/EmailOtp');
const Invoice = require('./models/Invoice');

// ── Associations ────────────────────────────────────────────────────────────
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });
Enquiry.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.belongsTo(Garment, { foreignKey: 'garmentId', as: 'garment', constraints: false });
Invoice.belongsTo(Order, { foreignKey: 'orderId', as: 'order', constraints: false });

const app = express();
const path = require('path');

// Behind nginx: needed so req.ip is the real client IP (used for OTP rate limits)
app.set('trust proxy', 1);

// ── Middleware ──────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : true; // Allow all origins in development
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Serve uploaded images locally ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const garmentRoutes = require('./routes/garmentRoutes');
const otpRoutes = require('./routes/otpRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const garmentController = require('./controllers/garmentController');

app.get('/', (req, res) => res.send('Backend API is running (MySQL)'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', siteSettingsRoutes);
app.use('/api/garments', garmentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);

// ── Error handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack || err);
  // Multer validation errors (file type / size / count) are client errors
  const status = err.name === 'MulterError' || /must be|only image/i.test(err.message) ? 400 : 500;
  res.status(status).json({ message: err.message });
});

// ── DB Sync + Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ MySQL connected and tables synced');

    // Seed default site settings if none exist
    const count = await SiteSettings.count();
    if (count === 0) {
      await SiteSettings.create({ companyName: 'Astitva Creations' });
      console.log('✅ Default site settings created');
    }
    await garmentController.seedDefaults();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1);
  });
