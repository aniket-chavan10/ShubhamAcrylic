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
    console.log('Connected to MySQL database for seeding T-Shirt & Apparel data.');

    await sequelize.sync({ alter: false });

    // 1. Site Settings
    console.log('Seeding Site Settings...');
    let settings = await SiteSettings.findOne();
    const settingsData = {
      companyName: 'Astitva Creations',
      logoUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
      whatsappNumber: '919876543210',
      email: 'info@astitvacreations.shop',
      phone: '+91 98765 43210',
      address: '123 Apparel Design Studio, Textile Hub, Mumbai, Maharashtra 400053',
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

    // 3. Categories (T-Shirt & Apparel specific)
    console.log('Seeding T-Shirt Categories...');
    const categoryList = [
      { name: 'Oversized T-Shirts', description: 'Heavyweight drop-shoulder 240 GSM streetwear tees.' },
      { name: 'Graphic & Vintage Printed Tees', description: 'Trendy screen printed and retro graphic t-shirts.' },
      { name: 'Custom Hoodies & Sweatshirts', description: '350 GSM premium fleece hoodies and embroidered sweatshirts.' },
      { name: 'Polo & Solid Classic Tees', description: 'Timeless pique knit polo shirts and 100% organic solid tees.' },
      { name: 'Custom Corporate & Event Apparel', description: 'Bulk customized printed t-shirts, jerseys, and uniforms.' },
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

    // 4. Products & Product Images (Clothing & T-Shirts)
    console.log('Seeding Apparel Products...');
    const productList = [
      {
        name: 'Urban Heavyweight Oversized Drop-Shoulder Tee',
        productCode: 'AC-TSH-01',
        description: 'Heavyweight drop-shoulder boxy fit t-shirt engineered for streetwear aesthetic. Crafted from 240 GSM pre-shrunk combed cotton with bio-wash finish.',
        price: 999,
        categoryId: categoriesMap['Oversized T-Shirts'],
        materialType: '240 GSM Heavyweight Combed Cotton',
        size: 'S, M, L, XL, XXL',
        color: 'Washed Charcoal Black',
        stockQuantity: 80,
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Cyberpunk Retro Vintage Graphic Tee',
        productCode: 'AC-TSH-02',
        description: 'Bold vintage graphic print tee featuring vibrant screen-printed artwork on an acid-wash backdrop. Super soft hand-feel and durable collar stitching.',
        price: 899,
        categoryId: categoriesMap['Graphic & Vintage Printed Tees'],
        materialType: '200 GSM 100% Super Combed Cotton',
        size: 'S, M, L, XL',
        color: 'Acid Wash Grey',
        stockQuantity: 65,
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Premium Plush Fleece Custom Oversized Hoodie',
        productCode: 'AC-HUD-03',
        description: 'Ultra-warm 350 GSM fleece hoodie with kangaroo pocket, double-layered hood, and ribbed cuffs. Ideal for winter and custom printing.',
        price: 1799,
        categoryId: categoriesMap['Custom Hoodies & Sweatshirts'],
        materialType: '350 GSM Heavy Fleece Terry',
        size: 'S, M, L, XL, XXL',
        color: 'Oatmeal Beige',
        stockQuantity: 45,
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Classic Pique Cotton Collared Polo Shirt',
        productCode: 'AC-POL-04',
        description: 'Timeless collared polo t-shirt with two-button placket and reinforced cuffs. Premium pique knit offers high breathability and sharp fit.',
        price: 1199,
        categoryId: categoriesMap['Polo & Solid Classic Tees'],
        materialType: '100% Pure Pique Knit Cotton',
        size: 'M, L, XL, XXL',
        color: 'Navy Blue',
        stockQuantity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1625910513413-562725e6488a?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1625910513413-562725e6488a?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Minimalist Essential Organic Solid White Tee',
        productCode: 'AC-TSH-05',
        description: 'The ultimate everyday wardrobe essential. Ultra-soft 180 GSM crew neck tee engineered for clean layering and maximum comfort.',
        price: 599,
        categoryId: categoriesMap['Polo & Solid Classic Tees'],
        materialType: '180 GSM Organic Bio-Washed Cotton',
        size: 'S, M, L, XL',
        color: 'Optic Pure White',
        stockQuantity: 120,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
        ]
      },
      {
        name: 'Custom DTG Printed Event & Corporate T-Shirt',
        productCode: 'AC-CST-06',
        description: 'Custom DTG printed t-shirt tailored for corporate events, college fests, and brand merchandise. Crack-resistant eco-friendly inks.',
        price: 699,
        categoryId: categoriesMap['Custom Corporate & Event Apparel'],
        materialType: '200 GSM Combed Bio-Washed Cotton',
        size: 'S, M, L, XL, XXL',
        color: 'Jet Matte Black',
        stockQuantity: 90,
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
        ]
      }
    ];

    for (const p of productList) {
      const { images, ...pData } = p;
      let [productRecord] = await Product.findOrCreate({
        where: { productCode: pData.productCode },
        defaults: pData,
      });
      await productRecord.update(pData);

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
    console.log('✅ Apparel Products & Images seeded.');

    // 5. Hero Banners (T-Shirts & Apparel)
    console.log('Seeding Hero Banners...');
    await Banner.destroy({ where: {} });
    await Banner.bulkCreate([
      {
        title: 'Premium Oversized & Streetwear Drop',
        subtitle: 'Heavyweight 240 GSM combed cotton t-shirts designed for relaxed boxy fit.',
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1400',
        link: '#products',
        isActive: true,
        order: 1,
      },
      {
        title: 'Custom DTG & Screen Printed Apparel',
        subtitle: 'High-definition vibrant prints on 100% organic bio-washed cotton tees.',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1400',
        link: '#products',
        isActive: true,
        order: 2,
      },
      {
        title: 'Custom Hoodies & Winter Collection',
        subtitle: '350 GSM plush fleece terry hoodies crafted for supreme warmth & style.',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1400',
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
          customerName: 'Karan Sharma',
          rating: 5,
          comment: 'The 240 GSM oversized fit is incredible! Thick fabric and perfect drop shoulder.',
        },
        {
          productId: firstProduct.id,
          customerName: 'Neha Verma',
          rating: 5,
          comment: 'Print quality is top notch and fabric is super soft. Definitely buying more!',
        },
      ]);
      console.log('✅ Reviews seeded.');
    }

    // 7. Enquiries
    console.log('Seeding Enquiries...');
    await Enquiry.destroy({ where: {} });
    await Enquiry.bulkCreate([
      {
        name: 'Rohan Mehta',
        email: 'rohan@collegefest.com',
        mobileNo: '9876543210',
        message: 'Looking for a bulk quote of 150 custom printed t-shirts for our annual college fest.',
        status: 'pending',
      },
      {
        name: 'Ananya Gupta',
        email: 'ananya@techcorp.com',
        mobileNo: '9820011223',
        message: 'Need customized embroidered fleece hoodies for our team in Bangalore.',
        status: 'resolved',
      },
    ]);
    console.log('✅ Enquiries seeded.');

    console.log('🎉 T-Shirt & Apparel Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
