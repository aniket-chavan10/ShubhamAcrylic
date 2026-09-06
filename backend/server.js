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

// ── Associations ────────────────────────────────────────────────────────────
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });
Enquiry.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

const app = express();
const path = require('path');

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

app.get('/', (req, res) => res.send('Backend API is running (MySQL)'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', siteSettingsRoutes);

// ── Error handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack || err);
  res.status(500).json({ message: err.message, error: err });
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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1);
  });
