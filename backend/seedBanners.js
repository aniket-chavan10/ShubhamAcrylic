const mongoose = require('mongoose');
require('dotenv').config();
const Banner = require('./models/Banner');

const seedBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dummyBanners = [
            {
                title: 'Trendy Graphic Tees Collection',
                subtitle: 'Express yourself with 100% organic cotton printed t-shirts',
                imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=1200',
                link: '#products',
                isActive: true,
                order: 1
            },
            {
                title: 'Urban Streetwear Oversized Drop',
                subtitle: 'Heavyweight 240 GSM tees designed for modern relaxed comfort',
                imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1200',
                link: '#products',
                isActive: true,
                order: 2
            },
            {
                title: 'Custom Printed Apparel',
                subtitle: 'Personalized designs, high definition prints, and bulk options',
                imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1200',
                link: '#products',
                isActive: true,
                order: 3
            }
        ];

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('Cleared existing banners');

        // Insert new banners
        await Banner.insertMany(dummyBanners);
        console.log('Added T-shirt promotional banners');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding banners:', error);
        process.exit(1);
    }
};

seedBanners();
