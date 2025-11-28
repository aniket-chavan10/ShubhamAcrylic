const mongoose = require('mongoose');
const Banner = require('./models/Banner');
require('dotenv').config();

const sampleBanners = [
    {
        title: "Premium Acrylic Sheets",
        subtitle: "Crystal clear quality for all your creative projects",
        imageUrl: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=1920&auto=format&fit=crop&q=80",
        link: "#products",
        isActive: true,
        order: 1
    },
    {
        title: "Modern Acrylic Furniture",
        subtitle: "Elevate your space with contemporary designs",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&auto=format&fit=crop&q=80",
        link: "#products",
        isActive: true,
        order: 2
    },
    {
        title: "Custom Acrylic Solutions",
        subtitle: "Tailored to your exact specifications",
        imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1920&auto=format&fit=crop&q=80",
        link: "#contact",
        isActive: true,
        order: 3
    }
];

const seedBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('Cleared existing banners');

        // Insert sample banners
        await Banner.insertMany(sampleBanners);
        console.log('Sample banners added successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding banners:', error);
        process.exit(1);
    }
};

seedBanners();
