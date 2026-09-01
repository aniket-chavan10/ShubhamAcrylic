require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const sequelize = require('./config/database');
const Product = require('./models/Product');
const Category = require('./models/Category');
const ProductImage = require('./models/ProductImage');

const uploadDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Download image helper
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadDir, filename);
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filename).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(`/uploads/products/${filename}`));
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
};

const sampleJerseys = [
  {
    name: "India Cricket T20 Official Jersey 2024",
    description: "Premium Dri-FIT Indian Cricket Team match jersey. Lightweight, sweat-wicking polyester fabric designed for intense performance and comfort.",
    price: 1499,
    categoryName: "Cricket Jerseys",
    sportType: "Cricket",
    fabric: "Dri-FIT",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    gender: "Men",
    fitType: "Athletic",
    isCustomizable: true,
    color: "Blue & Orange",
    stockQuantity: 150,
    tags: ["cricket", "india", "t20", "blue", "jersey"],
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Real Madrid Home Kit Jersey 24/25",
    description: "Iconic white gold-accented Football Jersey. Breathable mesh fabric for ultra ventilation and freedom of movement.",
    price: 1899,
    categoryName: "Football Jerseys",
    sportType: "Football",
    fabric: "Polyester",
    availableSizes: ["M", "L", "XL"],
    gender: "Unisex",
    fitType: "Regular",
    isCustomizable: true,
    color: "White & Gold",
    stockQuantity: 80,
    tags: ["football", "real madrid", "la liga", "white"],
    imageUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Pro Basketball Sleeveless Jersey - Lakers Edition",
    description: "High-performance basketball jersey. Deep armholes, lightweight double-knit fabric for quick cuts and basketball drills.",
    price: 1299,
    categoryName: "Basketball Jerseys",
    sportType: "Basketball",
    fabric: "Mesh",
    availableSizes: ["L", "XL", "XXL"],
    gender: "Men",
    fitType: "Loose",
    isCustomizable: true,
    color: "Yellow & Purple",
    stockQuantity: 65,
    tags: ["basketball", "lakers", "nba", "yellow"],
    imageUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Women's Marathon Running T-Shirt",
    description: "Ergonomic ultra-lightweight running tee with reflective details for nighttime safety and non-chafing seams.",
    price: 899,
    categoryName: "Athletics & Training",
    sportType: "Athletics",
    fabric: "Cotton Blend",
    availableSizes: ["XS", "S", "M", "L"],
    gender: "Women",
    fitType: "Slim",
    isCustomizable: false,
    color: "Neon Pink",
    stockQuantity: 120,
    tags: ["running", "marathon", "women", "pink", "training"],
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Custom Team Volleyball Jersey",
    description: "Durable stretch-fit volleyball jersey with reinforced stitching. Add custom team name and squad numbers on request.",
    price: 999,
    categoryName: "Volleyball Jerseys",
    sportType: "Volleyball",
    fabric: "Dri-FIT",
    availableSizes: ["S", "M", "L", "XL"],
    gender: "Unisex",
    fitType: "Athletic",
    isCustomizable: true,
    color: "Navy & Turquoise",
    stockQuantity: 90,
    tags: ["volleyball", "team", "custom", "navy"],
    imageUrl: "https://images.unsplash.com/photo-1508801239166-4335a0799358?w=800&auto=format&fit=crop&q=80",
  }
];

const seedJerseys = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL DB.');

    await sequelize.sync({ alter: true });

    let codeCounter = 101;

    for (const item of sampleJerseys) {
      // Find or create category
      let [cat] = await Category.findOrCreate({
        where: { name: item.categoryName },
        defaults: {
          name: item.categoryName,
          slug: item.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: `${item.categoryName} collection`,
        }
      });

      const productCode = `ST-${codeCounter++}`;
      const imgFileName = `seed-${Date.now()}-${codeCounter}.jpg`;

      console.log(`Downloading sample image for ${item.name}...`);
      let localImgPath = null;
      try {
        localImgPath = await downloadImage(item.imageUrl, imgFileName);
      } catch (err) {
        console.warn(`Failed downloading ${item.imageUrl}, using fallback url`, err.message);
        localImgPath = item.imageUrl;
      }

      const product = await Product.create({
        productCode,
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: cat.id,
        sportType: item.sportType,
        fabric: item.fabric,
        availableSizes: item.availableSizes,
        gender: item.gender,
        fitType: item.fitType,
        isCustomizable: item.isCustomizable,
        color: item.color,
        stockQuantity: item.stockQuantity,
        tags: item.tags,
      });

      if (localImgPath) {
        await ProductImage.create({
          productId: product.id,
          imageUrl: localImgPath,
          imageOrder: 0,
          isMain: true,
        });
      }

      console.log(`✅ Created Product: ${product.name} [${productCode}]`);
    }

    console.log('\n🎉 Jersey seeding complete!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedJerseys();
