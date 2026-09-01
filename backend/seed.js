const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
require('dotenv').config();

const sampleProducts = [
    {
        name: "Urban Streetwear Oversized Tee",
        description: "Heavyweight drop-shoulder oversized t-shirt designed for maximum comfort and streetwear aesthetic. Crafted from 240 GSM pre-shrunk combed cotton.",
        price: 899,
        category: "Oversized Tees",
        materialType: "240 GSM Heavyweight Cotton",
        size: "S, M, L, XL, XXL",
        color: "Washed Black",
        weight: 0.3,
        stockQuantity: 75,
        tags: ["oversized", "streetwear", "heavyweight", "washed black", "cotton"],
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop"
    },
    {
        name: "Cyberpunk Vintage Graphic Tee",
        description: "Bold vintage graphic print tee featuring vibrant screen printed artwork on an acid wash backdrop. Soft hand-feel and durable bio-wash finish.",
        price: 999,
        category: "Graphic Tees",
        materialType: "100% Super Combed Cotton",
        size: "S, M, L, XL",
        color: "Acid Wash Charcoal",
        weight: 0.25,
        stockQuantity: 60,
        tags: ["graphic", "vintage", "cyberpunk", "acid wash", "trending"],
        imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop"
    },
    {
        name: "Classic Pique Cotton Polo T-Shirt",
        description: "Timeless collared polo t-shirt with two-button placket and ribbed cuffs. Premium pique knit offers breathability and a sharp silhouette.",
        price: 1199,
        category: "Polo T-Shirts",
        materialType: "100% Pure Pique Cotton",
        size: "M, L, XL, XXL",
        color: "Navy Blue",
        weight: 0.35,
        stockQuantity: 50,
        tags: ["polo", "classic", "formal", "navy", "collared"],
        imageUrl: "https://images.unsplash.com/photo-1625910513413-562725e6488a?w=800&auto=format&fit=crop"
    },
    {
        name: "Minimalist Essential White Crew Neck",
        description: "The ultimate wardrobe essential. Ultra-soft 180 GSM crew neck tee engineered for clean layering and everyday everyday comfort.",
        price: 599,
        category: "Solid & Basic Tees",
        materialType: "180 GSM Organic Bio-Washed Cotton",
        size: "S, M, L, XL",
        color: "Optic White",
        weight: 0.2,
        stockQuantity: 120,
        tags: ["basic", "solid", "white", "minimalist", "everyday"],
        imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop"
    },
    {
        name: "Japanese Anime Printed Oversized Tee",
        description: "Exclusive anime graphic front and back print. Relaxed boxy fit cut from thick french terry cotton with reinforced collar seam.",
        price: 1099,
        category: "Custom Printed Tees",
        materialType: "220 GSM Premium French Terry",
        size: "S, M, L, XL, XXL",
        color: "Off-White / Beige",
        weight: 0.3,
        stockQuantity: 40,
        tags: ["anime", "custom print", "oversized", "streetwear", "beige"],
        imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop"
    },
    {
        name: "Retro Sunset Typographic Graphic Tee",
        description: "Vibrant retro sunset graphic print tee. Crafted with breathable ring-spun cotton that gets softer with every wash.",
        price: 799,
        category: "Graphic Tees",
        materialType: "100% Combed Ring-Spun Cotton",
        size: "S, M, L, XL",
        color: "Olive Green",
        weight: 0.22,
        stockQuantity: 85,
        tags: ["retro", "sunset", "typography", "olive green", "graphic"],
        imageUrl: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop"
    },
    {
        name: "Pro Performance Dry-Fit Athletic Tee",
        description: "Moisture-wicking activewear tee designed for gym, sports, and outdoors. 4-way stretch fabric guarantees complete freedom of movement.",
        price: 699,
        category: "Solid & Basic Tees",
        materialType: "Polyester-Spandex Active Stretch",
        size: "S, M, L, XL",
        color: "Jet Black",
        weight: 0.18,
        stockQuantity: 90,
        tags: ["dry fit", "activewear", "gym", "black", "breathable"],
        imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop"
    },
    {
        name: "Textured Striped Casual Polo",
        description: "Elevated smart-casual polo with subtle horizontal stripe pattern and ribbed collar. Soft touch fabric ideal for casual outings.",
        price: 1299,
        category: "Polo T-Shirts",
        materialType: "Ribbed Cotton Blend",
        size: "M, L, XL",
        color: "Maroon & White Stripe",
        weight: 0.32,
        stockQuantity: 35,
        tags: ["polo", "striped", "casual", "premium", "ribbed"],
        imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop"
    },
    {
        name: "Custom Personalized Photo Print Tee",
        description: "High-definition direct-to-garment (DTG) print t-shirt. Customizable with your own graphics, photos, or custom quote.",
        price: 849,
        category: "Custom Printed Tees",
        materialType: "100% Premium Cotton (DTG Ready)",
        size: "S, M, L, XL, XXL",
        color: "Custom Colors",
        weight: 0.24,
        stockQuantity: 150,
        tags: ["custom", "personalized", "photo print", "gift", "unisex"],
        imageUrl: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop"
    },
    {
        name: "Aesthetic Abstract Line Art Tee",
        description: "Modern minimalist abstract artwork printed on rich terracotta fabric. Soft-touch pigment print with drop-shoulder fit.",
        price: 949,
        category: "Graphic Tees",
        materialType: "200 GSM Soft Touch Cotton",
        size: "S, M, L, XL",
        color: "Terracotta Earth",
        weight: 0.26,
        stockQuantity: 45,
        tags: ["abstract", "line art", "aesthetic", "terracotta", "trendy"],
        imageUrl: "https://images.unsplash.com/photo-1608389168343-ba8aa0eb3a63?w=800&auto=format&fit=crop"
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Create Category mapping
        const categoryNames = [...new Set(sampleProducts.map(p => p.category))];
        const categoryMap = {};

        for (const catName of categoryNames) {
            let category = await Category.findOne({ name: catName });
            if (!category) {
                const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                category = new Category({
                    name: catName,
                    slug,
                    description: `Premium ${catName} Collection`,
                    isActive: true
                });
                await category.save();
                console.log(`Created Category: ${catName}`);
            }
            categoryMap[catName] = category._id;
        }

        // Map product category strings to Category ObjectIds
        const productsToInsert = sampleProducts.map(p => ({
            ...p,
            category: categoryMap[p.category]
        }));

        // Insert sample products
        await Product.insertMany(productsToInsert);
        console.log('Sample T-Shirt products added successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
