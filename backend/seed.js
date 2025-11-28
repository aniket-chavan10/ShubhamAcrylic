const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const sampleProducts = [
    {
        name: "Clear Acrylic Sheet - 3mm",
        description: "Premium quality transparent acrylic sheet perfect for various applications including displays, signage, and protective barriers. Crystal clear finish with excellent light transmission.",
        price: 1200,
        category: "Acrylic Sheets",
        materialType: "Cast Acrylic",
        size: "4x8 feet",
        color: "Clear",
        weight: 15,
        stockQuantity: 50,
        tags: ["clear", "transparent", "3mm", "sheet"],
        imageUrl: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&auto=format&fit=crop"
    },
    {
        name: "Frosted Acrylic Sheet - 5mm",
        description: "Elegant frosted acrylic sheet with a satin finish. Ideal for privacy screens, decorative panels, and diffused lighting applications.",
        price: 1800,
        category: "Acrylic Sheets",
        materialType: "Extruded Acrylic",
        size: "4x6 feet",
        color: "Frosted White",
        weight: 18,
        stockQuantity: 35,
        tags: ["frosted", "white", "5mm", "privacy"],
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop"
    },
    {
        name: "Colored Acrylic Sheet - Red",
        description: "Vibrant red colored acrylic sheet with excellent UV resistance. Perfect for signage, displays, and decorative applications requiring bold colors.",
        price: 1500,
        category: "Acrylic Sheets",
        materialType: "Cast Acrylic",
        size: "4x8 feet",
        color: "Red",
        weight: 16,
        stockQuantity: 25,
        tags: ["colored", "red", "vibrant", "signage"],
        imageUrl: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800&auto=format&fit=crop"
    },
    {
        name: "Acrylic Display Stand - Desktop",
        description: "Modern desktop display stand made from premium clear acrylic. Perfect for showcasing products, menus, or informational materials in retail and office environments.",
        price: 850,
        category: "Furniture",
        materialType: "Cast Acrylic",
        size: "12x8 inches",
        color: "Clear",
        weight: 2,
        stockQuantity: 100,
        tags: ["display", "stand", "desktop", "clear"],
        imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop"
    },
    {
        name: "Acrylic Shelf Bracket Set",
        description: "Set of 4 floating shelf brackets made from strong acrylic material. Minimalist design that creates an illusion of floating shelves. Supports up to 10kg per bracket.",
        price: 2200,
        category: "Furniture",
        materialType: "Cast Acrylic",
        size: "10 inch length",
        color: "Clear",
        weight: 3,
        stockQuantity: 60,
        tags: ["shelf", "bracket", "floating", "hardware"],
        imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop"
    },
    {
        name: "Modern Acrylic Coffee Table",
        description: "Contemporary coffee table crafted from thick premium acrylic. Features clean lines and exceptional clarity. A statement piece that adds modern elegance to any living space.",
        price: 12500,
        category: "Furniture",
        materialType: "Cast Acrylic",
        size: "36x24x18 inches",
        color: "Clear",
        weight: 25,
        stockQuantity: 8,
        tags: ["furniture", "table", "coffee table", "modern"],
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop"
    },
    {
        name: "Acrylic Photo Frame - Wall Mount",
        description: "Elegant wall-mounted acrylic photo frame with magnetic closure. Holds photos or artwork between two acrylic panels for a floating display effect. Available in multiple sizes.",
        price: 950,
        category: "Decor",
        materialType: "Cast Acrylic",
        size: "8x10 inches",
        color: "Clear",
        weight: 1.5,
        stockQuantity: 120,
        tags: ["frame", "photo", "wall mount", "decor"],
        imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop"
    },
    {
        name: "Decorative Acrylic Vase Set",
        description: "Set of 3 modern geometric acrylic vases in different sizes. Perfect for fresh or artificial flowers. The clear design showcases stems beautifully and complements any décor style.",
        price: 1650,
        category: "Decor",
        materialType: "Cast Acrylic",
        size: "Various (8, 10, 12 inches)",
        color: "Clear",
        weight: 2.5,
        stockQuantity: 45,
        tags: ["vase", "decorative", "set", "geometric"],
        imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&auto=format&fit=crop"
    },
    {
        name: "LED Acrylic Name Plate",
        description: "Customizable LED-backlit acrylic name plate for offices and homes. Premium engraving with energy-efficient LED lighting creates an elegant, professional look.",
        price: 2800,
        category: "Decor",
        materialType: "Cast Acrylic with LED",
        size: "18x6 inches",
        color: "Clear with LED",
        weight: 3,
        stockQuantity: 30,
        tags: ["nameplate", "LED", "custom", "office"],
        imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop"
    },
    {
        name: "Black Acrylic Sheet - 6mm",
        description: "Solid black acrylic sheet with a glossy finish. Excellent for high-contrast displays, modern furniture, and architectural applications. UV stable and weather resistant.",
        price: 2100,
        category: "Acrylic Sheets",
        materialType: "Cast Acrylic",
        size: "4x8 feet",
        color: "Black",
        weight: 20,
        stockQuantity: 40,
        tags: ["black", "glossy", "6mm", "sheet"],
        imageUrl: "https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?w=800&auto=format&fit=crop"
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample products
        await Product.insertMany(sampleProducts);
        console.log('Sample products added successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
