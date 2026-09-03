require('dotenv').config();
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const ProductImage = require('./models/ProductImage');
const Banner = require('./models/Banner');
const Enquiry = require('./models/Enquiry');
const Review = require('./models/Review');
const SiteSettings = require('./models/SiteSettings');

// Associations setup
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });
Enquiry.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database for seeding.');

    await sequelize.sync({ alter: false });

    // 1. Site Settings
    console.log('Seeding Site Settings...');
    let settings = await SiteSettings.findOne();
    const settingsData = {
      companyName: 'Astitva Creations',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      whatsappNumber: '919876543210',
      email: 'info@astitvacreations.com',
      phone: '+91 98765 43210',
      address: '123 Creative Industrial Estate, Andheri West, Mumbai, Maharashtra 400053',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.886471850785!2d72.833!3d19.13!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDA3JzQ4LjAiTiA3MsKwNTAnNDguMCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin',
      instagramUrl: 'https://instagram.com/astitvacreations',
      facebookUrl: 'https://facebook.com/astitvacreations',
      twitterUrl: 'https://twitter.com/astitvacreations',
      youtubeUrl: 'https://youtube.com/astitvacreations',
    };
    if (!settings) {
      await SiteSettings.create(settingsData);
    } else {
      await settings.update(settingsData);
    }
    console.log('✅ Site settings seeded.');

    // 2. Admin User
    console.log('Seeding Admin User...');
    const adminEmail = 'admin@astitvacreations.com';
    const adminUsername = 'admin';
    const adminPassword = 'p@sswor1';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    let admin = await User.findOne({ where: { username: adminUsername } });
    if (!admin) {
      admin = await User.findOne({ where: { email: adminEmail } });
    }

    if (!admin) {
      await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        isMaster: true,
      });
      console.log('✅ Admin created: admin@astitvacreations.com');
    } else {
      await admin.update({ username: adminUsername, email: adminEmail, password: hashedPassword, isMaster: true });
      console.log('✅ Admin updated: admin@astitvacreations.com');
    }

    // 3. Categories
    console.log('Seeding Categories...');
    const categoryList = [
      { name: 'Acrylic Display Stands & Holders', description: 'Countertop, leaflet, and product display holders.' },
      { name: 'Custom Acrylic Signages', description: 'LED edge-lit, 3D lettered, and door signboards.' },
      { name: 'Acrylic Sheets & Panels', description: 'Clear, frosted, colored, and mirror cast acrylic sheets.' },
      { name: 'Corporate Gifts & Trophies', description: 'Laser engraved award trophies and corporate mementos.' },
      { name: 'Custom Laser Cut Crafts', description: 'Modern home decor, wall clocks, and personalized gifts.' },
    ];

    const categoriesMap = {};
    for (const cat of categoryList) {
      let [categoryRecord] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
      });
      categoriesMap[cat.name] = categoryRecord.id;
    }
    console.log('✅ Categories seeded.');

    // 4. Products & Product Images
    console.log('Seeding Products...');
    const productList = [
      {
        name: 'Custom Edge-Lit LED Acrylic Signboard',
        productCode: 'AC-SIG-01',
        description: 'Vibrant custom edge-lit LED acrylic signboard for retail shops, offices, and modern interior decor. Engineered with high-transparency cast acrylic.',
        price: 2499,
        categoryId: categoriesMap['Custom Acrylic Signages'],
        materialType: 'Cast Acrylic & Aluminum Channel',
        size: '18 x 12 inches',
        color: 'RGB Multi-color LED',
        stockQuantity: 35,
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Clear Premium Cast Acrylic Sheet (4mm)',
        productCode: 'AC-SHT-02',
        description: 'High transparency 92% light transmission weather-resistant cast acrylic sheet. Ideal for fabrication, glazing, and protective barriers.',
        price: 1299,
        categoryId: categoriesMap['Acrylic Sheets & Panels'],
        materialType: '100% Virgin MMA Cast Acrylic',
        size: '8 x 4 feet',
        color: 'Crystal Clear',
        stockQuantity: 100,
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: '3-Tier Countertop Acrylic Product Display',
        productCode: 'AC-DSP-03',
        description: 'Crystal clear multi-tier acrylic display rack ideal for retail counters, cosmetics, jewelry, and showroom products.',
        price: 899,
        categoryId: categoriesMap['Acrylic Display Stands & Holders'],
        materialType: '3mm Clear Acrylic',
        size: '12 x 10 x 14 inches',
        color: 'Transparent',
        stockQuantity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Laser Engraved Custom Acrylic Award Trophy',
        productCode: 'AC-TRP-04',
        description: 'Laser-engraved custom memento trophy with polished bevel edges, metallic gold accents, and heavy wooden base.',
        price: 1799,
        categoryId: categoriesMap['Corporate Gifts & Trophies'],
        materialType: '10mm Optical Grade Acrylic',
        size: '10 inches height',
        color: 'Gold & Clear',
        stockQuantity: 40,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Geometric Modern Acrylic Wall Clock',
        productCode: 'AC-CFT-05',
        description: 'Modern minimalist silent wall clock crafted from high-gloss black and gold mirror acrylic layers with silent quartz movement.',
        price: 1499,
        categoryId: categoriesMap['Custom Laser Cut Crafts'],
        materialType: 'Mirror & Gloss Acrylic',
        size: '14 x 14 inches',
        color: 'Black & Mirror Gold',
        stockQuantity: 25,
        imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Custom Acrylic Nameplate with Brass Standoffs',
        productCode: 'AC-SIG-06',
        description: 'Weatherproof dual-layer acrylic door nameplate featuring elegant brass metallic standoffs and laser-etched lettering.',
        price: 999,
        categoryId: categoriesMap['Custom Acrylic Signages'],
        materialType: '5mm Frosted & Clear Acrylic',
        size: '12 x 6 inches',
        color: 'Frosted Glass Finish',
        stockQuantity: 60,
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&auto=format&fit=crop&q=80'
        ]
      }
    ];

    for (const p of productList) {
      const { images, ...pData } = p;
      let [productRecord] = await Product.findOrCreate({
        where: { productCode: pData.productCode },
        defaults: pData,
      });

      // Clear existing images for clean state
      await ProductImage.destroy({ where: { productId: productRecord.id } });
      if (images && images.length > 0) {
        for (const imgUrl of images) {
          await ProductImage.create({
            productId: productRecord.id,
            imageUrl: imgUrl,
          });
        }
      }
    }
    console.log('✅ Products & Product Images seeded.');

    // 5. Banners
    console.log('Seeding Hero Banners...');
    await Banner.destroy({ where: {} });
    await Banner.bulkCreate([
      {
        title: 'Bespoke Acrylic Signages & Displays',
        subtitle: 'Elevate your brand identity with precision laser-cut and LED edge-lit acrylic creations.',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1400',
        link: '#products',
        isActive: true,
        order: 1,
      },
      {
        title: 'Custom Industrial & Architectural Acrylics',
        subtitle: 'High optical clarity cast acrylic sheets cut to your exact dimensions and tolerances.',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=1400',
        link: '#products',
        isActive: true,
        order: 2,
      },
      {
        title: 'Corporate Trophies & Premium Mementos',
        subtitle: 'Custom laser engraved awards crafted with elegance, precision, and fine finishing.',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1400',
        link: '#products',
        isActive: true,
        order: 3,
      },
    ]);
    console.log('✅ Hero Banners seeded.');

    // 6. Reviews
    console.log('Seeding Product Reviews...');
    const firstProduct = await Product.findOne();
    if (firstProduct) {
      await Review.destroy({ where: {} });
      await Review.bulkCreate([
        {
          productId: firstProduct.id,
          customerName: 'Rajesh Kumar',
          rating: 5,
          comment: 'Outstanding quality and brilliant LED illumination! Arrived safely packed.',
        },
        {
          productId: firstProduct.id,
          customerName: 'Priya Sharma',
          rating: 5,
          comment: 'Extremely clean finishing and fast delivery. Very satisfied with Astitva Creations!',
        },
      ]);
      console.log('✅ Reviews seeded.');
    }

    // 7. Enquiries
    console.log('Seeding Enquiries...');
    await Enquiry.destroy({ where: {} });
    await Enquiry.bulkCreate([
      {
        name: 'Amit Patel',
        email: 'amit.patel@example.com',
        mobileNo: '9876543210',
        message: 'Looking for a bulk quote for 20 LED acrylic signboards for our retail store chain.',
        status: 'pending',
      },
      {
        name: 'Sneha Verma',
        email: 'sneha@designstudio.com',
        mobileNo: '9820011223',
        message: 'Need custom 8x4ft 5mm frosted acrylic sheets delivered to Pune location.',
        status: 'resolved',
      },
    ]);
    console.log('✅ Enquiries seeded.');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
